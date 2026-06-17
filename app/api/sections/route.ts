import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export async function GET() {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('sections')
    .select('*')
    .order('grade_level', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createServerClient();
  try {
    const body = await request.json();
    const { name, strand_id, grade_level } = body;

    // Do NOT insert 'shift' as it is a generated stored column in the database schema
    const { data, error } = await supabase
      .from('sections')
      .insert([{ name, strand_id, grade_level }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
