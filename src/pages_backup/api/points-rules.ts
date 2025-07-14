import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Basic authentication check
  const { data: { user } } = await supabase!.auth.getUser(req.headers['authorization']?.replace('Bearer', ''));
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const { tournament_id } = req.query;
    let query = supabase!.from('points_rules').select('*');
    if (tournament_id) query = query.eq('tournament_id', tournament_id);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { tournament_id, win_points, draw_points, loss_points, custom_rules } = req.body;
    const { data, error } = await supabase!
      .from('points_rules')
      .insert([{ tournament_id, win_points, draw_points, loss_points, custom_rules }])
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  if (req.method === 'PUT') {
    const { id, win_points, draw_points, loss_points, custom_rules } = req.body;
    const { data, error } = await supabase!
      .from('points_rules')
      .update({ win_points, draw_points, loss_points, custom_rules })
      .eq('id', id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    const { error } = await supabase!
      .from('points_rules')
      .delete()
      .eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'DELETE') {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 