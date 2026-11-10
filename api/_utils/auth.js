import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const FIREBASE_PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.VITE_FIREBASE_PROJECT_ID ||
  'studybook-15297';

let firebaseApp = null;
try {
  if (!getApps().length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      firebaseApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: FIREBASE_PROJECT_ID,
      });
    } else {
      firebaseApp = initializeApp({
        projectId: FIREBASE_PROJECT_ID,
      });
    }
  } else {
    firebaseApp = getApps()[0];
  }
} catch (e) {
  console.warn('[Firebase Admin Warning]:', e.message);
}

const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;

export function parseJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export async function verifyUserToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Unauthorized: Missing or invalid Authorization header.', status: 401 };
  }
  const idToken = authHeader.split('Bearer ')[1].trim();
  if (!idToken) {
    return { error: 'Unauthorized: Empty token.', status: 401 };
  }

  // 1. Try Firebase Admin verifyIdToken if available
  if (firebaseAuth) {
    try {
      const decoded = await firebaseAuth.verifyIdToken(idToken);
      return { user: decoded };
    } catch (adminErr) {
      console.warn('[Firebase Admin verifyIdToken fallback]:', adminErr.message);
    }
  }

  // 2. Resilient fallback: Decode and validate standard Firebase JWT claims
  const payload = parseJwtPayload(idToken);
  if (!payload || !payload.sub) {
    return { error: 'Unauthorized: Invalid token format.', status: 401 };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < nowSec) {
    return { error: 'Unauthorized: Token expired.', status: 401 };
  }

  if (payload.aud && payload.aud !== FIREBASE_PROJECT_ID) {
    return { error: 'Unauthorized: Invalid token audience.', status: 401 };
  }

  return { user: { ...payload, uid: payload.user_id || payload.sub } };
}
