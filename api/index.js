// Serverless handler for Vercel / Netlify / Cloud Functions
import app from '../server/index.js';

export default function handler(req, res) {
  return app(req, res);
}
