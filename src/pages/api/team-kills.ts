import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin as supabase } from '@/utils/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Get all team kills for a tournament
    const { tournamentId } = req.query;
    if (!tournamentId) return res.status(400).json({ error: 'Missing tournamentId' });
    const { data, error } = await supabase
      .from('team_kills')
      .select('team_id, kills')
      .eq('tournament_id', tournamentId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    // Require admin/superadmin
    const authHeader = req.headers.authorization;
    const access_token = authHeader?.split(' ')[1];
    if (!access_token) return res.status(401).json({ error: 'Unauthorized' });
    const { data: { user }, error: userError } = await supabase.auth.getUser(access_token);
    if (!user || userError) return res.status(401).json({ error: 'Unauthorized' });
    const { data: userRow } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    if (!userRow || (userRow.role !== 'admin' && userRow.role !== 'superadmin')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Upsert kills for a team in a tournament
    const { tournamentId, teamId, kills } = req.body;
    if (!tournamentId || !teamId || typeof kills !== 'number') {
      return res.status(400).json({ error: 'Missing tournamentId, teamId, or kills' });
    }
    const { data, error } = await supabase
      .from('team_kills')
      .upsert([
        { tournament_id: tournamentId, team_id: teamId, kills, updated_at: new Date().toISOString() }
      ], { onConflict: 'tournament_id,team_id' })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
} 