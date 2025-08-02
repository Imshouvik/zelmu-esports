import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: NextRequest, { params }: { params: { matchId: string } }) {
  const matchId = params.matchId;
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get user from token
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get match info
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('id, group_id, tournament_id, room_id, room_password, show_credentials_from')
    .eq('id', matchId)
    .single();
  if (matchError || !match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

  // Check if user/team is registered for this group in this tournament
  const { data: registration, error: regError } = await supabase
    .from('tournament_registrations')
    .select('id')
    .eq('tournament_id', match.tournament_id)
    .eq('group_id', match.group_id)
    .eq('registered_by', user.id)
    .eq('registration_status', 'approved')
    .single();
  if (regError || !registration) return NextResponse.json({ error: 'Not registered for this group' }, { status: 403 });

  // Check if credentials can be shown
  const now = new Date();
  const showFrom = match.show_credentials_from ? new Date(match.show_credentials_from) : null;
  if (!showFrom || now < showFrom) {
    return NextResponse.json({
      match_id: match.id,
      room_id: null,
      room_password: null,
      show_credentials_from: match.show_credentials_from,
      can_view: false
    });
  }

  return NextResponse.json({
    match_id: match.id,
    room_id: match.room_id,
    room_password: match.room_password,
    show_credentials_from: match.show_credentials_from,
    can_view: true
  });
} 