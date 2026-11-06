import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { storageService } from '../../services/storageService';
import { resourceService } from '../../services/resourceService';
import { Link } from 'react-router-dom';

interface UploadNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: (docId: string) => void;
}

export const UploadNotesModal: React.FC<UploadNotesModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [resourceType, setResourceType] = useState<string>('Class Notes');
  const [description, setDescription] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgressText, setUploadProgressText] = useState<string>('');
  const [uploadProgressPercent, setUploadProgressPercent] = useState<number>(0);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !uploading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, uploading, onClose]);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      validateAndSetFile(droppedFiles[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    // Validate file type
    const isPdf =
      selectedFile.type === 'application/pdf' ||
      selectedFile.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      showToast('Please select a valid PDF file (.pdf)', 'error');
      return;
    }

    // Validate size (max 15MB)
    const maxSize = 15 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      showToast('File size exceeds the 15MB limit. Please compress or choose a smaller file.', 'error');
      return;
    }

    setFile(selectedFile);

    // Auto-fill title from file name if title is empty
    if (!title) {
      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    }
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (uploading) return; // Prevent duplicate submissions

    if (!user) {
      showToast('Please log in before uploading study materials.', 'warning');
      return;
    }

    if (!file) {
      showToast('Please select a PDF document to upload.', 'warning');
      return;
    }

    if (!title.trim()) {
      showToast('Please provide a document title.', 'warning');
      return;
    }

    if (!subject.trim()) {
      showToast('Please provide the subject or topic name.', 'warning');
      return;
    }

    setUploading(true);
    setUploadProgressPercent(10);
    setUploadProgressText('Authorizing upload session...');

    try {
      // 1. Upload PDF directly to Supabase Storage via signed upload URL
      const uploadResult = await storageService.uploadPdf(file, (pct, status) => {
        setUploadProgressPercent(pct);
        setUploadProgressText(status);
      });

      setUploadProgressPercent(85);
      setUploadProgressText('Saving document details...');

      const now = new Date().toISOString();

      // 2. Save document record to Firestore with metadata & Supabase storage path
      const newDocId = await resourceService.saveMaterial({
        title: title.trim(),
        subject: subject.trim(),
        type: resourceType,
        resourceType: resourceType,
        course: user.course || 'B.Tech',
        branch: user.branch || '',
        college: user.college || (user as any).university || 'AKTU',
        description: description.trim(),
        fileName: file.name,
        fileSize: file.size,
        storagePath: uploadResult.storagePath,
        storageProvider: 'supabase',
        fileUrl: uploadResult.storagePath,
        uploaderUid: user.uid,
        uploadedBy: user.uid,
        uploaderName: user.name || 'Anonymous Contributor',
        createdAt: now,
        uploadedAt: now,
      });

      setUploadProgressPercent(100);
      setUploadProgressText('Uploaded successfully!');
      showToast('Study material uploaded and published successfully!', 'success');

      // Reset form state
      setFile(null);
      setTitle('');
      setSubject('');
      setDescription('');

      if (onUploadSuccess) {
        onUploadSuccess(newDocId);
      }
      onClose();
    } catch (err: any) {
      console.error('Upload failed:', err);
      showToast(err.message || 'Failed to upload document. Please try again.', 'error');
    } finally {
      setUploading(false);
      setUploadProgressPercent(0);
      setUploadProgressText('');
    }
  };

  return (
    <div className={`modal-overlay active`} onClick={(e) => {
      if (e.target === e.currentTarget && !uploading) onClose();
    }}>
      <div className="modal-card upload-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-cloud-upload-alt" style={{ color: 'var(--blue-accent)' }}></i>
              Upload Study Material
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-light)', marginTop: '4px' }}>
              Share your notes, question papers, or syllabus to help fellow students.
            </p>
          </div>
          <button
            type="button"
            className="close-modal-btn"
            onClick={onClose}
            disabled={uploading}
            aria-label="Close upload modal"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {!user ? (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--icon-bg-blue)',
                color: 'var(--blue-accent)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                marginBottom: '16px',
              }}
            >
              <i className="fas fa-user-lock"></i>
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>Sign in Required</h3>
            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '20px' }}>
              You need to be logged into Study Book to publish study materials.
            </p>
            <Link
              to="/login"
              className="btn btn-purple"
              onClick={onClose}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px' }}
            >
              <i className="fas fa-sign-in-alt"></i> Log In to Continue
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* File Dropzone */}
            <div className="form-group">
              <label className="form-label">PDF Document *</label>
              <div
                className={`file-drop-zone ${isDragging ? 'dragover' : ''} ${file ? 'has-file' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,application/pdf"
                  style={{ display: 'none' }}
                  onChange={handleFileInputChange}
                  disabled={uploading}
                />
                {!file ? (
                  <>
                    <i className="fas fa-file-pdf file-drop-icon"></i>
                    <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>
                      Click to choose PDF or drag & drop here
                    </p>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                      PDF files only, up to 15MB
                    </span>
                  </>
                ) : (
                  <div className="file-selected-box" onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <i className="fas fa-file-pdf" style={{ fontSize: '1.8rem', color: 'var(--blue-accent)' }}></i>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-dark)', wordBreak: 'break-all' }}>
                          {file.name}
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-text-danger"
                      onClick={() => setFile(null)}
                      disabled={uploading}
                      title="Remove file"
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px' }}
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Title */}
            <div className="form-group">
              <label className="form-label">Document Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Electrical Engineering Unit 1 Notes"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={uploading}
              />
            </div>

            {/* Subject and Resource Type Row */}
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Subject / Topic *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Basic Electrical Engineering"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  disabled={uploading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Resource Type *</label>
                <select
                  className="form-input"
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value)}
                  disabled={uploading}
                >
                  <option value="Class Notes">Class Notes</option>
                  <option value="Exam Preparation Notes">Exam Preparation Notes</option>
                  <option value="Previous Year Questions (PYQs)">Previous Year Questions (PYQs)</option>
                  <option value="Handwritten Notes">Handwritten Notes</option>
                  <option value="Tutorial Sheets / Assignments">Tutorial Sheets / Assignments</option>
                  <option value="Syllabus">Syllabus</option>
                  <option value="Book / Reference">Book / Reference</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Brief summary of units, topics covered, or author notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={uploading}
              ></textarea>
            </div>

            {/* Upload Progress Indicator */}
            {uploading && (
              <div className="upload-progress-container" style={{ margin: '16px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px', color: 'var(--text-light)' }}>
                  <span>{uploadProgressText}</span>
                  <span style={{ fontWeight: 600, color: 'var(--blue-accent)' }}>{uploadProgressPercent}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--border-color, #e2e8f0)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${uploadProgressPercent}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #6366f1, #0086ff)',
                      transition: 'width 0.3s ease',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={onClose}
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-purple"
                disabled={uploading || !file || !title.trim() || !subject.trim()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                {uploading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>{uploadProgressText || 'Uploading...'}</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-upload"></i>
                    <span>Upload & Publish</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
