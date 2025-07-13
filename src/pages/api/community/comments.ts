import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin as supabase } from '@/utils/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // List comments for a post
    const { post_id } = req.query;
    if (!post_id) return res.status(400).json({ error: 'Missing post_id' });
    const { data, error } = await supabase
      .from('comments')
      .select('*, users(id, name, avatar_url)')
      .eq('post_id', post_id)
      .order('created_at', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }
  if (req.method === 'POST') {
    // Add a comment
    const { post_id, user_id, content } = req.body;
    if (!post_id || !user_id || !content) return res.status(400).json({ error: 'Missing required fields' });
    const { data, error } = await supabase.from('comments').insert([
      { post_id, user_id, content }
    ]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }
  if (req.method === 'PUT') {
    // Edit a comment (author or admin only)
    const { id, content, user_id, is_admin } = req.body;
    if (!id || !content || !user_id) return res.status(400).json({ error: 'Missing required fields' });
    // Fetch comment to check ownership
    const { data: comment, error: fetchError } = await supabase.from('comments').select('user_id').eq('id', id).single();
    if (fetchError || !comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.user_id !== user_id && !is_admin) return res.status(403).json({ error: 'Not authorized' });
    // Update comment
    const { data, error } = await supabase.from('comments').update({ content }).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }
  if (req.method === 'DELETE') {
    // Delete a comment (author or admin only)
    const { id, user_id, is_admin } = req.body;
    if (!id || !user_id) return res.status(400).json({ error: 'Missing required fields' });
    // Fetch comment to check ownership
    const { data: comment, error: fetchError } = await supabase.from('comments').select('user_id').eq('id', id).single();
    if (fetchError || !comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.user_id !== user_id && !is_admin) return res.status(403).json({ error: 'Not authorized' });
    // Delete comment
    const { error } = await supabase.from('comments').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }
  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}