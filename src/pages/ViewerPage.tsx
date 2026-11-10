import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { StudyMaterial, UserProfile } from '../types';
import { resourceService } from '../services/resourceService';
import { bookmarkService } from '../services/bookmarkService';
import { profileService } from '../services/profileService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { ShareModal } from '../components/common/ShareModal';
import { DocumentGrid } from '../components/resources/DocumentGrid';
import { getPdfJsLibrary, getCachedSignedPdfUrl, invalidateSignedPdfUrl } from '../utils/pdfHelper';

export const ViewerPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const fileParam = searchParams.get('file');
  const docParam = searchParams.get('doc');
  const titleParam = searchParams.get('title');

  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  // Instant optimistic metadata if navigated from a card on HomePage, SearchPage, or AccountPage
  const passedMaterial = (location.state as any)?.material as StudyMaterial | undefined;

  const [material, setMaterial] = useState<StudyMaterial | null>(() => passedMaterial || null);
  const [uploader, setUploader] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(() => !passedMaterial);
  const [error, setError] = useState<string | null>(null);

  const [isSaved, setIsSaved] = useState<boolean>(() =>
    passedMaterial ? bookmarkService.isBookmarked(passedMaterial.id, user?.uid) : false
  );
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);

  const [totalPages, setTotalPages] = useState<number>(0);
  const [relatedMaterials, setRelatedMaterials] = useState<StudyMaterial[]>([]);

  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState<number>(0);
  const [pdfLoading, setPdfLoading] = useState<boolean>(true);
  const [pdfLoaded, setPdfLoaded] = useState<boolean>(false);
  const [pdfRenderError, setPdfRenderError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Ensure body has viewer-mode class when on the viewer page
  useEffect(() => {
    document.body.classList.add('viewer-mode');
    return () => {
      document.body.classList.remove('viewer-mode');
    };
  }, []);

  // Pre-warm the PDF engine immediately on mount so it is ready before the PDF stream arrives
  useEffect(() => {
    getPdfJsLibrary().catch(() => {});
  }, []);

  // Sync document title and bookmarks if material was pre-passed
  useEffect(() => {
    if (material) {
      document.title = `${material.title} - Study Book`;
      setIsSaved(bookmarkService.isBookmarked(material.id, user?.uid));
      bookmarkService.saveContinueReading(material);
    }
  }, [material?.id, user?.uid]);

  // Load / revalidate document metadata from Firestore
  useEffect(() => {
    let isCancelled = false;
    const fetchDoc = async () => {
      const targetId = slug || docParam || fileParam;
      if (!targetId && !material) {
        setError('No document specified.');
        setLoading(false);
        return;
      }

      if (!material) {
        setLoading(true);
      }
      setError(null);

      try {
        let docData = targetId ? await resourceService.getMaterialBySlugOrId(targetId) : null;

        // Fallback for direct file URL query param
        if (!docData && fileParam) {
          docData = {
            id: docParam || 'external-doc',
            title: titleParam || 'Study Material',
            subject: 'Engineering',
            fileUrl: fileParam,
            createdAt: new Date().toISOString(),
          };
        }

        if (!docData && !material) {
          setError('Document not found or has been removed.');
          setLoading(false);
          return;
        }

        if (!isCancelled && docData) {
          setMaterial(docData);
          document.title = `${docData.title} - Study Book`;
          setIsSaved(bookmarkService.isBookmarked(docData.id, user?.uid));
          bookmarkService.saveContinueReading(docData);

          // Fetch uploader profile
          if (docData.uploaderUid) {
            profileService.getProfile(docData.uploaderUid).then((prof) => {
              if (!isCancelled && prof) setUploader(prof);
            });
          }

          // Fetch related notes
          resourceService.searchMaterials(docData.subject).then((related) => {
            if (!isCancelled) {
              setRelatedMaterials(related.filter((r) => r.id !== docData?.id).slice(0, 4));
            }
          });
        }
      } catch (err: any) {
        if (!isCancelled && !material) {
          setError(err.message || 'Failed to load document details.');
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchDoc();
    return () => {
      isCancelled = true;
    };
  }, [slug, docParam, fileParam]);

  // Request/refresh signed download URL using high-speed in-memory cache
  const refreshSignedUrl = async (forceFresh = false) => {
    if (!material) return;
    const targetPath = material.storagePath || material.fileUrl;
    if (!targetPath) return;

    if (forceFresh) {
      invalidateSignedPdfUrl(targetPath);
    }

    setPdfLoading(true);
    setPdfLoaded(false);
    setPdfRenderError(null);

    try {
      // Uses in-memory cache if previously requested by thumbnail card, returning in ~0ms
      const url = await getCachedSignedPdfUrl(targetPath, forceFresh);
      setSignedUrl(url);
      setRetryKey((prev) => prev + 1);
    } catch (err: any) {
      console.error('Failed to obtain signed URL:', err);
      setPdfRenderError(err.message || 'Could not obtain secure viewing URL.');
      setPdfLoading(false);
    }
  };

  useEffect(() => {
    if (material) {
      refreshSignedUrl(false);
    }
  }, [material?.id, material?.storagePath, material?.fileUrl]);

  // High-performance virtualized progressive PDF rendering
  useEffect(() => {
    if (!signedUrl || !containerRef.current) return;

    let isCancelled = false;
    let observer: IntersectionObserver | null = null;
    const container = containerRef.current;
    container.innerHTML = '';
    setPdfLoading(true);
    setPdfLoaded(false);
    setPdfRenderError(null);

    const renderPdf = async () => {
      let pdfjs: any = null;
      try {
        pdfjs = await getPdfJsLibrary();
      } catch (err: any) {
        if (!isCancelled) {
          console.error('PDF.js loading failed:', err);
          setPdfRenderError('Failed to load PDF viewer engine. Please check your internet connection and refresh.');
          setPdfLoading(false);
        }
        return;
      }

      try {
        // Fast streaming load with 256KB byte-range chunks
        const loadingTask = pdfjs.getDocument({
          url: signedUrl,
          cMapUrl: '/cmaps/',
          cMapPacked: true,
          rangeChunkSize: 262144,
          enableXfa: false,
        });

        const pdf = await loadingTask.promise;
        if (isCancelled) return;

        setTotalPages(pdf.numPages);

        const containerWidth = container.clientWidth || window.innerWidth;
        const isMobile = window.innerWidth <= 768;
        const padding = isMobile ? 0 : 96;
        const maxCanvasWidth = isMobile ? containerWidth : Math.min(containerWidth - padding, 920);

        // Fetch Page 1 first to determine dimensions and render ASAP!
        const page1 = await pdf.getPage(1);
        if (isCancelled) return;

        const unscaledViewport = page1.getViewport({ scale: 1 });
        const fitScale = maxCanvasWidth / unscaledViewport.width;
        const scale = Math.min(Math.max(fitScale, 0.35), 2.0);
        const viewport = page1.getViewport({ scale });
        // Cap DPR to 2 for optimal balance of razor-sharp text and fast rendering
        const outputScale = Math.min(window.devicePixelRatio || 1, 2);

        const pageStyleWidth = isMobile ? '100%' : `${Math.floor(viewport.width)}px`;
        const pageStyleHeight = isMobile ? 'auto' : `${Math.floor(viewport.height)}px`;
        const estimatedHeightPx = Math.floor(viewport.height);

        // Function to render a specific page into its placeholder slot
        const renderPageIntoSlot = async (pageNum: number, slotEl: HTMLDivElement) => {
          if (slotEl.getAttribute('data-rendered') === 'true' || isCancelled) return;
          slotEl.setAttribute('data-rendered', 'true');

          try {
            const page = pageNum === 1 ? page1 : await pdf.getPage(pageNum);
            if (isCancelled) return;

            const pViewport = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            canvas.className = 'pdf-page-canvas';
            canvas.width = Math.floor(pViewport.width * outputScale);
            canvas.height = Math.floor(pViewport.height * outputScale);
            canvas.style.width = pageStyleWidth;
            canvas.style.height = pageStyleHeight;
            canvas.style.maxWidth = isMobile ? '100%' : '920px';
            canvas.style.margin = isMobile ? '0' : '0 auto';

            const ctx = canvas.getContext('2d');
            if (ctx) {
              const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;
              await page.render({ canvasContext: ctx, transform, viewport: pViewport }).promise;
            }

            if (!isCancelled) {
              slotEl.innerHTML = '';
              slotEl.style.minHeight = 'auto';
              slotEl.appendChild(canvas);
            }
          } catch (pageErr) {
            console.warn(`Error rendering page ${pageNum}:`, pageErr);
            slotEl.removeAttribute('data-rendered');
          }
        };

        // Create virtualized page slots for all pages
        const slots: HTMLDivElement[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const slot = document.createElement('div');
          slot.className = 'pdf-page-slot';
          slot.id = `pdf-page-${i}`;
          slot.setAttribute('data-page-number', String(i));
          slot.style.width = '100%';
          slot.style.display = 'flex';
          slot.style.justifyContent = 'center';
          slot.style.alignItems = 'center';
          slot.style.minHeight = `${estimatedHeightPx}px`;
          slot.style.margin = isMobile ? '0 0 2px 0' : '0 auto 16px auto';
          slot.style.padding = '0';

          if (i > 1) {
            slot.innerHTML = `
              <div class="pdf-page-skeleton" style="width: ${pageStyleWidth}; height: ${pageStyleHeight}; min-height: ${estimatedHeightPx}px; border-radius: ${isMobile ? '0' : '8px'}; margin: ${isMobile ? '0 0 2px 0' : '0 auto'};">
                <span>Page ${i} of ${pdf.numPages}</span>
              </div>
            `;
          }

          container.appendChild(slot);
          slots.push(slot);
        }

        // 1. Render Page 1 IMMEDIATELY — user sees content in < 300ms!
        await renderPageIntoSlot(1, slots[0]);
        if (!isCancelled) {
          setPdfLoading(false);
          setPdfLoaded(true);
        }

        // 2. Pre-render Page 2 immediately if present for seamless initial scrolling
        if (pdf.numPages >= 2 && !isCancelled) {
          renderPageIntoSlot(2, slots[1]).catch(() => {});
        }

        // 3. Set up IntersectionObserver for remaining pages (3...N)
        observer = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting) {
                const targetEl = entry.target as HTMLDivElement;
                const pageNum = Number(targetEl.getAttribute('data-page-number'));
                if (pageNum && targetEl.getAttribute('data-rendered') !== 'true') {
                  renderPageIntoSlot(pageNum, targetEl).catch(() => {});
                }
              }
            }
          },
          { rootMargin: '800px 0px 800px 0px' }
        );

        for (let i = 2; i < slots.length; i++) {
          observer.observe(slots[i]);
        }

        // 4. Background idle pre-render: progressively pre-rasterize next pages during idle cycles
        let nextIdlePage = 3;
        const renderNextIdle = () => {
          if (isCancelled || nextIdlePage > pdf.numPages) return;
          const currPage = nextIdlePage++;
          const slot = slots[currPage - 1];
          if (slot && slot.getAttribute('data-rendered') !== 'true') {
            renderPageIntoSlot(currPage, slot).then(() => {
              if (!isCancelled && nextIdlePage <= pdf.numPages) {
                if ('requestIdleCallback' in window) {
                  (window as any).requestIdleCallback(renderNextIdle, { timeout: 1000 });
                } else {
                  setTimeout(renderNextIdle, 100);
                }
              }
            }).catch(() => {});
          } else if (nextIdlePage <= pdf.numPages) {
            renderNextIdle();
          }
        };

        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(renderNextIdle, { timeout: 1200 });
        } else {
          setTimeout(renderNextIdle, 300);
        }

      } catch (err: any) {
        console.error('PDF rendering failed:', err);
        if (!isCancelled) {
          const isForbidden =
            err?.message?.includes('403') ||
            err?.message?.includes('401') ||
            err?.name === 'MissingPDFException';
          setPdfRenderError(
            isForbidden
              ? 'PDF access link has expired or access was revoked. Click "Refresh Access Link" to generate a fresh signed session.'
              : err.message || 'Failed to render PDF document.'
          );
        }
      } finally {
        if (!isCancelled) {
          setPdfLoading(false);
        }
      }
    };

    renderPdf();
    return () => {
      isCancelled = true;
      if (observer) {
        observer.disconnect();
      }
    };
  }, [signedUrl, retryKey]);

  const handleBookmark = async () => {
    if (!material) return;
    const previousState = isSaved;
    const nextState = !previousState;
    // Instant 0ms optimistic UI feedback
    setIsSaved(nextState);
    showToast(nextState ? 'PDF saved to your library!' : 'PDF removed from saved list.', 'info');
    try {
      await bookmarkService.toggleBookmark(material, user?.uid);
    } catch {
      setIsSaved(previousState);
      showToast('Could not save PDF.', 'error');
    }
  };

  const handleToggleFullscreen = () => {
    const el = document.getElementById('pdf-viewer-container');
    if (!document.fullscreenElement) {
      el?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen?.();
    }
  };

  const handleShare = async () => {
    if (!material) return;
    const isMobile = window.innerWidth <= 768 || /Mobi|Android|iPhone/i.test(navigator.userAgent);
    const fullUrl = window.location.href;
    const title = material.title || 'Study Material';
    const text = `Check out "${title}" on Study Book!`;

    // On mobile devices, prioritize native Web Share API
    if (isMobile && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title,
          text,
          url: fullUrl,
        });
        showToast('Shared successfully!', 'success');
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return;
        }
        console.warn('Native share error, falling back to modal:', err);
      }
    }

    // Fallback to ShareModal on desktop or unsupported browsers
    setIsShareOpen(true);
  };

  if (loading) {
    return (
      <div className="page-loader" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
        <p>Loading Document...</p>
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <i className="fas fa-exclamation-triangle" style={{ fontSize: '3rem', color: '#ef4444', marginBottom: '20px' }}></i>
        <h2>Document Unavailable</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '30px' }}>{error || 'Document could not be located.'}</p>
        <Link to="/" className="btn btn-purple">
          Back to Homepage
        </Link>
      </div>
    );
  }

  const uploaderName = uploader?.name || material.uploaderName || 'Study Book Community';
  const uploadDate = material.createdAt
    ? new Date(material.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Recently';

  // Helper to provide a clean, short metadata label on mobile screens
  const getShortMeta = (course?: string, branch?: string, subject?: string) => {
    let branchText = branch || subject || '';
    const abbrMatch = branchText.match(/\(([^)]+)\)/);
    if (abbrMatch && abbrMatch[1]) {
      branchText = abbrMatch[1].trim();
    } else if (branchText.length > 16) {
      branchText = branchText.slice(0, 14).trim() + '...';
    }
    const courseText = course ? `${course} • ` : '';
    return `${courseText}${branchText}`;
  };

  return (
    <div className="viewer-page">
      {/* Sticky Top Bar */}
      <header className="viewer-top-bar">
        <div className="v-top-left">
          <button className="v-back-btn" onClick={() => navigate(-1)} title="Go Back">
            <i className="fas fa-arrow-left"></i>
          </button>
          <div className="v-doc-info">
            <h1 className="v-doc-title" title={material.title}>
              {material.title}
            </h1>
            <span
              className="v-doc-meta"
              title={material.course ? `${material.course} • ${material.branch || material.subject}` : material.branch || material.subject}
            >
              <span className="v-doc-meta-desktop">
                {material.course ? `${material.course} • ` : ''}
                {material.branch || material.subject}
              </span>
              <span className="v-doc-meta-mobile">
                {getShortMeta(material.course, material.branch, material.subject)}
              </span>
            </span>
          </div>
        </div>

        <div className="v-top-right">
          <button className="v-action-btn" onClick={toggleTheme} title="Toggle Theme">
            <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>

          <button className="v-action-btn" onClick={handleBookmark} title="Save PDF">
            <i className={`${isSaved ? 'fas' : 'far'} fa-bookmark`} style={{ color: isSaved ? 'var(--blue-accent)' : undefined }}></i>
            <span className="desktop-only">{isSaved ? 'Saved' : 'Save'}</span>
          </button>

          <button className="v-action-btn" onClick={handleShare} title="Share">
            <i className="fas fa-share-alt"></i>
            <span className="desktop-only">Share</span>
          </button>

          <button
            className="v-action-btn"
            onClick={() => setIsInfoOpen((prev) => !prev)}
            title="Document Details"
          >
            <i className="fas fa-info-circle"></i>
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="viewer-layout-wrapper">
        <main className="viewer-main-content">
          <div
            className="pdf-viewer-container"
            id="pdf-viewer-container"
            onDoubleClick={handleToggleFullscreen}
          >
            {pdfLoading && !pdfLoaded && (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--blue-accent)', marginBottom: '12px' }}></i>
                <p>Loading document pages...</p>
              </div>
            )}

            {pdfRenderError && (
              <div style={{ padding: '40px 20px', textAlign: 'center', maxWidth: '480px', margin: '0 auto' }}>
                <i className="fas fa-exclamation-triangle" style={{ fontSize: '2.5rem', color: '#ef4444', marginBottom: '16px' }}></i>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-dark)' }}>Unable to Display PDF</h3>
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: 1.5 }}>{pdfRenderError}</p>
                <button
                  type="button"
                  className="btn btn-purple"
                  onClick={() => refreshSignedUrl(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  <i className="fas fa-redo"></i> Refresh Access Link
                </button>
              </div>
            )}

            <div
              ref={containerRef}
              className="pdf-pages-list"
            >
              {/* Virtualized PDF page slots rendered dynamically */}
            </div>
          </div>

          {/* Related Notes */}
          {relatedMaterials.length > 0 && (
            <section className="viewer-bottom-section">
              <h3 className="v-section-title">🔥 Related Notes</h3>
              <DocumentGrid materials={relatedMaterials} />
            </section>
          )}
        </main>

        {/* Sliding Info Sidebar & Backdrop */}
        {isInfoOpen && (
          <div
            className="viewer-info-overlay"
            onClick={() => setIsInfoOpen(false)}
            aria-label="Close details overlay"
          />
        )}
        <aside className={`viewer-info-sidebar ${isInfoOpen ? 'open' : ''}`}>
          <div className="v-mobile-sheet-handle" />
          <div className="v-info-header">
            <h2>Document Details</h2>
            <button
              type="button"
              id="v-close-info-btn"
              className="v-close-info-btn"
              onClick={() => setIsInfoOpen(false)}
              aria-label="Close document details"
              title="Close"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="v-info-body">
            <div className="v-uploader-card">
              <div className="v-uploader-avatar">
                {uploaderName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 style={{ fontWeight: 600, fontSize: '0.95rem' }}>{uploaderName}</h4>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', display: 'block' }}>
                  {uploader?.college || material.college || material.university || ''}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>
                  Uploaded on {uploadDate}
                </span>
              </div>
            </div>

            <div className="v-info-item">
              <span className="v-item-label">Description</span>
              <span className="v-item-value">{material.description || 'No description provided.'}</span>
            </div>

            {totalPages > 0 && (
              <div className="v-info-item">
                <span className="v-item-label">Pages</span>
                <span className="v-item-value">{totalPages}</span>
              </div>
            )}

            <div className="v-info-item">
              <span className="v-item-label">Course</span>
              <span className="v-item-value">{material.course || 'B.Tech'}</span>
            </div>

            <div className="v-info-item">
              <span className="v-item-label">Subject</span>
              <span className="v-item-value">{material.subject || 'Engineering'}</span>
            </div>

            <div className="v-info-item">
              <span className="v-item-label">University / College</span>
              <span className="v-item-value">{material.college || material.university || 'AKTU'}</span>
            </div>

            {material.type && (
              <div className="v-info-item">
                <span className="v-item-label">Resource Type</span>
                <span className="v-item-value">{material.type}</span>
              </div>
            )}
          </div>
        </aside>
      </div>

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title={material.title}
        url={window.location.pathname}
        details={`${material.subject} • ${material.course || 'B.Tech'}`}
      />
    </div>
  );
};
