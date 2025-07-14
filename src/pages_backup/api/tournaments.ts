import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get access token from Authorization header
  const authHeader = req.headers.authorization;
  const access_token = authHeader?.split(' ')[1];
  if (!access_token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Authenticate user
  const { data: { user }, error: userError } = await supabase!.auth.getUser(access_token);
  if (!user || userError) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check user role
  const { data: userRow } = await supabase!
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!userRow || (userRow.role !== 'admin' && userRow.role !== 'superadmin')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const { data, error } = await supabase!
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { title, game, start_date, end_date, prize_pool, registration_fee, max_teams, status, type, is_featured, is_upcoming, rules, rewards } = req.body;
    const { data, error } = await supabase!
      .from('tournaments')
      .insert([{ title, game, start_date, end_date, prize_pool, registration_fee, max_teams, status, type, is_featured, is_upcoming, rules, rewards, created_by: user.id }])
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  if (req.method === 'PUT') {
    const { id, ...fields } = req.body;
    const { data, error } = await supabase!
      .from('tournaments')
      .update(fields)
      .eq('id', id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    const { error } = await supabase!
      .from('tournaments')
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