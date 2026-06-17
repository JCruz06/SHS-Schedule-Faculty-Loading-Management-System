import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';
import { runConflictChecks } from '@/lib/validations';

export async function GET() {
  const supabase = await createServerClient();

  const [
    teachersRes,
    strandsRes,
    sectionsRes,
    subjectsRes,
    timeSlotsRes,
    scheduleRes
  ] = await Promise.all([
    supabase.from('teachers').select('*'),
    supabase.from('strands').select('*'),
    supabase.from('sections').select('*'),
    supabase.from('subjects').select('*'),
    supabase.from('time_slots').select('*').order('sort_order', { ascending: true }),
    supabase.from('schedule_entries').select('*')
  ]);

  if (teachersRes.error) return NextResponse.json({ error: teachersRes.error.message }, { status: 500 });
  if (strandsRes.error) return NextResponse.json({ error: strandsRes.error.message }, { status: 500 });
  if (sectionsRes.error) return NextResponse.json({ error: sectionsRes.error.message }, { status: 500 });
  if (subjectsRes.error) return NextResponse.json({ error: subjectsRes.error.message }, { status: 500 });
  if (timeSlotsRes.error) return NextResponse.json({ error: timeSlotsRes.error.message }, { status: 500 });
  if (scheduleRes.error) return NextResponse.json({ error: scheduleRes.error.message }, { status: 500 });

  const teachers = (teachersRes.data || []).map((t) => {
    let role = t.ancillary_role || '';
    let ancillary_role = role;
    let ancillary_hours_per_week = 0;
    if (role.includes('|')) {
      const parts = role.split('|');
      ancillary_role = parts[0];
      ancillary_hours_per_week = parseInt(parts[1], 10) || 0;
    }
    return {
      id: t.id,
      name: t.name,
      specialization: t.specialization,
      max_hours_per_week: t.max_hours_per_week,
      ancillary_role: ancillary_role || undefined,
      ancillary_hours_per_week,
    };
  });

  const timeSlots = (timeSlotsRes.data || []).map((slot) => {
    return {
      ...slot,
      start_time: slot.start_time.substring(0, 5),
      end_time: slot.end_time.substring(0, 5),
    };
  });

  const conflicts = runConflictChecks({
    teachers,
    strands: strandsRes.data || [],
    sections: sectionsRes.data || [],
    subjects: subjectsRes.data || [],
    timeSlots,
    scheduleEntries: scheduleRes.data || []
  });

  return NextResponse.json(conflicts);
}
