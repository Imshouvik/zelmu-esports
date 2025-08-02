import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const zelmuname = searchParams.get('zelmuname');
  if (!zelmuname) {
    return NextResponse.json({ available: false, error: 'No zelmuname provided' }, { status: 400 });
  }
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('zelmuname', zelmuname)
    .maybeSingle();
  return NextResponse.json({ available: !data });
} 