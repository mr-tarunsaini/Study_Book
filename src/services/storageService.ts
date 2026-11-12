import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, auth } from './firebase';
import { supabase, STORAGE_BUCKET } from '../lib/supabase';

export interface UploadResult {
  storagePath: string;
  storageProvider: 'supabase' | 'firebase';
  fileUrl?: string;
}

export interface IStorageService {
  uploadPdf(
    file: File,
    onProgress?: (percent: number, statusText: string) => void
  ): Promise<UploadResult>;
  getDownloadUrl(storagePathOrUrl: string, expiresInSeconds?: number): Promise<string>;
  deleteFile(storagePathOrUrl: string): Promise<void>;
  deleteFilesBatch?(storagePaths: string[]): Promise<void>;
  uploadFile(file: File, folder?: string): Promise<string>;
}

class HybridStorageService implements IStorageService {
  /**
   * Secure PDF upload directly to Supabase Storage using signed upload URLs.
   * 1. Validates file locally (PDF only, <= 15MB).
   * 2. Obtains Firebase ID token from current user.
   * 3. Calls backend endpoint to verify token and mint signed upload URL.
   * 4. Uploads file directly to Supabase using uploadToSignedUrl().
   */
  async uploadPdf(
    file: File,
    onProgress?: (percent: number, statusText: string) => void
  ): Promise<UploadResult> {
    // 1. Client-side validation
    const MAX_SIZE = 15 * 1024 * 1024; // 15 MB
    if (file.size > MAX_SIZE) {
      throw new Error(
        `File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the 15 MB limit.`
      );
    }

    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      throw new Error('Invalid file type. Only PDF documents (.pdf) are permitted.');
    }

