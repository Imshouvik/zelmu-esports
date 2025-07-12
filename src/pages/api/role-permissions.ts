import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin as supabase } from '@/utils/supabaseAdmin';

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
    // Superadmin auth check
    const authHeader = req.headers.authorization;
    const access_token = authHeader?.split(' ')[1];
    if (!access_token) return res.status(401).json({ error: 'Unauthorized' });
    const { data: { user }, error: userError } = await supabase.auth.getUser(access_token);
    if (!user || userError) return res.status(401).json({ error: 'Unauthorized' });
    const { data: userRow } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    if (!userRow || userRow.role !== 'superadmin') {
      return res.status(401).json({ error: 'Only superadmin can update permissions' });
    }
    // Accept both camelCase and snake_case for permission_key
    const { role, permission_key, permissionKey, type, allowed } = req.body;
    const key = permission_key || permissionKey;
    if (!role || !key || !type || typeof allowed !== 'boolean') {
      return res.status(400).json({ error: 'Missing fields' });
    }
    const { data, error } = await supabase
      .from('role_permissions')
      .upsert([{ role, permission_key: key, type, allowed }], { onConflict: 'role,permission_key,type' })
      .select();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ permission: data[0] });
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 