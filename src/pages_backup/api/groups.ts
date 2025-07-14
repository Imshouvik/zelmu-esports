import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Basic authentication check
  const { data: { user } } = await supabase!.auth.getUser(req.headers['authorization']?.replace('Bearer', ''));
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    let query = supabase!.from('groups').select('*');
    if (req.query.tournament_id) {
      query = query.eq('tournament_id', req.query.tournament_id);
    }
    if (req.query.stage_id) {
      query = query.eq('stage_id', req.query.stage_id);
    }
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { tournament_id, stage_id, name, group_order } = req.body;
    const { data, error } = await supabase!
      .from('groups')
      .insert([{ tournament_id, stage_id, name, group_order }])
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  if (req.method === 'PUT') {
    const { id, name, group_order } = req.body;
    const { data, error } = await supabase!
      .from('groups')
      .update({ name, group_order })
      .eq('id', id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    const { error } = await supabase!
      .from('groups')
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