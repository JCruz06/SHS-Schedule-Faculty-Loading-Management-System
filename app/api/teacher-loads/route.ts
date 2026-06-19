import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export async function GET(request: Request) {
  const supabase = await createServerClient();
  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get('teacher_id');

  let query = supabase
    .from('teacher_loads')
    .select(`
      *,
      teacher:teachers(*),
      subject:subjects(*),
      section:sections(*)
    `);

  if (teacherId) {
    query = query.eq('teacher_id', teacherId);
  }

  const { data, error } = await query.order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Map database response to match the frontend type if necessary
  const formatted = (data || []).map(load => {
    // Process teacher name / ancillary roles mapping if needed
    if (load.teacher) {
      let role = load.teacher.ancillary_role || '';
      let roleName = role;
      let hours = 0;
      if (role.includes('|')) {
        const parts = role.split('|');
        roleName = parts[0];
        hours = parseInt(parts[1], 10) || 0;
      }
      load.teacher = {
        ...load.teacher,
        ancillary_role: roleName || undefined,
        ancillary_hours_per_week: hours
      };
    }
    return load;
  });

  return NextResponse.json(formatted);
}

export async function POST(request: Request) {
  const supabase = await createServerClient();
  try {
    const body = await request.json();
    const { teacher_id, subject_id, section_id } = body;

    if (!teacher_id || !subject_id || !section_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch the subject to get its hours_per_week
    const { data: subject, error: subError } = await supabase
      .from('subjects')
      .select('hours_per_week')
      .eq('id', subject_id)
      .single();

    if (subError || !subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('teacher_loads')
      .insert([
        {
          teacher_id,
          subject_id,
          section_id,
          required_hours_per_week: subject.hours_per_week,
          placement_status: 'pending',
          placed_hours: 0,
          priority: 1,
        },
      ])
      .select(`
        *,
        teacher:teachers(*),
        subject:subjects(*),
        section:sections(*)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Retroactively link any existing schedule entries for the same teacher + subject + section combination
    const { data: matchedEntries, error: queryErr } = await supabase
      .from('schedule_entries')
      .select('id')
      .eq('teacher_id', teacher_id)
      .eq('subject_id', subject_id)
      .eq('section_id', section_id)
      .is('teacher_load_id', null);

    if (queryErr) {
      return NextResponse.json({ error: queryErr.message }, { status: 500 });
    }

    let finalData = data;

    if (matchedEntries && matchedEntries.length > 0) {
      // Update matching schedule entries to link to the new load ID
      const { error: linkErr } = await supabase
        .from('schedule_entries')
        .update({ teacher_load_id: data.id })
        .eq('teacher_id', teacher_id)
        .eq('subject_id', subject_id)
        .eq('section_id', section_id)
        .is('teacher_load_id', null);

      if (linkErr) {
        return NextResponse.json({ error: linkErr.message }, { status: 500 });
      }

      // Re-fetch teaching load to reflect the database trigger recalculation of placed_hours
      const { data: reFetched, error: fetchErr } = await supabase
        .from('teacher_loads')
        .select(`
          *,
          teacher:teachers(*),
          subject:subjects(*),
          section:sections(*)
        `)
        .eq('id', data.id)
        .single();

      if (fetchErr) {
        return NextResponse.json({ error: fetchErr.message }, { status: 500 });
      }
      finalData = reFetched;
    }

    // Format the returned teacher details
    if (finalData.teacher) {
      let role = finalData.teacher.ancillary_role || '';
      let roleName = role;
      let hours = 0;
      if (role.includes('|')) {
        const parts = role.split('|');
        roleName = parts[0];
        hours = parseInt(parts[1], 10) || 0;
      }
      finalData.teacher = {
        ...finalData.teacher,
        ancillary_role: roleName || undefined,
        ancillary_hours_per_week: hours
      };
    }

    return NextResponse.json(finalData, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