    // 2. Obtain current Firebase user ID token
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Authentication required. Please sign in before uploading.');
    }

    onProgress?.(15, 'Authenticating and authorizing upload session...');
    const idToken = await currentUser.getIdToken();

    // 3. Request temporary signed upload URL from backend
    onProgress?.(30, 'Requesting secure upload authorization...');
    const apiBase = import.meta.env.VITE_API_BASE_URL || '';
    const res = await fetch(`${apiBase}/api/storage/upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type || 'application/pdf',
      }),
    });

    if (!res.ok) {
      let errorMsg = 'Failed to obtain secure upload URL.';
      try {
        const errJson = await res.json();
        errorMsg = errJson.error || errJson.details || errorMsg;
      } catch {
        errorMsg = `${errorMsg} (HTTP ${res.status})`;
      }
      throw new Error(errorMsg);
    }

    const { token, path } = await res.json();

    // 4. Upload PDF directly to Supabase Storage using the signed upload token
    onProgress?.(55, 'Uploading PDF...');
    let uploadSuccessful = false;
    let finalPath = path;

    try {
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .uploadToSignedUrl(path, token, file, {
          contentType: 'application/pdf',
          upsert: false,
        });

      if (!uploadError) {
        uploadSuccessful = true;
      } else {
        console.warn('[Supabase Upload Warning] Direct upload error:', uploadError.message);
      }
    } catch (directErr: any) {
      console.warn('[Supabase Upload Warning] Direct connection failed or timed out:', directErr.message);
    }

    // Resilient fallback: If direct upload to Supabase timed out or failed, upload via secure serverless relay
    if (!uploadSuccessful) {
      onProgress?.(70, 'Using secure server relay upload...');
      const proxyRes = await fetch(`${apiBase}/api/storage/upload-file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/pdf',
          Authorization: `Bearer ${idToken}`,
          'x-file-name': encodeURIComponent(file.name),
        },
        body: file,
      });

      if (!proxyRes.ok) {
        let proxyErrMsg = 'Failed to upload document.';
        try {
          const proxyErrJson = await proxyRes.json();
          proxyErrMsg = proxyErrJson.error || proxyErrJson.details || proxyErrMsg;
        } catch {
          proxyErrMsg = `${proxyErrMsg} (HTTP ${proxyRes.status})`;
        }
        throw new Error(proxyErrMsg);
      }

      const proxyData = await proxyRes.json();
      finalPath = proxyData.storagePath || finalPath;
    }

    onProgress?.(90, 'Verifying upload integrity...');

    return {
      storagePath: finalPath,
      storageProvider: 'supabase',
      fileUrl: finalPath, // Use path as identifier; Viewer fetches fresh signed URL
    };
  }

  /**
   * Retrieves a signed download/preview URL for viewing or downloading the PDF.
   * - If the file is a legacy Firebase storage URL, returns it directly.
   * - If the file is a Supabase private storage path, asks backend for a signed download URL (1 hour expiry).
   */
  async getDownloadUrl(
    storagePathOrUrl: string,
    expiresInSeconds: number = 3600
  ): Promise<string> {
    if (!storagePathOrUrl) {
      throw new Error('No storage path or URL provided.');
    }

    // Check if it's already an absolute HTTP URL (legacy Firebase Storage or external link)
    if (
      storagePathOrUrl.startsWith('http://') ||
      storagePathOrUrl.startsWith('https://')
    ) {
      return storagePathOrUrl;
    }

    // Supabase private storage path - request signed download URL from backend
    const apiBase = import.meta.env.VITE_API_BASE_URL || '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (auth.currentUser) {
      try {
        const idToken = await auth.currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${idToken}`;
      } catch (e) {
        console.warn('Could not attach ID token to download URL request:', e);
      }
    }

    const res = await fetch(`${apiBase}/api/storage/download-url`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        storagePath: storagePathOrUrl,
        expiresIn: expiresInSeconds,
      }),
    });

    if (!res.ok) {
      let errorMsg = 'Failed to generate download URL.';
      try {
        const errJson = await res.json();
        errorMsg = errJson.error || errJson.details || errorMsg;
      } catch {
        errorMsg = `${errorMsg} (HTTP ${res.status})`;
      }
      throw new Error(errorMsg);
    }

    const data = await res.json();
    const rawUrl = data.signedUrl;
    if (rawUrl && rawUrl.startsWith('/')) {
      return `${apiBase}${rawUrl}`;
    }
    return rawUrl;
  }

  /**
   * Secure deletion of storage files:
   * - Routes Firebase URLs to Firebase Storage SDK.
   * - Routes Supabase storage paths to backend /api/storage/delete with Firebase ID token.
   */
  async deleteFile(storagePathOrUrl: string): Promise<void> {
    if (!storagePathOrUrl) return;

    // 1. Firebase Storage deletion
    if (
      storagePathOrUrl.includes('firebasestorage.app') ||
      storagePathOrUrl.includes('storage.googleapis.com')
    ) {
      try {
        const fileRef = ref(storage, storagePathOrUrl);
        await deleteObject(fileRef);
      } catch (e) {
        console.warn('Firebase storage file deletion error:', e);
      }
      return;
    }

    // 2. Supabase Storage deletion via authenticated backend
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Authentication required to delete stored files.');
    }

    const idToken = await currentUser.getIdToken();
    const apiBase = import.meta.env.VITE_API_BASE_URL || '';

    const res = await fetch(`${apiBase}/api/storage/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ storagePath: storagePathOrUrl }),
    });

    if (!res.ok) {
      let errorMsg = 'Failed to delete file from storage.';
      try {
        const errJson = await res.json();
        errorMsg = errJson.error || errJson.details || errorMsg;
      } catch {
        errorMsg = `${errorMsg} (HTTP ${res.status})`;
      }
      throw new Error(errorMsg);
    }
  }

  /**
   * Deletes multiple files from Supabase Storage in batch.
   */
  async deleteFilesBatch(storagePaths: string[]): Promise<void> {
    if (!storagePaths || storagePaths.length === 0) return;

    const currentUser = auth.currentUser;
    const apiBase = import.meta.env.VITE_API_BASE_URL || '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (currentUser) {
      try {
        const idToken = await currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${idToken}`;
      } catch (e) {
        console.warn('Could not get idToken for batch deletion:', e);
      }
    }

    try {
      await fetch(`${apiBase}/api/storage/delete-batch`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ storagePaths }),
      });
    } catch (err) {
      console.warn('Batch delete request error:', err);
    }
  }

  /**
   * Backward compatibility alias
   */
  async uploadFile(file: File, _folder: string = 'uploads/study-materials'): Promise<string> {
    const result = await this.uploadPdf(file);
    return result.storagePath;
  }
}

export const storageService: IStorageService = new HybridStorageService();
