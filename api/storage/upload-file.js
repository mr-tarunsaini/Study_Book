import crypto from 'crypto';
import path from 'path';
import { setCors } from '../_utils/cors.js';
import { supabaseAdmin, BUCKET_NAME } from '../_utils/supabase.js';
import { verifyUserToken } from '../_utils/auth.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

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

    const rawFileName = req.headers['x-file-name'] || 'document.pdf';
    let fileName = 'document.pdf';
    try {
      fileName = decodeURIComponent(rawFileName);
    } catch {
      fileName = rawFileName;
    }

    const lowerName = fileName.toLowerCase().trim();
    if (!lowerName.endsWith('.pdf')) {
      return res.status(400).json({ error: 'Only PDF documents (.pdf) are permitted.' });
    }

    const chunks = [];
    let totalLength = 0;
    const MAX_SIZE = 15 * 1024 * 1024;

    for await (const chunk of req) {
      totalLength += chunk.length;
      if (totalLength > MAX_SIZE) {
        return res.status(400).json({ error: 'File size exceeds maximum permitted limit (15 MB).' });
      }
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);
    if (buffer.length === 0) {
      return res.status(400).json({ error: 'Uploaded file is empty.' });
    }

    const uid = user.uid;
    const uniqueId = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const sanitizedBase = path.basename(lowerName, '.pdf').replace(/[^a-zA-Z0-9_-]/g, '_');
    const storagePath = `${uid}/${uniqueId}_${sanitizedBase}.pdf`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      console.error('[Supabase Storage Upload Error]', uploadError);
      return res.status(502).json({
        error: `Supabase Storage upload failed: ${uploadError.message}`,
        details: uploadError.message,
      });
    }

    return res.status(200).json({
      success: true,
      storagePath,
      fileUrl: storagePath,
      storageProvider: 'supabase',
    });
  } catch (err) {
    console.error('[API Error] upload-file:', err);
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Internal server error while processing upload.',
        details: err.message,
      });
    }
  }
}
