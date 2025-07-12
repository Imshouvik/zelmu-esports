import { supabaseAdmin } from '@/utils/supabaseClient';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Server misconfiguration' });
  // Get user from Authorization header
  const token = req.headers['authorization']?.split('Bearer ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  // Get user id from JWT
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !user) return res.status(401).json({ error: 'Unauthorized' });

  // Check if user is superadmin
  const { data: userRow } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!userRow || userRow.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });

  // Get stats
  const [{ count: userCount }, { count: clubCount }, { count: tournamentCount }, { count: memberCount }] = await Promise.all([
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('clubs').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('tournaments').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('club_members').select('*', { count: 'exact', head: true }).eq('status', 'active'),
  ]);
  return res.status(200).json({
    users: userCount || 0,
    clubs: clubCount || 0,
    tournaments: tournamentCount || 0,
    activeMembers: memberCount || 0,
  });
} 