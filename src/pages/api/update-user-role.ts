import { supabaseAdmin } from '@/utils/supabaseClient';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Server misconfiguration' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const token = req.headers['authorization']?.split('Bearer ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !user) return res.status(401).json({ error: 'Unauthorized' });
  const { data: userRow } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!userRow || userRow.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  const { userId, newRole } = req.body;
  if (!userId || !newRole) return res.status(400).json({ error: 'Missing userId or newRole' });
  const { error } = await supabaseAdmin
    .from('users')
    .update({ role: newRole })
    .eq('id', userId);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
} 