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
      // List all stages for a tournament
      const { tournament_id } = req.query;
      if (!tournament_id) return res.status(400).json({ error: 'tournament_id is required' });
      const { data, error } = await supabase
        .from('tournament_stages')
        .select('*')
        .eq('tournament_id', tournament_id)
        .order('stage_order');
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }
    case 'POST': {
      // Create a new stage
      const { tournament_id, name, type, stage_order } = req.body;
      if (!tournament_id || !name) return res.status(400).json({ error: 'tournament_id and name are required' });
      const { data, error } = await supabase
        .from('tournament_stages')
        .insert([{ tournament_id, name, type, stage_order }])
        .select()
        .single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    }
    case 'PUT': {
      // Update a stage
      const { id, name, type, stage_order } = req.body;
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { data, error } = await supabase
        .from('tournament_stages')
        .update({ name, type, stage_order })
        .eq('id', id)
        .select()
        .single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }
    case 'DELETE': {
      // Delete a stage
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { error } = await supabase.from('tournament_stages').delete().eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(204).end();
    }
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 