import crypto from 'crypto';
import path from 'path';
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
    const { fileName, fileSize, contentType } = body;

    if (!fileName || typeof fileName !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid fileName.' });
    }

    // 1. Validate file extension (.pdf)
    const lowerName = fileName.toLowerCase().trim();
    if (!lowerName.endsWith('.pdf')) {
      return res.status(400).json({
        error: 'Invalid file extension. Only PDF documents (.pdf) are permitted.',
      });
    }

    // 2. Validate MIME type
    if (contentType && contentType !== 'application/pdf') {
      return res.status(400).json({
        error: 'Invalid MIME type. Only application/pdf files are permitted.',
      });
    }

    // 3. Enforce maximum file size (15 MB)
    const MAX_FILE_SIZE = 15 * 1024 * 1024;
    const sizeNumber = Number(fileSize);
    if (!sizeNumber || sizeNumber <= 0) {
      return res.status(400).json({ error: 'Invalid or missing fileSize.' });
    }
    if (sizeNumber > MAX_FILE_SIZE) {
      return res.status(400).json({
        error: `File size exceeds the 15 MB limit (provided: ${(sizeNumber / (1024 * 1024)).toFixed(2)} MB).`,
      });
    }

    // 4. Construct safe, unique storage path organized by Firebase UID
    const uid = user.uid;
    const uniqueId = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const sanitizedBase = path.basename(lowerName, '.pdf').replace(/[^a-zA-Z0-9_-]/g, '_');
    const storagePath = `${uid}/${uniqueId}_${sanitizedBase}.pdf`;

    // 5. Generate signed upload URL from Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .createSignedUploadUrl(storagePath);

    if (error) {
      console.error('[Supabase Storage Error] createSignedUploadUrl:', error);
      const isRlsError =
        error.message?.includes('row-level security') ||
        error.message?.includes('AccessDenied') ||
        error.statusCode === '403';

      const errorMessage = isRlsError
        ? 'Supabase RLS Error: Row-level security policy blocked upload URL creation.'
        : `Failed to generate signed upload URL from Supabase Storage: ${error.message}`;

      return res.status(502).json({
        error: errorMessage,
        details: error.message,
        code: error.code || (isRlsError ? 'RLS_ERROR' : 'STORAGE_ERROR'),
      });
    }

    return res.status(200).json({
      success: true,
      signedUrl: data.signedUrl,
      token: data.token,
      path: storagePath,
      bucket: BUCKET_NAME,
      maxSizeBytes: MAX_FILE_SIZE,
    });
  } catch (err) {
    console.error('[API Error] upload-url:', err);
    return res.status(500).json({
      error: 'Internal server error while creating signed upload URL.',
      details: err.message,
    });
  }
}
