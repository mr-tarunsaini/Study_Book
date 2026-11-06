import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { StudyMaterial } from '../../types';
import { bookmarkService } from '../../services/bookmarkService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getPdfJsLibrary, getCachedSignedPdfUrl } from '../../utils/pdfHelper';

interface DocumentCardProps {
  material: StudyMaterial;
  onBookmarkChanged?: (isSaved: boolean) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ material, onBookmarkChanged }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isSaved, setIsSaved] = useState<boolean>(() =>
    bookmarkService.isBookmarked(material.id, user?.uid)
  );
  const [previewLoaded, setPreviewLoaded] = useState<boolean>(false);
  const [previewLoading, setPreviewLoading] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    setIsSaved(bookmarkService.isBookmarked(material.id, user?.uid));
  }, [user, material.id]);

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const previousState = isSaved;
    const nextState = !previousState;
    // Instant 0ms optimistic UI feedback
    setIsSaved(nextState);
    showToast(nextState ? 'PDF saved to your library!' : 'PDF removed from saved list.', 'info');
    if (onBookmarkChanged) onBookmarkChanged(nextState);
    try {
      await bookmarkService.toggleBookmark(material, user?.uid);
    } catch {
      setIsSaved(previousState);
      if (onBookmarkChanged) onBookmarkChanged(previousState);
      showToast('Could not update saved status.', 'error');
    }
  };

  const handleClick = () => {
    bookmarkService.saveContinueReading(material);
  };

  // Render PDF first page preview onto canvas
  useEffect(() => {
    let isCancelled = false;
    const targetSource = material.storagePath || material.fileUrl;

    if (!targetSource) {
      setPreviewLoading(false);
      setPreviewLoaded(false);
      return;
    }

    const renderPreview = async () => {
      setPreviewLoading(true);
      try {
        const [pdfjs, downloadUrl] = await Promise.all([
          getPdfJsLibrary(),
          getCachedSignedPdfUrl(targetSource),
        ]);

        if (isCancelled || !pdfjs || !downloadUrl || !canvasRef.current) return;

        const loadingTask = pdfjs.getDocument({
          url: downloadUrl,
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
          cMapPacked: true,
        });

        const pdf = await loadingTask.promise;
        if (isCancelled) return;

        const page = await pdf.getPage(1);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;

        // Scale to fit card preview thumbnail (~260px wide) with high resolution
        const unscaledViewport = page.getViewport({ scale: 1 });
        const scale = 260 / unscaledViewport.width;
        const viewport = page.getViewport({ scale });
        const outputScale = window.devicePixelRatio || 1;

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);

        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

        await page.render({ canvasContext: context, transform, viewport }).promise;

        if (!isCancelled) {
          setPreviewLoaded(true);
        }
      } catch (err) {
        // Fallback gracefully to icon placeholder without breaking UI
        if (!isCancelled) {
          setPreviewLoaded(false);
        }
      } finally {
        if (!isCancelled) {
          setPreviewLoading(false);
        }
      }
    };

    renderPreview();
    return () => {
      isCancelled = true;
    };
  }, [material.id, material.storagePath, material.fileUrl]);

  // Calculate time ago
  const createdDate = material.createdAt ? new Date(material.createdAt) : new Date();
  const diffDays = Math.floor(Math.abs(Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  const timeAgo = diffDays === 0 ? 'Today' : diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;

  const isPYQ = material.type?.toLowerCase().includes('pyq') || material.type?.toLowerCase().includes('question');
  const targetUrl = `/notes/${material.slug || material.id}`;

  return (
    <Link to={targetUrl} className="document-card" onClick={handleClick}>
      <div className="doc-preview-container">
        {/* Floating circular bookmark button positioned top right of preview */}
        <button
          type="button"
          className={`floating-bookmark-btn ${isSaved ? 'saved' : ''}`}
          onClick={handleBookmark}
          title={isSaved ? 'Remove from Saved' : 'Save PDF'}
          aria-label={isSaved ? 'Remove from Saved' : 'Save PDF'}
        >
          <i className={`${isSaved ? 'fas' : 'far'} fa-bookmark`}></i>
        </button>

        <canvas
          ref={canvasRef}
          className="pdf-preview-canvas"
          style={{
            display: previewLoaded ? 'block' : 'none',
            opacity: previewLoaded ? 1 : 0,
            transition: 'opacity 0.25s ease-in',
          }}
        />

        {!previewLoaded && (
          <div className="preview-loader preview-fallback">
            <div className="preview-doc-icon">
              <i className={isPYQ ? 'fas fa-file-circle-question' : 'fas fa-file-pdf'}></i>
            </div>
            <span className="preview-unavailable-text">
              {previewLoading ? 'Loading preview...' : (isPYQ ? 'PYQ Document' : 'PDF Document')}
            </span>
          </div>
        )}
      </div>

      <div className="doc-info">
        <h3 className="doc-title" title={material.title}>
          {material.title}
        </h3>
        <span className="doc-subtitle">
          {material.subject} • {material.type || 'Study Material'} • {timeAgo}
        </span>
      </div>
    </Link>
  );
};
