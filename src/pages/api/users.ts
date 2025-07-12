import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin as supabase } from '@/utils/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, fcm_token')
      .order('created_at', { ascending: false });
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
    const { userId, newRole } = req.body;
    if (!userId || !newRole) return res.status(400).json({ error: 'Missing userId or newRole' });
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
} 