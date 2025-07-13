import { supabaseAdmin } from '@/utils/supabaseClient';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Server misconfiguration' });

  if (req.method === 'POST') {
    // Add or toggle reaction
    const token = req.headers['authorization']?.split('Bearer ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) return res.status(401).json({ error: 'Unauthorized' });
    const { postId, commentId, emoji } = req.body;
    if ((!postId && !commentId) || !emoji) return res.status(400).json({ error: 'Missing postId/commentId or emoji' });
    // Only one of postId or commentId should be set
    if (postId && commentId) return res.status(400).json({ error: 'Provide only postId or commentId' });
    // Check if reaction exists
    const { data: existing } = await supabaseAdmin
      .from('post_reactions')
      .select('id, emoji')
      .eq('user_id', user.id)
      .eq(postId ? 'post_id' : 'comment_id', postId || commentId)
      .single();
    if (existing) {
      if (existing.emoji === emoji) {
        // Remove reaction (toggle off)
        await supabaseAdmin
          .from('post_reactions')
          .delete()
          .eq('id', existing.id);
        return res.status(200).json({ removed: true });
      } else {
        // Remove old reaction, add new one
        await supabaseAdmin
          .from('post_reactions')
          .delete()
          .eq('id', existing.id);
        const insertObj: any = {
          user_id: user.id,
          emoji,
        };
        if (postId) insertObj.post_id = postId;
        if (commentId) insertObj.comment_id = commentId;
        const { error } = await supabaseAdmin
          .from('post_reactions')
          .insert([insertObj]);
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ added: true });
      }
    } else {
      // Add reaction
      const insertObj: any = {
        user_id: user.id,
        emoji,
      };
      if (postId) insertObj.post_id = postId;
      if (commentId) insertObj.comment_id = commentId;
      const { error } = await supabaseAdmin
        .from('post_reactions')
        .insert([insertObj]);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ added: true });
    }
  }

  if (req.method === 'GET') {
    // Get reactions for a post or comment
    const { postId, commentId } = req.query;
    if (!postId && !commentId) return res.status(400).json({ error: 'Missing postId or commentId' });
    if (postId && commentId) return res.status(400).json({ error: 'Provide only postId or commentId' });
    const filterCol = postId ? 'post_id' : 'comment_id';
    const filterVal = (postId || commentId) as string;
    const { data, error } = await supabaseAdmin
      .from('post_reactions')
      .select('emoji, user_id')
      .eq(filterCol, filterVal);
    if (error) return res.status(500).json({ error: error.message });
    // Group by emoji
    const grouped: Record<string, string[]> = {};
    for (const row of data || []) {
      if (!grouped[row.emoji]) grouped[row.emoji] = [];
      grouped[row.emoji].push(row.user_id);
    }
    return res.status(200).json({ reactions: grouped });
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 