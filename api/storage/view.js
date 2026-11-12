import { Readable } from 'stream';
import { setCors } from '../_utils/cors.js';
import { supabaseAdmin, BUCKET_NAME } from '../_utils/supabase.js';

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method Not Allowed. Use GET.' });
  }

  const pathParam = req.query?.path || req.query?.storagePath;
  if (!pathParam || typeof pathParam !== 'string') {
    return res.status(400).json({ error: 'Missing path query parameter.' });
  }

  let cleanPath = pathParam.trim().replace(/^\/+/, '');
  if (cleanPath.startsWith(`${BUCKET_NAME}/`)) {
    cleanPath = cleanPath.slice(BUCKET_NAME.length + 1);
  }
  if (cleanPath.includes('..')) {
    return res.status(400).json({ error: 'Invalid path format.' });
  }

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .createSignedUrl(cleanPath, 3600);

    if (error || !data?.signedUrl) {
      console.warn('[View Warning] createSignedUrl failed:', error?.message);
      return res.status(404).json({ error: 'File not found in storage.' });
    }

    const upstream = await fetch(data.signedUrl);
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: 'Failed to fetch file from storage.' });
    }

    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/pdf');
    const contentLength = upstream.headers.get('content-length');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    res.setHeader(
      'Cache-Control',
      'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800'
    );
    res.setHeader('Content-Disposition', 'inline');

    if (req.method === 'HEAD') {
      return res.status(200).end();
    }

    if (upstream.body) {
      Readable.fromWeb(upstream.body).pipe(res);
    } else {
      res.status(200).end();
    }
  } catch (err) {
    console.error('[API Error] storage/view:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to stream document.', details: err.message });
    }
  }
}
