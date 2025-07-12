import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../utils/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { role, type } = req.query;
    if (!role || !type) {
      return res.status(400).json({ error: 'Missing role or type' });
    }
    const { data, error } = await supabase
      .from('role_permissions')
      .select('permission_key, allowed')
      .eq('role', role)
      .eq('type', type);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ permissions: data });
  }

  if (req.method === 'POST') {
    // TODO: Add superadmin auth check here
    const { role, permission_key, type, allowed } = req.body;
    if (!role || !permission_key || !type || typeof allowed !== 'boolean') {
      return res.status(400).json({ error: 'Missing fields' });
    }
    const { data, error } = await supabase
      .from('role_permissions')
      .upsert([{ role, permission_key, type, allowed }], { onConflict: 'role,permission_key,type' })
      .select();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ permission: data[0] });
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 