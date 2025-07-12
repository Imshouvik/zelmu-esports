import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin as supabase } from '@/utils/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { tournamentId } = req.query;
    if (!tournamentId) return res.status(400).json({ error: 'Missing tournamentId' });
    const { data, error } = await supabase
      .from('overlay_state')
      .select('*')
      .eq('tournament_id', tournamentId)
      .single();
    if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });
    return res.status(200).json(data || {});
  }

  if (req.method === 'POST') {
    // Auth check
    const authHeader = req.headers.authorization;
    const access_token = authHeader?.split(' ')[1];
    if (!access_token) return res.status(401).json({ error: 'Unauthorized' });
    const { data: { user }, error: userError } = await supabase.auth.getUser(access_token);
    if (!user || userError) return res.status(401).json({ error: 'Unauthorized' });
    // Check admin role
    const { data: userRow } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    if (!userRow || (userRow.role !== 'admin' && userRow.role !== 'superadmin')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Upsert overlay state
    const { tournamentId, colors, active_team_card } = req.body;
    if (!tournamentId) return res.status(400).json({ error: 'Missing tournamentId' });
    const { data, error } = await supabase
      .from('overlay_state')
      .upsert([
        {
          tournament_id: tournamentId,
          colors: colors || {},
          active_team_card: active_team_card || null,
          updated_at: new Date().toISOString(),
        }
      ], { onConflict: 'tournament_id' })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
} 