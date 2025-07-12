import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin as supabase } from '@/utils/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  const { data, error } = await supabase
    .from('users')
    .select('fcm_token')
    .not('fcm_token', 'is', null);
  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json(data);
} 