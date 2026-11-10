import { storageService } from '../services/storageService';

// In-memory cache for resolved signed URLs to optimize card rendering performance
const urlCache = new Map<string, { url: string; expiresAt: number }>();

let pdfJsPromise: Promise<any> | null = null;

/**
 * Configure worker source for pdfjsLib instance.
 * Prefers local self-hosted worker, falls back to CDN.
 */
function configureWorker(lib: any) {
  if (!lib || !lib.GlobalWorkerOptions) return lib;
  try {
    lib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  } catch {
    lib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
  return lib;
}

/**
 * Ensures PDF.js library and worker are loaded in the browser environment.
 * Shared singleton promise prevents multiple concurrent loads / race conditions.
 */
export const getPdfJsLibrary = async (): Promise<any> => {
  if (typeof window === 'undefined') return null;

  if ((window as any).pdfjsLib) {
    return configureWorker((window as any).pdfjsLib);
  }

  if (pdfJsPromise) return pdfJsPromise;

  pdfJsPromise = (async () => {
    // 1. Check if window.pdfjsLib is already available
    if ((window as any).pdfjsLib) {
      return configureWorker((window as any).pdfjsLib);
    }

    // 2. Poll briefly in case index.html <script src="/pdf.min.js"> is parsing
    for (let i = 0; i < 20; i++) {
      if ((window as any).pdfjsLib) {
        return configureWorker((window as any).pdfjsLib);
      }
      await new Promise((r) => setTimeout(r, 40));
    }

    // 3. Dynamic import from npm package pdfjs-dist
    try {
      const dist: any = await import('pdfjs-dist');
      if (dist) {
        const lib = typeof dist.getDocument === 'function' ? dist : dist.default;
        if (lib && typeof lib.getDocument === 'function') {
          (window as any).pdfjsLib = lib;
          return configureWorker(lib);
        }
      }
    } catch {
      // Package import failed, fallback to script tag injection
    }

    // 4. Inject script tag fallback: try /pdf.min.js first, then cdnjs
    return new Promise((resolve, reject) => {
      const injectScript = (src: string, onErr: () => void) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => {
          if ((window as any).pdfjsLib) {
            resolve(configureWorker((window as any).pdfjsLib));
          } else {
            onErr();
          }
        };
        script.onerror = onErr;
        document.head.appendChild(script);
      };

      // Try local self-hosted script first, fallback to CDN
      injectScript('/pdf.min.js', () => {
        injectScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js', () => {
          pdfJsPromise = null; // Allow retry on failure
          reject(new Error('Failed to load PDF viewer engine.'));
        });
      });
    });
  })();

  return pdfJsPromise;
};

/**
 * Obtains a cached or fresh signed download/preview URL for a given storage path or direct URL.
 * @param forceFresh If true, bypasses the in-memory cache and requests a brand new signed URL.
 */
export const getCachedSignedPdfUrl = async (
  storagePathOrUrl: string,
  forceFresh: boolean = false
): Promise<string> => {
  if (!storagePathOrUrl) throw new Error('Path is required');

  // If already an absolute HTTP URL, return as-is
  if (storagePathOrUrl.startsWith('http://') || storagePathOrUrl.startsWith('https://')) {
    return storagePathOrUrl;
  }

  const cached = urlCache.get(storagePathOrUrl);
  const now = Date.now();
  if (!forceFresh && cached && cached.expiresAt > now) {
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

/**
 * Invalidates the cached signed URL for a specific document storage path.
 */
export const invalidateSignedPdfUrl = (storagePathOrUrl: string): void => {
  if (storagePathOrUrl) {
    urlCache.delete(storagePathOrUrl);
  }
};
