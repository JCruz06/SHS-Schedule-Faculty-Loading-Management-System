import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

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
        .update({ teacher_id, subject_id, source: 'manual', teacher_load_id: null })
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
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('schedule_entries')
        .insert([{ teacher_id, section_id, subject_id, time_slot_id, day, source: 'manual', teacher_load_id: null }])
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
    const { error } = await supabase
      .from('schedule_entries')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
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
    return NextResponse.json({ success: true });
  }

  if (!day || !time_slot_id || !criteria_id || !view_by) {
    return NextResponse.json({ error: 'Missing clear criteria parameters' }, { status: 400 });
  }

  let query = supabase
    .from('schedule_entries')
    .delete()
    .eq('day', day)
    .eq('time_slot_id', time_slot_id);

  if (view_by === 'teacher') {
    query = query.eq('teacher_id', criteria_id);
  } else {
    query = query.eq('section_id', criteria_id);
  }

  const { error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
