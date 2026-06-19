import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

async function syncTeacherLoad(supabase: any, teacherLoadId: string) {
  if (!teacherLoadId) return;

  // 1. Fetch all schedule entries linked to this teacher_load_id
  const { data: entries, error: entriesErr } = await supabase
    .from('schedule_entries')
    .select('time_slot_id')
    .eq('teacher_load_id', teacherLoadId);

  if (entriesErr) {
    console.error('Error fetching entries for sync:', entriesErr);
    return;
  }

  // 2. Fetch all time slots to calculate total hours
  const { data: timeSlots, error: slotsErr } = await supabase
    .from('time_slots')
    .select('id, duration_minutes');

  if (slotsErr) {
    console.error('Error fetching time slots for sync:', slotsErr);
    return;
  }

  const slotDurationMap = new Map<string, number>(
    (timeSlots || []).map((s: any) => [s.id, Number(s.duration_minutes) || 0])
  );
  let totalPlacedHours = 0;
  if (entries) {
    for (const entry of entries) {
      const duration = slotDurationMap.get(entry.time_slot_id) || 0;
      totalPlacedHours += duration / 60;
    }
  }

  // 3. Fetch the required hours from the teacher load
  const { data: load, error: loadErr } = await supabase
    .from('teacher_loads')
    .select('required_hours_per_week')
    .eq('id', teacherLoadId)
    .single();

  if (loadErr || !load) {
    console.error('Error fetching teacher load for sync:', loadErr);
    return;
  }

  // 4. Calculate the new placement status
  let finalStatus: 'fully_placed' | 'partially_placed' | 'not_placed' = 'not_placed';
  if (Math.abs(totalPlacedHours - load.required_hours_per_week) < 0.01) {
    finalStatus = 'fully_placed';
  } else if (totalPlacedHours > 0) {
    finalStatus = 'partially_placed';
  }

  // 5. Update the teacher load with the new status and hours
  const { error: updateErr } = await supabase
    .from('teacher_loads')
    .update({
      placed_hours: totalPlacedHours,
      placement_status: finalStatus
    })
    .eq('id', teacherLoadId);

  if (updateErr) {
    console.error('Error updating teacher load sync status:', updateErr);
  }
}

export async function GET() {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('schedule_entries')
    .select('*');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createServerClient();
  try {
    const body = await request.json();
    const { teacher_id, section_id, subject_id, time_slot_id, day } = body;

    if (!teacher_id || !section_id || !subject_id || !time_slot_id || !day) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate that the teaching load exists for this teacher, subject, and section combination
    const { data: teacherLoad, error: loadError } = await supabase
      .from('teacher_loads')
      .select('id')
      .eq('teacher_id', teacher_id)
      .eq('subject_id', subject_id)
      .eq('section_id', section_id)
      .maybeSingle();

    if (loadError) {
      return NextResponse.json({ error: loadError.message }, { status: 500 });
    }

    if (!teacherLoad) {
      return NextResponse.json(
        { error: 'No teaching load exists for this teacher, subject, and section combination.' },
        { status: 400 }
      );
    }

    // Check if there is an existing entry for this section, day, and time_slot
    const { data: existing, error: checkError } = await supabase
      .from('schedule_entries')
      .select('*')
      .eq('section_id', section_id)
      .eq('time_slot_id', time_slot_id)
      .eq('day', day)
      .maybeSingle();

    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    let result;
    if (existing) {
      // Update it
      const { data, error } = await supabase
        .from('schedule_entries')
        .update({ teacher_id, subject_id, source: 'manual', teacher_load_id: teacherLoad.id })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        // Handle teacher double booking unique violation
        if (error.code === '23505') {
          return NextResponse.json(
            { error: 'Teacher is already scheduled to teach another section at this day and time.' },
            { status: 409 }
          );
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      result = data;

      // Sync the new load
      await syncTeacherLoad(supabase, teacherLoad.id);
      // Sync the old load if it changed
      if (existing.teacher_load_id && existing.teacher_load_id !== teacherLoad.id) {
        await syncTeacherLoad(supabase, existing.teacher_load_id);
      }
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('schedule_entries')
        .insert([{ teacher_id, section_id, subject_id, time_slot_id, day, source: 'manual', teacher_load_id: teacherLoad.id }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return NextResponse.json(
            { error: 'Conflict detected: Teacher or Section is already booked at this day and time.' },
            { status: 409 }
          );
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      result = data;

      // Sync the new load
      await syncTeacherLoad(supabase, teacherLoad.id);
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const supabase = await createServerClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    // 1. Fetch the entry to find its teacher_load_id
    const { data: entry, error: fetchErr } = await supabase
      .from('schedule_entries')
      .select('teacher_load_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    // 2. Perform delete
    const { error } = await supabase
      .from('schedule_entries')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 3. Sync the teacher load
    if (entry && entry.teacher_load_id) {
      await syncTeacherLoad(supabase, entry.teacher_load_id);
    }
    return NextResponse.json({ success: true });
  }

  const teacher_load_id = searchParams.get('teacher_load_id');
  if (teacher_load_id) {
    const { error } = await supabase
      .from('schedule_entries')
      .delete()
      .eq('teacher_load_id', teacher_load_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Sync the teacher load
    await syncTeacherLoad(supabase, teacher_load_id);
    return NextResponse.json({ success: true });
  }

  const clearAll = searchParams.get('clearAll') === 'true';
  const day = searchParams.get('day');
  const time_slot_id = searchParams.get('time_slot_id');
  const criteria_id = searchParams.get('criteria_id');
  const view_by = searchParams.get('view_by'); // 'teacher' or 'section'

  if (clearAll) {
    const { error } = await supabase
      .from('schedule_entries')
      .delete()
      .not('id', 'is', null);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Reset all teacher loads to 0 hours and not_placed status
    const { error: resetErr } = await supabase
      .from('teacher_loads')
      .update({ placed_hours: 0, placement_status: 'not_placed' })
      .not('id', 'is', null);

    if (resetErr) {
      return NextResponse.json({ error: resetErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  if (!day || !time_slot_id || !criteria_id || !view_by) {
    return NextResponse.json({ error: 'Missing clear criteria parameters' }, { status: 400 });
  }

  // 1. Find all matching schedule entries to get their teacher_load_id(s)
  let selectQuery = supabase
    .from('schedule_entries')
    .select('teacher_load_id')
    .eq('day', day)
    .eq('time_slot_id', time_slot_id);

  if (view_by === 'teacher') {
    selectQuery = selectQuery.eq('teacher_id', criteria_id);
  } else {
    selectQuery = selectQuery.eq('section_id', criteria_id);
  }
  const { data: entriesToClear, error: selectErr } = await selectQuery;

  if (selectErr) {
    return NextResponse.json({ error: selectErr.message }, { status: 500 });
  }

  // 2. Perform delete
  let deleteQuery = supabase
    .from('schedule_entries')
    .delete()
    .eq('day', day)
    .eq('time_slot_id', time_slot_id);

  if (view_by === 'teacher') {
    deleteQuery = deleteQuery.eq('teacher_id', criteria_id);
  } else {
    deleteQuery = deleteQuery.eq('section_id', criteria_id);
  }
  const { error } = await deleteQuery;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 3. Sync all affected teacher loads
  if (entriesToClear) {
    const uniqueLoadIds = Array.from(new Set(entriesToClear.map((e: any) => e.teacher_load_id).filter(Boolean)));
    for (const loadId of uniqueLoadIds) {
      await syncTeacherLoad(supabase, loadId as string);
    }
  }

  return NextResponse.json({ success: true });
}
