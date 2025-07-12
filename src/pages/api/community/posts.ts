import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin as supabase } from '@/utils/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // List posts (optionally filter by type/event)
    const { type, event_id } = req.query;
    let query = supabase
      .from('posts')
      .select('*, users(id, name, avatar_url)')
      .order('created_at', { ascending: false });
    if (type) query = query.eq('type', type);
    if (event_id) query = query.eq('event_id', event_id);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }
  if (req.method === 'POST') {
    // Create a new post
    const { user_id, content, type, image_url, event_id, visibility } = req.body;
    if (!user_id || !content || !type) return res.status(400).json({ error: 'Missing required fields' });
    const { data, error } = await supabase.from('posts').insert([
      { user_id, content, type, image_url, event_id, visibility }
    ]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }
  if (req.method === 'DELETE') {
    // Delete a post (author or admin only)
    const { id, user_id, is_admin } = req.body;
    if (!id || !user_id) return res.status(400).json({ error: 'Missing required fields' });
    // Fetch post to check ownership
    const { data: post, error: fetchError } = await supabase.from('posts').select('user_id').eq('id', id).single();
    if (fetchError || !post) return res.status(404).json({ error: 'Post not found' });
    if (post.user_id !== user_id && !is_admin) return res.status(403).json({ error: 'Not authorized' });
    // Delete post
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }
  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}