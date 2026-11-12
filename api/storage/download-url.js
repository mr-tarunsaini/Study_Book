import { setCors, getJsonBody } from '../_utils/cors.js';
import { supabaseAdmin, BUCKET_NAME } from '../_utils/supabase.js';

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const body = getJsonBody(req);
    const { storagePath, expiresIn = 3600 } = body;

    if (!storagePath || typeof storagePath !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid storagePath.' });
    }

    // Normalize path and prevent path traversal
    let cleanPath = storagePath.trim().replace(/^\/+/, '');
    if (cleanPath.startsWith(`${BUCKET_NAME}/`)) {
      cleanPath = cleanPath.slice(BUCKET_NAME.length + 1);
    }
    if (cleanPath.includes('..')) {
      return res.status(400).json({ error: 'Invalid storagePath format.' });
    }

    const expirySeconds = Math.min(Math.max(Number(expiresIn) || 3600, 60), 86400);

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .createSignedUrl(cleanPath, expirySeconds);

    if (error) {
      console.error('[Supabase Storage Error] createSignedUrl:', error);
      const isNotFound =
        error.statusCode === '404' ||
        error.status === 404 ||
        error.code === 'NoSuchKey' ||
        error.message?.includes('Object not found');

      return res.status(isNotFound ? 404 : 502).json({
        error: isNotFound ? 'PDF file not found in storage.' : 'Failed to generate signed download URL.',
        details: error.message,
      });
    }

    // Return the Vercel-proxied view URL which prevents client-side ERR_CONNECTION_TIMED_OUT on mobile/Jio networks
    const proxyUrl = `/api/storage/view?path=${encodeURIComponent(cleanPath)}`;

    return res.status(200).json({
      success: true,
      signedUrl: proxyUrl,
      directSignedUrl: data.signedUrl,
      expiresIn: expirySeconds,
      storagePath,
    });
  } catch (err) {
    console.error('[API Error] download-url:', err);
    return res.status(500).json({
      error: 'Internal server error while creating download URL.',
      details: err.message,
    });
  }
}
