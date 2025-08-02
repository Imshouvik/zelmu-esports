import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabaseAdmin';

export async function POST(req: NextRequest) {
  const { clubId, newOwnerId, userId } = await req.json();
  if (!clubId || !newOwnerId || !userId) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }
  if (newOwnerId === userId) {
    return NextResponse.json({ error: 'You are already the owner.' }, { status: 400 });
  }

  // 1. Check that the user is the current owner of the club
  const { data: club, error: clubError } = await supabaseAdmin
    .from('clubs')
    .select('id, owner_id')
    .eq('id', clubId)
    .single();
  if (clubError || !club) {
    return NextResponse.json({ error: 'Club not found.' }, { status: 404 });
  }
  if (club.owner_id !== userId) {
    return NextResponse.json({ error: 'Only the club owner can transfer ownership.' }, { status: 403 });
  }

  // 2. Check that the new owner is an active member of the club
  const { data: member, error: memberError } = await supabaseAdmin
    .from('club_members')
    .select('id, user_id, status')
    .eq('club_id', clubId)
    .eq('user_id', newOwnerId)
    .eq('status', 'active')
    .single();
  if (memberError || !member) {
    return NextResponse.json({ error: 'Selected user is not an active member of this club.' }, { status: 400 });
  }

  // 3. Update the club's owner_id
  const { error: updateError } = await supabaseAdmin
    .from('clubs')
    .update({ owner_id: newOwnerId })
    .eq('id', clubId);
  if (updateError) {
    return NextResponse.json({ error: 'Failed to transfer ownership.' }, { status: 500 });
  }

  // 4. Update club_members: set previous owner to co-leader, new owner to owner
  await supabaseAdmin
    .from('club_members')
    .update({ role: 'co-leader' })
    .eq('club_id', clubId)
    .eq('user_id', userId);
  await supabaseAdmin
    .from('club_members')
    .update({ role: 'owner' })
    .eq('club_id', clubId)
    .eq('user_id', newOwnerId);

  return NextResponse.json({ success: true });
} 