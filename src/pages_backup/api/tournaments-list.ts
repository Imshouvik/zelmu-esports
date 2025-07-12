import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { data, error } = await supabase
    .from('tournaments')
    .select('id, title, status, start_date, end_date')
    .order('start_date', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json(data);
} 