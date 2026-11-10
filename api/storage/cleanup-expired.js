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
    const daysThreshold = Number(body.daysThreshold) || 100;
    const cutoffTime = Date.now() - daysThreshold * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(cutoffTime);

    let deletedCount = 0;
    const { storagePaths = [] } = body;

    if (Array.isArray(storagePaths) && storagePaths.length > 0) {
      const { error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .remove(storagePaths);

      if (!error) {
        deletedCount = storagePaths.length;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Auto-cleanup scan processed for threshold ${daysThreshold} days.`,
      cutoffDate: cutoffDate.toISOString(),
      deletedCount,
    });
  } catch (err) {
    console.error('[API Error] cleanup-expired:', err);
    return res.status(500).json({
      error: 'Internal server error during auto-cleanup.',
      details: err.message,
    });
  }
}
