import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export async function GET() {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('time_slots')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Format time fields from TIME format (HH:MM:SS) to HH:MM format if needed
  const formatted = (data || []).map((slot) => {
    return {
      ...slot,
      start_time: slot.start_time.substring(0, 5),
      end_time: slot.end_time.substring(0, 5),
    };
  });

  return NextResponse.json(formatted);
}
