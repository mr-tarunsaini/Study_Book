import { setCors, getJsonBody } from '../_utils/cors.js';
import { supabaseAdmin, BUCKET_NAME } from '../_utils/supabase.js';
import { verifyUserToken } from '../_utils/auth.js';

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const authResult = await verifyUserToken(req.headers.authorization);
    if (authResult.error) {
      return res.status(authResult.status || 401).json({ error: authResult.error });
    }
    const user = authResult.user;

    const body = getJsonBody(req);
    const { storagePath } = body;

    if (!storagePath || typeof storagePath !== 'string') {
      return res.status(400).json({ error: 'Missing storagePath to delete.' });
    }

    if (storagePath.includes('..') || storagePath.startsWith('/')) {
      return res.status(400).json({ error: 'Invalid storagePath format.' });
    }

    const uid = user.uid;
    const isOwner = storagePath.startsWith(`${uid}/`);
    const isAdmin = Boolean(user.admin);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        error: 'Forbidden: You do not have permission to delete this file.',
      });
    }

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([storagePath]);

    if (error) {
      console.error('[Supabase Storage Error] remove:', error);
      return res.status(502).json({
        error: 'Failed to delete file from Supabase Storage.',
        details: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'File removed from Supabase storage successfully.',
      data,
    });
  } catch (err) {
    console.error('[API Error] delete:', err);
    return res.status(500).json({
      error: 'Internal server error while deleting file.',
      details: err.message,
    });
  }
}
