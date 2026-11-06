import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { StudyMaterial, UserProfile } from '../types';
import { resourceService } from '../services/resourceService';
import { bookmarkService } from '../services/bookmarkService';
import { profileService } from '../services/profileService';
import { storageService } from '../services/storageService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { ShareModal } from '../components/common/ShareModal';
import { DocumentGrid } from '../components/resources/DocumentGrid';
import { getPdfJsLibrary } from '../utils/pdfHelper';

export const ViewerPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const fileParam = searchParams.get('file');
  const docParam = searchParams.get('doc');
  const titleParam = searchParams.get('title');

  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const [material, setMaterial] = useState<StudyMaterial | null>(null);
  const [uploader, setUploader] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);

  const [totalPages, setTotalPages] = useState<number>(0);
  const [relatedMaterials, setRelatedMaterials] = useState<StudyMaterial[]>([]);

  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState<boolean>(false);
  const [pdfLoaded, setPdfLoaded] = useState<boolean>(false);
  const [pdfRenderError, setPdfRenderError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Load document metadata
  useEffect(() => {
    let isCancelled = false;
    const fetchDoc = async () => {
      setLoading(true);
      setError(null);

      const targetId = slug || docParam || fileParam;
      if (!targetId) {
        setError('No document specified.');
        setLoading(false);
        return;
      }

      try {
        let docData = await resourceService.getMaterialBySlugOrId(targetId);

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

        if (!docData) {
          setError('Document not found or has been removed.');
          setLoading(false);
          return;
        }

        if (!isCancelled) {
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
        if (!isCancelled) setError(err.message || 'Failed to load document details.');
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchDoc();
    return () => {
      isCancelled = true;
    };
  }, [slug, docParam, fileParam, user]);

  // Request/refresh signed download URL for private Supabase PDF files
  const refreshSignedUrl = async () => {
    if (!material) return;
    const targetPath = material.storagePath || material.fileUrl;
    if (!targetPath) return;

    setPdfLoading(true);
    setPdfLoaded(false);
    setPdfRenderError(null);
    try {
      const url = await storageService.getDownloadUrl(targetPath, 3600);
      setSignedUrl(url);
    } catch (err: any) {
      console.error('Failed to obtain signed URL:', err);
      setPdfRenderError(err.message || 'Could not obtain secure viewing URL.');
      setPdfLoading(false);
    }
  };

  useEffect(() => {
    if (material) {
      refreshSignedUrl();
    }
  }, [material?.id, material?.storagePath, material?.fileUrl]);

  // Render PDF pages using pdfjsLib with signed URL
  useEffect(() => {
    if (!signedUrl || !containerRef.current) return;

    let isCancelled = false;
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
        const loadingTask = pdfjs.getDocument({
          url: signedUrl,
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
          cMapPacked: true,
        });
        const pdf = await loadingTask.promise;
        if (isCancelled) return;

        setTotalPages(pdf.numPages);

        // Progressively render pages
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          if (isCancelled) return;

          const containerWidth = container.clientWidth || window.innerWidth;
          const isMobile = window.innerWidth <= 768;
          // Calculate scale ensuring ample left and right margins
          const padding = isMobile ? 36 : 96;
          const unscaledViewport = page.getViewport({ scale: 1 });
          const fitScale = (containerWidth - padding) / unscaledViewport.width;
          const scale = Math.min(Math.max(fitScale, 0.35), 2.0);

          const viewport = page.getViewport({ scale });
          const outputScale = window.devicePixelRatio || 1;

          const canvas = document.createElement('canvas');
          canvas.className = 'pdf-page-canvas';
          canvas.width = Math.floor(viewport.width * outputScale);
          canvas.height = Math.floor(viewport.height * outputScale);
          canvas.style.width = isMobile ? 'calc(100% - 24px)' : `${Math.floor(viewport.width)}px`;
          canvas.style.height = isMobile ? 'auto' : `${Math.floor(viewport.height)}px`;
          canvas.style.maxWidth = isMobile ? 'calc(100% - 24px)' : '920px';
          canvas.style.margin = '0 auto';

          const context = canvas.getContext('2d');
          if (context) {
            const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;
            await page.render({ canvasContext: context, transform, viewport }).promise;
          }

          if (!isCancelled) {
            container.appendChild(canvas);
            // Instantly remove loading indicator once the PDF / first page is loaded & attached
            if (i === 1) {
              setPdfLoading(false);
              setPdfLoaded(true);
            }
          }
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
    };
  }, [signedUrl]);

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
            <span className="v-doc-meta">
              {material.course ? `${material.course} • ` : ''}
              {material.branch || material.subject}
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

          <button className="v-action-btn" onClick={() => setIsShareOpen(true)} title="Share">
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
                <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Unable to Display PDF</h3>
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '20px' }}>{pdfRenderError}</p>
                <button
                  type="button"
                  className="btn btn-purple"
                  onClick={refreshSignedUrl}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 20px' }}
                >
                  <i className="fas fa-redo"></i> Refresh Access Link
                </button>
              </div>
            )}

            <div
              ref={containerRef}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                width: '100%',
              }}
            >
              {/* PDF canvases rendered dynamically */}
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
