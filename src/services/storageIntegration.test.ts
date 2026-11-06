import { describe, it, expect, vi, beforeEach } from 'vitest';
import { storageService } from './storageService';
import { auth } from './firebase';
import { supabase } from '../lib/supabase';

describe('Supabase Storage Integration Test Suite', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Requirement 1 & 5: Upload Valid PDF while Logged In', () => {
    it('successfully uploads valid PDF <= 15MB for an authenticated student', async () => {
      // Mock authenticated user
      vi.spyOn(auth, 'currentUser', 'get').mockReturnValue({
        uid: 'user-aktu-101',
        getIdToken: vi.fn().mockResolvedValue('mock-firebase-id-token'),
      } as any);

      // Mock backend upload URL response
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          signedUrl: 'https://hqrbmfjvsaltonpbivta.supabase.co/storage/v1/s3/...',
          token: 'mock-upload-token-abc',
          path: 'user-aktu-101/1730559600000_engineering_physics.pdf',
        }),
      });
      global.fetch = mockFetch;

      // Mock Supabase storage uploadToSignedUrl
      vi.spyOn(supabase.storage, 'from').mockReturnValue({
        uploadToSignedUrl: vi.fn().mockResolvedValue({
          data: { path: 'user-aktu-101/1730559600000_engineering_physics.pdf' },
          error: null,
        }),
      } as any);

      // Create a mock PDF file (2MB)
      const validPdf = new File(['%PDF-1.4 Mock Content'], 'engineering_physics.pdf', {
        type: 'application/pdf',
      });

      const progressTracker: { percent: number; status: string }[] = [];
      const result = await storageService.uploadPdf(validPdf, (percent, status) => {
        progressTracker.push({ percent, status });
      });

      expect(result.storageProvider).toBe('supabase');
      expect(result.storagePath).toBe('user-aktu-101/1730559600000_engineering_physics.pdf');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/storage/upload-url'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-firebase-id-token',
          }),
        })
      );
      expect(progressTracker.length).toBeGreaterThan(0);
    });
  });

  describe('Requirement 2: Reject Files Larger than 15 MB', () => {
    it('immediately rejects files exceeding the 15 MB limit', async () => {
      vi.spyOn(auth, 'currentUser', 'get').mockReturnValue({
        uid: 'user-aktu-101',
        getIdToken: vi.fn(),
      } as any);

      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      // Create oversized file mock (16 MB)
      const oversizedFile = new File(['x'], 'heavy_book.pdf', {
        type: 'application/pdf',
      });
      Object.defineProperty(oversizedFile, 'size', { value: 16 * 1024 * 1024 });

      await expect(storageService.uploadPdf(oversizedFile)).rejects.toThrow(
        /exceeds the 15 MB limit/i
      );

      // Verify no network call was made
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Requirement 3: Reject Non-PDF Files', () => {
    it('rejects files with non-PDF mime types and extensions', async () => {
      vi.spyOn(auth, 'currentUser', 'get').mockReturnValue({
        uid: 'user-aktu-101',
        getIdToken: vi.fn(),
      } as any);

      const docxFile = new File(['mock content'], 'notes.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      await expect(storageService.uploadPdf(docxFile)).rejects.toThrow(
        /Only PDF documents/i
      );

      const exeFile = new File(['bin'], 'malware.exe', {
        type: 'application/x-msdownload',
      });

      await expect(storageService.uploadPdf(exeFile)).rejects.toThrow(
        /Only PDF documents/i
      );
    });
  });

  describe('Requirement 4: Reject Upload while Logged Out', () => {
    it('blocks upload if the student is not authenticated with Firebase', async () => {
      vi.spyOn(auth, 'currentUser', 'get').mockReturnValue(null);

      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      const validPdf = new File(['%PDF-1.4'], 'notes.pdf', { type: 'application/pdf' });

      await expect(storageService.uploadPdf(validPdf)).rejects.toThrow(
        /Authentication required/i
      );

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Requirement 6: View Uploaded PDF via Signed Download URL', () => {
    it('requests signed download URL from backend for private Supabase files', async () => {
      vi.spyOn(auth, 'currentUser', 'get').mockReturnValue({
        uid: 'student-reader-42',
        getIdToken: vi.fn().mockResolvedValue('token-123'),
      } as any);

      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          signedUrl: 'https://hqrbmfjvsaltonpbivta.supabase.co/storage/v1/object/sign/studybook-pdfs/user-1/file.pdf?token=xyz',
          expiresIn: 3600,
        }),
      });
      global.fetch = mockFetch;

      const privatePath = 'user-aktu-101/notes.pdf';
      const downloadUrl = await storageService.getDownloadUrl(privatePath, 3600);

      expect(downloadUrl).toContain('token=xyz');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/storage/download-url'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            storagePath: privatePath,
            expiresIn: 3600,
          }),
        })
      );
    });

    it('returns legacy Firebase Storage HTTP URLs directly for backward compatibility', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      const legacyFirebaseUrl = 'https://firebasestorage.googleapis.com/v0/b/studybook-15297.appspot.com/o/uploads%2Fdoc.pdf?alt=media';
      const result = await storageService.getDownloadUrl(legacyFirebaseUrl);

      expect(result).toBe(legacyFirebaseUrl);
      // No backend call needed for legacy direct URLs
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Requirement 7: Handle Expired Signed URLs', () => {
    it('throws meaningful error when backend reports expired or invalid URL', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: 'Access token expired or revoked',
        }),
      });
      global.fetch = mockFetch;

      await expect(
        storageService.getDownloadUrl('user-1/expired.pdf')
      ).rejects.toThrow(/Access token expired or revoked/);
    });
  });

  describe('Requirement 8 & 9: Secure File Deletion & Ownership Validation', () => {
    it('sends delete request to backend with authenticated Firebase ID token', async () => {
      vi.spyOn(auth, 'currentUser', 'get').mockReturnValue({
        uid: 'user-aktu-101',
        getIdToken: vi.fn().mockResolvedValue('token-owner-101'),
      } as any);

      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'File removed from Supabase storage',
        }),
      });
      global.fetch = mockFetch;

      await storageService.deleteFile('user-aktu-101/notes-to-delete.pdf');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/storage/delete'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer token-owner-101',
          }),
          body: JSON.stringify({ storagePath: 'user-aktu-101/notes-to-delete.pdf' }),
        })
      );
    });

    it('propagates authorization failure if a student attempts to delete another user file', async () => {
      vi.spyOn(auth, 'currentUser', 'get').mockReturnValue({
        uid: 'attacker-uid',
        getIdToken: vi.fn().mockResolvedValue('attacker-token'),
      } as any);

      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: 'Forbidden: You do not have permission to delete this file.',
        }),
      });
      global.fetch = mockFetch;

      await expect(
        storageService.deleteFile('victim-uid/victim-notes.pdf')
      ).rejects.toThrow(/Forbidden: You do not have permission to delete this file/);
    });
  });
});
