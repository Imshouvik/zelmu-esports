import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Basic authentication check
  const { data: { user } } = await supabase.auth.getUser(req.headers['authorization']?.replace('Bearer ', ''));
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  switch (req.method) {
    case 'GET': {
      // List all groups for a tournament or stage
      const { tournament_id, stage_id } = req.query;
      let query = supabase.from('groups').select('*');
      if (tournament_id) query = query.eq('tournament_id', tournament_id);
      if (stage_id) query = query.eq('stage_id', stage_id);
      const { data, error } = await query.order('group_order');
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }
    case 'POST': {
      // Create a new group
      const { tournament_id, stage_id, name, group_order, time_slot, max_teams, current_teams } = req.body;
      if (!tournament_id || !name) return res.status(400).json({ error: 'tournament_id and name are required' });
      const { data, error } = await supabase
        .from('groups')
        .insert([{ tournament_id, stage_id, name, group_order, time_slot, max_teams, current_teams }])
        .select()
        .single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    }
    case 'PUT': {
      // Update a group
      const { id, name, group_order, time_slot, max_teams, current_teams } = req.body;
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { data, error } = await supabase
        .from('groups')
        .update({ name, group_order, time_slot, max_teams, current_teams })
        .eq('id', id)
        .select()
        .single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }
    case 'DELETE': {
      // Delete a group
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { error } = await supabase.from('groups').delete().eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(204).end();
    }
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 