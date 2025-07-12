import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin as supabase } from '@/utils/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get access token from Authorization header
  const authHeader = req.headers.authorization;
  const access_token = authHeader?.split(' ')[1];
  if (!access_token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Authenticate user
  const { data: { user }, error: userError } = await supabase.auth.getUser(access_token);
  if (!user || userError) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check user role
  const { data: userRow } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!userRow || (userRow.role !== 'admin' && userRow.role !== 'superadmin')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Fetch all tournaments
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch tournaments' });
  }

  return res.status(200).json(data);
} 