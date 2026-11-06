import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { profileService } from '../services/profileService';
import { resourceService } from '../services/resourceService';
import { storageService } from '../services/storageService';
import { bookmarkService } from '../services/bookmarkService';
import { StudyMaterial } from '../types';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { UploadNotesModal } from '../components/resources/UploadNotesModal';

export const AccountPage: React.FC = () => {
  const { user, loading, logout, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'uploads' | 'saved'>('uploads');
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);

  // Profile Edit State
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [college, setCollege] = useState<string>('');
  const [course, setCourse] = useState<string>('');
  const [branch, setBranch] = useState<string>('');
  const [savingProfile, setSavingProfile] = useState<boolean>(false);

  // Uploads and Saved state
  const [myUploads, setMyUploads] = useState<StudyMaterial[]>([]);
  const [savedPdfs, setSavedPdfs] = useState<StudyMaterial[]>([]);
  const [loadingUploads, setLoadingUploads] = useState<boolean>(true);
  const [loadingSaved, setLoadingSaved] = useState<boolean>(true);

  // Edit Material Modal State
  const [editingMat, setEditingMat] = useState<StudyMaterial | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editSubject, setEditSubject] = useState<string>('');
  const [editCourse, setEditCourse] = useState<string>('B.Tech');
  const [editBranch, setEditBranch] = useState<string>('');
  const [editType, setEditType] = useState<string>('Class Notes');
  const [editDesc, setEditDesc] = useState<string>('');
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editSaving, setEditSaving] = useState<boolean>(false);
  const [editProgress, setEditProgress] = useState<number>(0);
  const [editProgressText, setEditProgressText] = useState<string>('');

  // Modals
  const [deleteTarget, setDeleteTarget] = useState<StudyMaterial | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setCollege(user.college || '');
      setCourse(user.course || '');
      setBranch(user.branch || '');

      // Load user uploads
      setLoadingUploads(true);
      resourceService
        .getUserMaterials(user.uid)
        .then((mats) => setMyUploads(mats))
        .finally(() => setLoadingUploads(false));

      // Load saved PDFs
      setLoadingSaved(true);
      bookmarkService
        .getSavedMaterials(user.uid)
        .then((saved) => setSavedPdfs(saved))
        .finally(() => setLoadingSaved(false));
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);

    try {
      await profileService.saveProfile(user.uid, {
        name,
        college,
        course,
        branch,
      });
      await refreshProfile();
      setIsEditing(false);
      showToast('Profile updated successfully!', 'success');
    } catch (err: any) {
      showToast(`Failed to update profile: ${err.message}`, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        showToast('Please select a valid PDF file (.pdf)', 'error');
        e.target.value = '';
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        showToast('Selected file exceeds the 15 MB limit.', 'error');
        e.target.value = '';
        return;
      }
      setEditFile(file);
    }
  };

  const handleEditMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMat) return;

    if (!editTitle.trim() || !editSubject.trim()) {
      showToast('Please enter both title and subject.', 'error');
      return;
    }

    setEditSaving(true);
    setEditProgress(15);
    setEditProgressText('Saving changes...');

    try {
      let newStoragePath = editingMat.storagePath;
      let newFileName = editingMat.fileName;
      let newFileSize = editingMat.fileSize;

      // If a replacement PDF file was chosen, upload it directly to Supabase Storage
      if (editFile) {
        setEditProgress(30);
        setEditProgressText('Uploading replacement PDF...');

        const uploadRes = await storageService.uploadPdf(editFile, (pct, status) => {
          setEditProgress(pct);
          setEditProgressText(status);
        });

        // Delete old PDF from Supabase Storage if different
        const oldPath = editingMat.storagePath || editingMat.fileUrl;
        if (oldPath && oldPath !== uploadRes.storagePath && !oldPath.startsWith('http')) {
          try {
            await storageService.deleteFile(oldPath);
          } catch (delOldErr) {
            console.warn('Could not remove previous PDF from storage:', delOldErr);
          }
        }

        newStoragePath = uploadRes.storagePath;
        newFileName = editFile.name;
        newFileSize = editFile.size;
      }

      setEditProgress(85);
      setEditProgressText('Updating document metadata...');

      const updatedFields: Partial<StudyMaterial> = {
        title: editTitle.trim(),
        subject: editSubject.trim(),
        course: editCourse.trim() || editingMat.course || 'B.Tech',
        branch: editBranch.trim() || editingMat.branch || '',
        type: editType,
        resourceType: editType,
        description: editDesc.trim(),
        updatedAt: new Date().toISOString(),
      };

      if (editFile) {
        updatedFields.fileName = newFileName;
        updatedFields.fileSize = newFileSize;
        updatedFields.storagePath = newStoragePath;
        updatedFields.fileUrl = newStoragePath;
        updatedFields.storageProvider = 'supabase';
      }

      await resourceService.updateMaterial(editingMat.id, updatedFields);

      setMyUploads((prev) =>
        prev.map((m) =>
          m.id === editingMat.id
            ? { ...m, ...updatedFields }
            : m
        )
      );

      setEditingMat(null);
      setEditFile(null);
      showToast(
        editFile
          ? 'Replacement PDF and document details updated successfully!'
          : 'Study material updated successfully!',
        'success'
      );
    } catch (err: any) {
      console.error('Failed to update material:', err);
      showToast(`Failed to update material: ${err.message}`, 'error');
    } finally {
      setEditSaving(false);
      setEditProgress(0);
      setEditProgressText('');
    }
  };

  const handleDeleteMaterial = async () => {
    if (!deleteTarget) return;

    try {
      await resourceService.deleteMaterial(
        deleteTarget.id,
        deleteTarget.storagePath || deleteTarget.fileUrl
      );
      setMyUploads((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      setDeleteTarget(null);
      showToast('Material deleted successfully.', 'success');
    } catch (err: any) {
      showToast(`Failed to delete material: ${err.message}`, 'error');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    showToast('Logged out successfully.', 'info');
  };

  if (loading || !user) {
    return (
      <div className="page-loader">
        <div className="spinner"></div>
        <p>Loading your account...</p>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: '30px', paddingBottom: '60px' }}>
      <div className="account-header-bar">
        <div>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '4px' }}>My Account</h1>
          <p style={{ color: 'var(--text-light)', fontSize: '1rem' }}>
            Manage your profile and study materials.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-blue"
          onClick={() => setIsUploadOpen(true)}
          style={{ padding: '12px 24px', cursor: 'pointer' }}
        >
          <i className="fas fa-upload"></i> Upload Notes
        </button>
      </div>

      {/* Profile Card */}
      <div className="profile-card">
        <div className="profile-top">
          <div className="profile-info-left">
            <div className="avatar-large">{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{user.name}</h2>
              <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginTop: '2px' }}>
                {user.email}
              </p>
            </div>
          </div>

          {!isEditing && (
            <button
              type="button"
              className="btn btn-outline"
              style={{ borderRadius: '8px' }}
              onClick={() => setIsEditing(true)}
            >
              <i className="fas fa-edit"></i> Edit Profile
            </button>
          )}
        </div>

        <form onSubmit={handleSaveProfile}>
          <div className="profile-grid">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                disabled={!isEditing}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" disabled value={user.email} />
            </div>

            <div className="form-group">
              <label className="form-label">College / University Name</label>
              <input
                type="text"
                list="college-options"
                className="form-input"
                disabled={!isEditing}
                placeholder="e.g. AKTU, GLA University"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
              />
              <datalist id="college-options">
                <option value="GLA University" />
                <option value="Gl Bajaj Group Of Institutions" />
                <option value="Sanskriti University" />
                <option value="BSA College Of Engineering & Technology" />
                <option value="AKTU" />
              </datalist>
            </div>

            <div className="form-group">
              <label className="form-label">Course</label>
              <input
                type="text"
                list="course-options"
                className="form-input"
                disabled={!isEditing}
                placeholder="e.g. B.Tech, BCA"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
              />
              <datalist id="course-options">
                <option value="B.Tech" />
                <option value="BCA" />
                <option value="B.Sc" />
                <option value="MBA" />
                <option value="MCA" />
              </datalist>
            </div>

            <div className="form-group">
              <label className="form-label">Branch</label>
              <input
                type="text"
                list="branch-options"
                className="form-input"
                disabled={!isEditing}
                placeholder="e.g. Computer Science (CSE)"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
              />
              <datalist id="branch-options">
                <option value="Computer Science Engineering (CSE)" />
                <option value="Artificial Intelligence & Data Science (AI&DS)" />
                <option value="Information Technology (IT)" />
                <option value="Electronics and Communication (ECE)" />
                <option value="Mechanical Engineering (ME)" />
                <option value="Civil Engineering (CE)" />
              </datalist>
            </div>
          </div>

          {isEditing ? (
            <div className="profile-actions">
              <button
                type="button"
                className="btn btn-outline"
                style={{ borderRadius: '8px' }}
                onClick={() => {
                  setName(user.name || '');
                  setCollege(user.college || '');
                  setCourse(user.course || '');
                  setBranch(user.branch || '');
                  setIsEditing(false);
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-blue"
                style={{ borderRadius: '8px' }}
                disabled={savingProfile}
              >
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          ) : (
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-danger"
                style={{ borderRadius: '8px' }}
                onClick={() => setShowLogoutConfirm(true)}
              >
                <i className="fas fa-sign-out-alt"></i> Logout
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'uploads' ? 'active' : ''}`}
          onClick={() => setActiveTab('uploads')}
        >
          My Uploads ({myUploads.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          Saved PDFs ({savedPdfs.length})
        </button>
      </div>

      {/* Uploads Tab */}
      {activeTab === 'uploads' && (
        <div>
          {loadingUploads ? (
            <div className="page-loader" style={{ minHeight: '150px' }}>
              <div className="spinner"></div>
            </div>
          ) : myUploads.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-folder-open"></i>
              <h3>No Uploads Yet</h3>
              <p>You haven't shared any study materials with the community yet.</p>
              <button
                type="button"
                className="btn btn-blue"
                onClick={() => setIsUploadOpen(true)}
                style={{ borderRadius: '8px', cursor: 'pointer' }}
              >
                Upload Notes
              </button>
            </div>
          ) : (
            <div className="uploads-grid">
              {myUploads.map((mat) => (
                <div key={mat.id} className="upload-card">
                  <div className="upload-card-header">
                    <div className="upload-icon">
                      <i className={mat.type?.toLowerCase().includes('pyq') ? 'fas fa-file-circle-question' : 'fas fa-file-pdf'}></i>
                    </div>
                    <div>
                      <h3 className="upload-title">{mat.title}</h3>
                      <div className="upload-meta">
                        <span className="tag">{mat.type || 'Notes'}</span>
                        <span>• {mat.createdAt ? new Date(mat.createdAt).toLocaleDateString() : 'Recent'}</span>
                      </div>
                    </div>
                  </div>
                  <p className="upload-desc">{mat.description || 'No description provided.'}</p>
                  <div className="upload-actions">
                    <Link
                      to={`/notes/${mat.slug || mat.id}`}
                      className="btn btn-outline"
                      style={{ flex: 1, padding: '8px', fontSize: '0.9rem', borderRadius: '6px' }}
                    >
                      <i className="fas fa-eye"></i> View
                    </Link>
                    <button
                      className="btn btn-outline"
                      style={{ padding: '8px 12px', fontSize: '0.9rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      title="Edit Material & PDF"
                      onClick={() => {
                        setEditingMat(mat);
                        setEditTitle(mat.title || '');
                        setEditSubject(mat.subject || '');
                        setEditCourse(mat.course || 'B.Tech');
                        setEditBranch(mat.branch || '');
                        setEditType(mat.type || mat.resourceType || 'Class Notes');
                        setEditDesc(mat.description || '');
                        setEditFile(null);
                      }}
                    >
                      <i className="fas fa-edit"></i> Edit
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '8px 12px', fontSize: '0.9rem', borderRadius: '6px' }}
                      title="Delete Material"
                      onClick={() => setDeleteTarget(mat)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Saved PDFs Tab */}
      {activeTab === 'saved' && (
        <div>
          {loadingSaved ? (
            <div className="page-loader" style={{ minHeight: '150px' }}>
              <div className="spinner"></div>
            </div>
          ) : savedPdfs.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-bookmark" style={{ color: 'var(--blue-accent)' }}></i>
              <h3>No Saved PDFs Yet</h3>
              <p>PDFs you bookmark will appear here for easy access.</p>
              <Link to="/search" className="btn btn-outline" style={{ borderRadius: '8px' }}>
                Explore Notes
              </Link>
            </div>
          ) : (
            <div className="uploads-grid">
              {savedPdfs.map((mat) => (
                <div key={mat.id} className="upload-card">
                  <div className="upload-card-header">
                    <div className="upload-icon">
                      <i className={mat.type?.toLowerCase().includes('pyq') ? 'fas fa-file-circle-question' : 'fas fa-file-pdf'}></i>
                    </div>
                    <div>
                      <h3 className="upload-title">{mat.title}</h3>
                      <div className="upload-meta">
                        <span className="tag">{mat.type || 'Notes'}</span>
                        <span>• {mat.subject}</span>
                      </div>
                    </div>
                  </div>
                  <p className="upload-desc">{mat.description || 'No description provided.'}</p>
                  <div className="upload-actions">
                    <Link
                      to={`/notes/${mat.slug || mat.id}`}
                      className="btn btn-outline full-width"
                      style={{ padding: '8px', fontSize: '0.9rem', borderRadius: '6px' }}
                    >
                      <i className="fas fa-eye"></i> View PDF
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Material Modal */}
      {editingMat && (
        <div className="modal-overlay active">
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2>Edit Study Material</h2>
              <button
                className="close-modal-btn"
                onClick={() => {
                  if (!editSaving) {
                    setEditingMat(null);
                    setEditFile(null);
                  }
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleEditMaterialSubmit}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  disabled={editSaving}
                  required
                />
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Course *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editCourse}
                    onChange={(e) => setEditCourse(e.target.value)}
                    disabled={editSaving}
                    placeholder="e.g. B.Tech"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Branch *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editBranch}
                    onChange={(e) => setEditBranch(e.target.value)}
                    disabled={editSaving}
                    placeholder="e.g. CSE, IT, ME"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Subject / Course Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  disabled={editSaving}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Resource Type *</label>
                <select
                  className="form-input"
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  disabled={editSaving}
                  required
                >
                  <option value="Class Notes">Class Notes</option>
                  <option value="Exam Preparation Notes">Exam Preparation Notes</option>
                  <option value="Previous Year Questions (PYQs)">Previous Year Questions (PYQs)</option>
                  <option value="Tutorial Sheets / Assignments">Tutorial Sheets / Assignments</option>
                  <option value="Important Questions">Important Questions</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  disabled={editSaving}
                  style={{ minHeight: '70px' }}
                />
              </div>

              {/* PDF File Replacement Section */}
              <div className="form-group" style={{ background: 'var(--hover-bg)', padding: '14px', borderRadius: '10px', border: '1px dashed var(--border-color)' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span><i className="fas fa-file-pdf" style={{ color: '#ef4444', marginRight: '6px' }}></i> Replace PDF File (Optional)</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>Max 10 MB</span>
                </label>
                
                <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '8px' }}>
                  Current file: <strong>{editingMat.fileName || 'Original PDF'}</strong>
                </div>

                {!editFile ? (
                  <div>
                    <label
                      htmlFor="edit-pdf-file-input"
                      className="btn btn-outline"
                      style={{ cursor: editSaving ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', fontSize: '0.85rem' }}
                    >
                      <i className="fas fa-cloud-upload-alt"></i> Choose New PDF
                    </label>
                    <input
                      id="edit-pdf-file-input"
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleEditFileChange}
                      disabled={editSaving}
                      style={{ display: 'none' }}
                    />
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--card-bg)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <i className="fas fa-check-circle" style={{ color: '#10b981' }}></i>
                      <span style={{ fontSize: '0.88rem', fontWeight: 500, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {editFile.name} ({(editFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn-text"
                      style={{ color: '#ef4444', fontSize: '0.82rem', padding: '4px 8px', cursor: 'pointer', border: 'none', background: 'none' }}
                      onClick={() => setEditFile(null)}
                      disabled={editSaving}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Progress Bar when uploading replacement file */}
              {editSaving && (
                <div style={{ marginTop: '12px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px', color: 'var(--text-light)' }}>
                    <span>{editProgressText || 'Saving changes...'}</span>
                    <span>{editProgress}%</span>
                  </div>
                  <div style={{ height: '6px', width: '100%', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${editProgress}%`, background: 'var(--blue-accent)', transition: 'width 0.2s ease' }} />
                  </div>
                </div>
              )}

              <div className="modal-actions" style={{ marginTop: '18px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setEditingMat(null);
                    setEditFile(null);
                  }}
                  disabled={editSaving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-purple" disabled={editSaving}>
                  {editSaving ? (
                    <>
                      <i className="fas fa-spinner fa-spin" style={{ marginRight: '6px' }}></i> Saving...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save" style={{ marginRight: '6px' }}></i> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Material"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        isDanger={true}
        onConfirm={handleDeleteMaterial}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Log Out"
        message="Are you sure you want to log out of your account?"
        isDanger={false}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
      {/* In-App Upload Notes Modal */}
      <UploadNotesModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          if (user) {
            setLoadingUploads(true);
            resourceService
              .getUserMaterials(user.uid)
              .then((mats) => setMyUploads(mats))
              .finally(() => setLoadingUploads(false));
          }
        }}
      />
    </div>
  );
};
