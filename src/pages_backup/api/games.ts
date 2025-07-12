import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Basic authentication check (customize as needed)
  const { data: { user } } = await supabase.auth.getUser(req.headers['authorization']?.replace('Bearer ', ''));
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  switch (req.method) {
    case 'GET': {
      // List all games
      const { data, error } = await supabase.from('games').select('*').order('name');
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }
    case 'POST': {
      // Create a new game
      const { name, rules } = req.body;
      if (!name) return res.status(400).json({ error: 'Name is required' });
      const { data, error } = await supabase.from('games').insert([{ name, rules: rules || [] }]).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    }
    case 'PUT': {
      // Update a game
      const { id, name, rules } = req.body;
      if (!id) return res.status(400).json({ error: 'ID is required' });
      const { data, error } = await supabase.from('games').update({ name, rules }).eq('id', id).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }
    case 'DELETE': {
      // Delete a game
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'ID is required' });
      const { error } = await supabase.from('games').delete().eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(204).end();
    }
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 