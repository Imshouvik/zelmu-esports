import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin as supabase } from '@/utils/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Basic authentication check
  const authHeader = req.headers.authorization;
  const access_token = authHeader?.split(' ')[1];
  if (!access_token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { data: { user }, error: userError } = await supabase.auth.getUser(access_token);
  if (!user || userError) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { data: userRow } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!userRow || (userRow.role !== 'admin' && userRow.role !== 'superadmin')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  switch (req.method) {
    case 'GET': {
      // List all points rules for a tournament
      const { tournament_id } = req.query;
      if (!tournament_id) return res.status(400).json({ error: 'tournament_id is required' });
      const { data, error } = await supabase
        .from('points_rules')
        .select('*')
        .eq('tournament_id', tournament_id)
        .order('created_at');
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }
    case 'POST': {
      // Create a new points rule
      const { tournament_id, win_points, draw_points, loss_points, custom_rules } = req.body;
      if (!tournament_id) return res.status(400).json({ error: 'tournament_id is required' });
      const { data, error } = await supabase
        .from('points_rules')
        .insert([{ tournament_id, win_points, draw_points, loss_points, custom_rules }])
        .select()
        .single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    }
    case 'PUT': {
      // Update a points rule
      const { id, win_points, draw_points, loss_points, custom_rules } = req.body;
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { data, error } = await supabase
        .from('points_rules')
        .update({ win_points, draw_points, loss_points, custom_rules })
        .eq('id', id)
        .select()
        .single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }
    case 'DELETE': {
      // Delete a points rule
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { error } = await supabase.from('points_rules').delete().eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(204).end();
    }
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 