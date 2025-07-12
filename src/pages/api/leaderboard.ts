import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin as supabase } from '@/utils/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { tournamentId } = req.query;
  if (!tournamentId) return res.status(400).json({ error: 'Missing tournamentId' });

  // Fetch teams registered for the tournament (approved only)
  const { data: teamsRaw, error: teamError } = await supabase
    .from('teams')
    .select('id, name, owner_id, team_type, registration_status')
    .eq('tournament_id', tournamentId)
    .eq('registration_status', 'approved');

  if (teamError) return res.status(500).json({ error: teamError.message });
  const teams = teamsRaw || [];

  // Debug: log team IDs being queried
  console.log('Queried team IDs:', teams.map(t => t.id));

  // Fetch kills for all teams in this tournament
  const { data: killsData, error: killsError } = await supabase
    .from('team_kills')
    .select('team_id, kills')
    .eq('tournament_id', tournamentId);

  if (killsError) return res.status(500).json({ error: killsError.message });
  const killsMap = new Map((killsData || []).map(k => [k.team_id, k.kills]));

  // Fetch player status for all teams in this tournament
  const { data: statusData, error: statusError } = await supabase
    .from('team_player_status')
    .select('team_id, player_index, is_alive')
    .eq('tournament_id', tournamentId);
  if (statusError) return res.status(500).json({ error: statusError.message });

  // Fetch players for all teams in this tournament
  let playersData: any[] = [];
  if (teams.length > 0) {
    const { data, error } = await supabase
      .from('team_players')
      .select('id, team_id, player_name, player_email, player_phone, game_id, player_position, player_index, user_id')
      .in('team_id', teams.map(t => t.id));
    if (error) return res.status(500).json({ error: error.message });
    playersData = data;
    // Debug: log raw playersData
    console.log('Raw playersData:', playersData);
  }

  // Map: team_id -> [is_alive, is_alive, is_alive, is_alive]
  const statusMap = new Map();
  (statusData || []).forEach(row => {
    if (!statusMap.has(row.team_id)) statusMap.set(row.team_id, [true, true, true, true]);
    const arr = statusMap.get(row.team_id);
    arr[row.player_index] = row.is_alive;
  });

  // Map: team_id -> players[]
  const playersMap = new Map();
  (playersData || []).forEach(player => {
    const key = player.team_id.toString();
    if (!playersMap.has(key)) playersMap.set(key, []);
    playersMap.get(key).push(player);
  });
  // Sort players by player_index for each team
  Array.from(playersMap.values()).forEach((arr: any[]) => {
    arr.sort((a: any, b: any) => (a.player_index ?? 0) - (b.player_index ?? 0));
  });

  // Collect all user_ids from playersData
  const userIds = (playersData || []).map((p: any) => p.user_id).filter(Boolean);
  let usersMap = new Map();
  if (userIds.length > 0) {
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, avatar_url')
      .in('id', userIds);
    if (!usersError && usersData) {
      usersMap = new Map(usersData.map((u: any) => [u.id, u.avatar_url]));
    }
  }
  // Attach avatar_url to each player
  (playersData || []).forEach((player: any) => {
    if (player.user_id && usersMap.has(player.user_id)) {
      player.avatar_url = usersMap.get(player.user_id);
    }
  });

  const leaderboard = teams.map(team => ({
    ...team,
    kills: killsMap.get(team.id) || 0,
    status: statusMap.get(team.id) || [true, true, true, true],
    players: playersMap.get(team.id.toString()) || [],
  }));

  res.status(200).json(leaderboard);
} 