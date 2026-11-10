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
    const { storagePaths } = body;

    if (!Array.isArray(storagePaths) || storagePaths.length === 0) {
      return res.status(400).json({ error: 'Missing or empty storagePaths array.' });
    }

    const uid = user.uid;
    const isAdmin = Boolean(user.admin);

    const authorizedPaths = storagePaths.filter((p) => {
      if (typeof p !== 'string' || p.includes('..') || p.startsWith('/')) return false;
      return isAdmin || p.startsWith(`${uid}/`);
    });

    if (authorizedPaths.length === 0) {
      return res.status(403).json({ error: 'Forbidden: No authorized file paths provided for deletion.' });
    }

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove(authorizedPaths);

    if (error) {
      console.error('[Supabase Storage Error] batch remove:', error);
      return res.status(502).json({
        error: 'Failed to batch delete files from Supabase Storage.',
        details: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Successfully removed ${authorizedPaths.length} file(s) from Supabase storage.`,
      count: authorizedPaths.length,
      data,
    });
  } catch (err) {
    console.error('[API Error] delete-batch:', err);
    return res.status(500).json({
      error: 'Internal server error while batch deleting files.',
      details: err.message,
    });
  }
}
