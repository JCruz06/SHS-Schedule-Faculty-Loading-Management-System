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
    const { name, strand_id, grade_level } = body;

    // Do NOT include 'shift' in updates since it is a generated stored column
    const { data, error } = await supabase
      .from('sections')
      .update({ name, strand_id, grade_level })
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
  const { error } = await supabase
    .from('sections')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
