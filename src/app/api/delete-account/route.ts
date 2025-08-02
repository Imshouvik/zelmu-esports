import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/utils/supabaseAdmin';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function DELETE(req: NextRequest) {
  // Get the user's session from the Authorization header (Bearer token)
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = user.id;

  // Use supabaseAdmin for elevated permissions
  // 1. Check for club ownership
  const { data: clubs, error: clubError } = await supabaseAdmin
    .from('clubs')
    .select('id')
    .eq('owner_id', userId);
  if (clubError) {
    return NextResponse.json({ error: 'Failed to check club ownership' }, { status: 500 });
  }
  if (clubs && clubs.length > 0) {
    return NextResponse.json({ error: 'You must transfer or delete your clubs before deleting your account.' }, { status: 400 });
  }

  // 2. Check for team ownership
  const { data: teams, error: teamError } = await supabaseAdmin
    .from('teams')
    .select('id')
    .eq('owner_id', userId);
  if (teamError) {
    return NextResponse.json({ error: 'Failed to check team ownership' }, { status: 500 });
  }
  if (teams && teams.length > 0) {
    return NextResponse.json({ error: 'You must transfer or delete your teams before deleting your account.' }, { status: 400 });
  }

  // Cleanup all user-related data before deleting user
  // 1. Delete club_invites where created_by or for_user_id = userId
  await supabaseAdmin.from('club_invites').delete().or(`created_by.eq.${userId},for_user_id.eq.${userId}`);
  // 2. Delete club_members where user_id = userId
  await supabaseAdmin.from('club_members').delete().eq('user_id', userId);
  // 3. Delete club_tournaments where registered_by = userId
  await supabaseAdmin.from('club_tournaments').delete().eq('registered_by', userId);
  // 4. Delete comments where user_id = userId
  await supabaseAdmin.from('comments').delete().eq('user_id', userId);
  // 5. Delete post_likes where user_id = userId
  await supabaseAdmin.from('post_likes').delete().eq('user_id', userId);
  // 6. Delete post_reactions where user_id = userId
  await supabaseAdmin.from('post_reactions').delete().eq('user_id', userId);
  // 7. Delete posts where user_id = userId
  await supabaseAdmin.from('posts').delete().eq('user_id', userId);
  // 8. Delete registrations where user_id = userId
  await supabaseAdmin.from('registrations').delete().eq('user_id', userId);
  // 9. Delete team_players where user_id = userId
  await supabaseAdmin.from('team_players').delete().eq('user_id', userId);
  // 10. Delete tournament_registrations where registered_by = userId
  await supabaseAdmin.from('tournament_registrations').delete().eq('registered_by', userId);
  // 11. Delete tournaments where created_by = userId
  await supabaseAdmin.from('tournaments').delete().eq('created_by', userId);
  // 12. (teams/clubs owner_id already checked above)

  // Delete user from users table
  const { error: deleteError } = await supabaseAdmin.from('users').delete().eq('id', userId);
  if (deleteError) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }

  // Delete user from Supabase Auth
  const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (authDeleteError) {
    return NextResponse.json({ error: 'Failed to delete user from Auth: ' + authDeleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
} 