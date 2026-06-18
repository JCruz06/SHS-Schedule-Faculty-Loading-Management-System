import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerClient();
  try {
    const body = await request.json();
    const { placement_status, placed_hours, required_hours_per_week } = body;

    const updateData: any = {};
    if (placement_status !== undefined) updateData.placement_status = placement_status;
    if (placed_hours !== undefined) updateData.placed_hours = placed_hours;
    if (required_hours_per_week !== undefined) updateData.required_hours_per_week = required_hours_per_week;

    const { data, error } = await supabase
      .from('teacher_loads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerClient();

  // First, delete or clear any schedule entries linked to this teacher load to avoid foreign key violations
  const { error: scheduleError } = await supabase
    .from('schedule_entries')
    .delete()
    .eq('teacher_load_id', id);

  if (scheduleError) {
    return NextResponse.json({ error: scheduleError.message }, { status: 500 });
  }

  const { error } = await supabase
    .from('teacher_loads')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
