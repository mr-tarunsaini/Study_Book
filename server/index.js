import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { createClient } from '@supabase/supabase-js';

// Resolve directory paths in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env then root .env
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 5001;

// Configuration
const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'studybook-pdfs';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://hqrbmfjvsaltonpbivta.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  '';
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'studybook-15297';

// Initialize Firebase Admin SDK (Singleton)
let firebaseApp = null;
if (!getApps().length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      firebaseApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: FIREBASE_PROJECT_ID,
      });
      console.log('[Firebase Admin] Initialized with Service Account');
    } else {
      firebaseApp = initializeApp({
        projectId: FIREBASE_PROJECT_ID,
      });
      console.log(`[Firebase Admin] Initialized for project: ${FIREBASE_PROJECT_ID}`);
    }
  } catch (err) {
    console.error('[Firebase Admin] Initialization warning:', err.message);
  }
} else {
  firebaseApp = getApps()[0];
}

const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;

// Initialize Supabase Admin Client
const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
if (hasServiceRoleKey) {
  console.log('[Supabase Admin] Initialized with Service Role Key (RLS bypassed for signed operations)');
} else {
  console.warn('\n⚠️  [StudyBook Backend] WARNING: SUPABASE_SERVICE_ROLE_KEY is not defined in server/.env.');
  console.warn('⚠️  The server is currently using the public publishable key.');
  console.warn('⚠️  If uploads fail with "new row violates row-level security policy", either:');
  console.warn('    1. Add SUPABASE_SERVICE_ROLE_KEY=<secret_key> to server/.env (Recommended)');
  console.warn('    2. OR add an RLS policy for "studybook-pdfs" in Supabase SQL Editor.\n');
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Setup CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://study-book-seven.vercel.app',
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()) : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, or same-origin serverless calls)
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        process.env.NODE_ENV !== 'production'
      ) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked origin: ${origin}`));
      }
    },
    credentials: true,
  })
);

// URL rewrite normalization middleware for Vercel serverless rewrites
app.use((req, res, next) => {
  if (
    !req.url.startsWith('/api') &&
    (req.url.startsWith('/storage') || req.url === '/health' || req.url.startsWith('/cron'))
  ) {
    req.url = '/api' + req.url;
  }
  next();
});

app.use(express.json());

/**
 * Authentication Middleware:
 * Verifies Firebase ID token received in the Authorization header.
 */
export async function authenticateFirebaseUser(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: Missing or invalid Authorization header. Firebase ID token required.',
    });
  }

  const idToken = authHeader.split('Bearer ')[1].trim();
  if (!idToken) {
    return res.status(401).json({ error: 'Unauthorized: Empty token provided.' });
  }

  try {
    if (!firebaseAuth) {
      throw new Error('Firebase Auth not initialized on server.');
    }
    const decodedToken = await firebaseAuth.verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('[Auth Error] Failed to verify Firebase token:', error.message);
    return res.status(401).json({
      error: 'Unauthorized: Invalid or expired Firebase ID token.',
      details: error.message,
    });
  }
}

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'studybook-storage-api',
    bucket: BUCKET_NAME,
    timestamp: new Date().toISOString(),
  });
});

/**
 * 1. POST /api/storage/upload-url
 * Generates a temporary signed upload URL for Supabase Storage.
 * Enforces:
 *  - Firebase user authentication
 *  - 15MB maximum file size limit
 *  - PDF MIME type and extension validation
 *  - Unique file path: {firebaseUid}/{uniqueId}_{cleanName}.pdf
 */
app.post('/api/storage/upload-url', authenticateFirebaseUser, async (req, res) => {
  try {
    const { fileName, fileSize, contentType } = req.body;

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

    // 3. Enforce maximum file size (15 MB = 15 * 1024 * 1024 bytes)
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
    const uid = req.user.uid;
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
        ? 'Supabase RLS Error: Row-level security policy blocked upload URL creation. To fix this, add SUPABASE_SERVICE_ROLE_KEY to server/.env or add an RLS policy for bucket studybook-pdfs in Supabase.'
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
    console.error('[API Error] /api/storage/upload-url:', err);
    return res.status(500).json({
      error: 'Internal server error while creating signed upload URL.',
      details: err.message,
    });
  }
});

/**
 * 2. POST /api/storage/download-url
 * Generates a temporary signed download URL for private PDFs.
 * Expiry: 1 hour (3600 seconds) by default.
 */
app.post('/api/storage/download-url', async (req, res) => {
  try {
    const { storagePath, expiresIn = 3600 } = req.body;

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

    // Optional verification of Firebase Auth if Authorization header provided
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const idToken = authHeader.split('Bearer ')[1].trim();
        if (firebaseAuth) {
          const decoded = await firebaseAuth.verifyIdToken(idToken);
          req.user = decoded;
        }
      } catch (authErr) {
        console.warn('[Download Token Warning] Token verification failed:', authErr.message);
      }
    }

    const expirySeconds = Math.min(Math.max(Number(expiresIn) || 3600, 60), 86400); // 1 min to 24 hrs

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

    return res.status(200).json({
      success: true,
      signedUrl: data.signedUrl,
      expiresIn: expirySeconds,
      storagePath,
    });
  } catch (err) {
    console.error('[API Error] /api/storage/download-url:', err);
    return res.status(500).json({
      error: 'Internal server error while creating download URL.',
      details: err.message,
    });
  }
});

/**
 * 3. POST /api/storage/delete
 * Validates ownership and deletes the PDF from Supabase Storage.
 */
app.post('/api/storage/delete', authenticateFirebaseUser, async (req, res) => {
  try {
    const { storagePath } = req.body;

    if (!storagePath || typeof storagePath !== 'string') {
      return res.status(400).json({ error: 'Missing storagePath to delete.' });
    }

    // Prevent path traversal
    if (storagePath.includes('..') || storagePath.startsWith('/')) {
      return res.status(400).json({ error: 'Invalid storagePath format.' });
    }

    // Validate ownership: File path must start with user's Firebase UID: {uid}/...
    const uid = req.user.uid;
    const isOwner = storagePath.startsWith(`${uid}/`);
    const isAdmin = Boolean(req.user.admin);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        error: 'Forbidden: You do not have permission to delete this file.',
      });
    }

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([storagePath]);

    if (error) {
      console.error('[Supabase Storage Error] remove:', error);
      return res.status(502).json({
        error: 'Failed to delete file from Supabase Storage.',
        details: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'File removed from Supabase storage successfully.',
      data,
    });
  } catch (err) {
    console.error('[API Error] /api/storage/delete:', err);
    return res.status(500).json({
      error: 'Internal server error while deleting file.',
      details: err.message,
    });
  }
});

/**
 * 4. POST /api/storage/delete-batch
 * Deletes multiple files from Supabase Storage in a single call.
 */
app.post('/api/storage/delete-batch', authenticateFirebaseUser, async (req, res) => {
  try {
    const { storagePaths } = req.body;
    if (!Array.isArray(storagePaths) || storagePaths.length === 0) {
      return res.status(400).json({ error: 'Missing or empty storagePaths array.' });
    }

    const uid = req.user.uid;
    const isAdmin = Boolean(req.user.admin);

    // Validate ownership: user can delete their own files, admin can delete any
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
    console.error('[API Error] /api/storage/delete-batch:', err);
    return res.status(500).json({
      error: 'Internal server error while batch deleting files.',
      details: err.message,
    });
  }
});

/**
 * 5. POST /api/storage/cleanup-expired
 * Automatically purges materials older than specified threshold (default: 100 days)
 */
app.post('/api/storage/cleanup-expired', async (req, res) => {
  try {
    const daysThreshold = Number(req.body.daysThreshold) || 100;
    const cutoffTime = Date.now() - (daysThreshold * 24 * 60 * 60 * 1000);
    const cutoffDate = new Date(cutoffTime);

    console.log(`[Backend Auto-Cleanup] Triggered cleanup for materials older than ${daysThreshold} days (prior to ${cutoffDate.toISOString()}).`);

    let deletedCount = 0;
    const { storagePaths = [] } = req.body;

    if (Array.isArray(storagePaths) && storagePaths.length > 0) {
      const { data, error } = await supabaseAdmin.storage
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
    console.error('[API Error] /api/storage/cleanup-expired:', err);
    return res.status(500).json({
      error: 'Internal server error during auto-cleanup.',
      details: err.message,
    });
  }
});

// Start listening if run directly (skip when invoked inside Vercel serverless environment or tests)
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[StudyBook Backend] Storage API running on http://localhost:${PORT}`);
    console.log(`[StudyBook Backend] Storage bucket: ${BUCKET_NAME}`);
  });
}

export default app;
