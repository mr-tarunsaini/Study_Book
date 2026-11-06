import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCachedSignedPdfUrl } from './pdfHelper';
import { storageService } from '../services/storageService';

describe('pdfHelper Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns external HTTP/HTTPS URLs directly without calling backend', async () => {
    const spy = vi.spyOn(storageService, 'getDownloadUrl');
    const externalUrl = 'https://example.com/mock-notes.pdf';

    const result = await getCachedSignedPdfUrl(externalUrl);
    expect(result).toBe(externalUrl);
    expect(spy).not.toHaveBeenCalled();
  });

  it('fetches and caches signed URLs for private Supabase storage paths', async () => {
    const mockSignedUrl = 'https://hqrbmfjvsaltonpbivta.supabase.co/storage/v1/object/sign/studybook-pdfs/path.pdf?token=123';
    const spy = vi.spyOn(storageService, 'getDownloadUrl').mockResolvedValue(mockSignedUrl);

    const storagePath = 'user-test-uid/notes-doc-1.pdf';

    // First call fetches from backend
    const result1 = await getCachedSignedPdfUrl(storagePath);
    expect(result1).toBe(mockSignedUrl);
    expect(spy).toHaveBeenCalledTimes(1);

    // Second call should return cached URL without repeating fetch
    const result2 = await getCachedSignedPdfUrl(storagePath);
    expect(result2).toBe(mockSignedUrl);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('throws error if empty path is provided', async () => {
    await expect(getCachedSignedPdfUrl('')).rejects.toThrow('Path is required');
  });
});
