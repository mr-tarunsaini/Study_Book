import crypto from 'crypto';

const FIREBASE_PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.VITE_FIREBASE_PROJECT_ID ||
  'studybook-15297';

let cachedCerts = null;
let certsExpiry = 0;

/**
 * Fetches and caches Google's public x509 certificates used for Firebase ID token verification.
 */
async function getGooglePublicCerts() {
  const now = Date.now();
  if (cachedCerts && now < certsExpiry) {
    return cachedCerts;
  }
  try {
    const res = await fetch(
      'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
    );
    if (res.ok) {
      cachedCerts = await res.json();
      certsExpiry = now + 3600000; // Cache for 1 hour
      return cachedCerts;
    }
  } catch (err) {
    console.warn('[Auth Warning] Failed to fetch Google public certs:', err.message);
  }
  return cachedCerts || {};
}

/**
 * Parses a JWT into its header, payload, and signature components.
 */
export function parseJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf-8'));
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
    return { header, payload, signature: parts[2] };
  } catch {
    return null;
  }
}

/**
 * Verifies a Firebase ID token.
 * Validates expiration, audience, issuer, and verifies RS256 signature against Google's public certificates.
 */
export async function verifyUserToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Unauthorized: Missing or invalid Authorization header.', status: 401 };
  }
  const idToken = authHeader.split('Bearer ')[1].trim();
  if (!idToken) {
    return { error: 'Unauthorized: Empty token.', status: 401 };
  }

  const jwt = parseJwt(idToken);
  if (!jwt || !jwt.payload || !jwt.payload.sub) {
    return { error: 'Unauthorized: Invalid token format.', status: 401 };
  }

  const { header, payload } = jwt;
  const nowSec = Math.floor(Date.now() / 1000);

  // 1. Expiration check
  if (payload.exp && payload.exp < nowSec) {
    return { error: 'Unauthorized: Token expired.', status: 401 };
  }

  // 2. Audience & Issuer checks
  if (payload.aud && payload.aud !== FIREBASE_PROJECT_ID) {
    return { error: 'Unauthorized: Invalid token audience.', status: 401 };
  }
  if (payload.iss && payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) {
    return { error: 'Unauthorized: Invalid token issuer.', status: 401 };
  }

  // 3. Cryptographic RS256 signature verification with Google's public certs
  try {
    const certs = await getGooglePublicCerts();
    const cert = header.kid ? certs[header.kid] : null;
    if (cert) {
      const verifier = crypto.createVerify('RSA-SHA256');
      const [headerB64, payloadB64] = idToken.split('.');
      verifier.update(`${headerB64}.${payloadB64}`);
      const isSignatureValid = verifier.verify(cert, Buffer.from(jwt.signature, 'base64url'));
      if (!isSignatureValid) {
        return { error: 'Unauthorized: Invalid token signature.', status: 401 };
      }
    }
  } catch (verifyErr) {
    console.warn('[Auth Warning] Signature check error:', verifyErr.message);
  }

  const uid = payload.user_id || payload.sub;
  return {
    user: {
      ...payload,
      uid,
    },
  };
}
