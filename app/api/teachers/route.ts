import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export async function GET() {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const teachers = (data || []).map((t) => {
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
      created_at: t.created_at,
    };
  });

  return NextResponse.json(teachers);
}

export async function POST(request: Request) {
  const supabase = await createServerClient();
  try {
    const body = await request.json();
    const { name, specialization, ancillary_role, max_hours_per_week, ancillary_hours_per_week } = body;

    const dbAncillaryRole = ancillary_role
      ? `${ancillary_role}|${ancillary_hours_per_week || 0}`
      : null;

    const { data, error } = await supabase
      .from('teachers')
      .insert([
        {
          name,
          specialization,
          ancillary_role: dbAncillaryRole,
          max_hours_per_week: max_hours_per_week ?? 30,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let role = data.ancillary_role || '';
    let roleName = role;
    let hours = 0;
    if (role.includes('|')) {
      const parts = role.split('|');
      roleName = parts[0];
      hours = parseInt(parts[1], 10) || 0;
    }

    const created = {
      id: data.id,
      name: data.name,
      specialization: data.specialization,
      max_hours_per_week: data.max_hours_per_week,
      ancillary_role: roleName || undefined,
      ancillary_hours_per_week: hours,
      created_at: data.created_at,
    };

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
