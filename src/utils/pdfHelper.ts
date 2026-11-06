import { storageService } from '../services/storageService';

// In-memory cache for resolved signed URLs to optimize card rendering performance
const urlCache = new Map<string, { url: string; expiresAt: number }>();

/**
 * Ensures PDF.js library and worker are loaded in the browser environment.
 */
export const getPdfJsLibrary = async (): Promise<any> => {
  if (typeof window === 'undefined') return null;

  if ((window as any).pdfjsLib) {
    const lib = (window as any).pdfjsLib;
    lib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    return lib;
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src*="pdf.min.js"]');
    if (existing) {
      if ((window as any).pdfjsLib) {
        const lib = (window as any).pdfjsLib;
        lib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(lib);
        return;
      }
      existing.addEventListener('load', () => {
        const lib = (window as any).pdfjsLib;
        if (lib) {
          lib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          resolve(lib);
        } else {
          reject(new Error('PDF.js not available.'));
        }
      });
      existing.addEventListener('error', () => reject(new Error('Failed to load PDF.js script.')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    script.onload = () => {
      const lib = (window as any).pdfjsLib;
      if (lib) {
        lib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(lib);
      } else {
        reject(new Error('PDF.js not available after download.'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load PDF engine script.'));
    document.head.appendChild(script);
  });
};

/**
 * Obtains a cached or fresh signed download/preview URL for a given storage path or direct URL.
 */
export const getCachedSignedPdfUrl = async (storagePathOrUrl: string): Promise<string> => {
  if (!storagePathOrUrl) throw new Error('Path is required');

  // If already an absolute HTTP URL, return as-is
  if (storagePathOrUrl.startsWith('http://') || storagePathOrUrl.startsWith('https://')) {
    return storagePathOrUrl;
  }

  const cached = urlCache.get(storagePathOrUrl);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.url;
  }

  const url = await storageService.getDownloadUrl(storagePathOrUrl, 3600);
  // Cache for 45 minutes (2700 seconds)
  urlCache.set(storagePathOrUrl, {
    url,
    expiresAt: now + 45 * 60 * 1000,
  });

  return url;
};
