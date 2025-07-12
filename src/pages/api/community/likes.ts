import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin as supabase } from '@/utils/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Toggle like (MVP: just add like, no unlike)
    const { post_id, user_id } = req.body;
    if (!post_id || !user_id) return res.status(400).json({ error: 'Missing required fields' });
    // Check if already liked
    const { data: existing, error: fetchError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', post_id)
      .eq('user_id', user_id)
      .single();
    if (existing) {
      return res.status(200).json({ message: 'Already liked' });
    }
    // Add like
    const { data, error } = await supabase.from('post_likes').insert([
      { post_id, user_id }
    ]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }
  if (req.method === 'GET') {
    // Get all likes for a post
    const { post_id } = req.query;
    if (!post_id) return res.status(400).json({ error: 'Missing post_id' });
    const { data, error } = await supabase
      .from('post_likes')
      .select('*')
      .eq('post_id', post_id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }
  res.setHeader('Allow', ['POST', 'GET']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
} 