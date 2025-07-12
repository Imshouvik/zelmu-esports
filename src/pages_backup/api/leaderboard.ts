import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { tournamentId } = req.query;
  if (!tournamentId) return res.status(400).json({ error: 'Missing tournamentId' });

  // Fetch teams registered for the tournament (approved only)
  const { data: teams, error: teamError } = await supabase
    .from('teams')
    .select('id, name, owner_id, team_type, registration_status, logo_url')
    .eq('tournament_id', tournamentId)
    .eq('registration_status', 'approved');

  if (teamError) return res.status(500).json({ error: teamError.message });

  // Placeholder: kills and status (enhance if you add kill tracking)
  // If you add a kills table or store kills in matches, update this logic
  const leaderboard = teams.map(team => ({
    ...team,
    kills: 0, // TODO: Replace with actual kill count logic
    status: 'live', // TODO: Replace with actual status logic
  }));

  res.status(200).json(leaderboard);
} 