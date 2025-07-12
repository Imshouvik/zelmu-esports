import type { NextApiRequest, NextApiResponse } from 'next';
import admin from 'firebase-admin';

// Only initialize once
if (!admin.apps.length) {
  const serviceAccount = require('@/utils/zelmu-6e7f3-firebase-adminsdk-fbsvc-021074ec99.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

type Data = {
  success: boolean;
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { token, title, body } = req.body;

  if (!token || !title || !body) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }

  try {
    await admin.messaging().send({
      notification: { title, body },
      token,
    });
    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('FCM send error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
} 