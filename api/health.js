import { setCors } from './_utils/cors.js';
import { BUCKET_NAME } from './_utils/supabase.js';

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  res.status(200).json({
    status: 'ok',
    service: 'studybook-storage-api-serverless',
    bucket: BUCKET_NAME,
    timestamp: new Date().toISOString(),
  });
}
