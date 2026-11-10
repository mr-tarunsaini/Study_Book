import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StudyMaterial } from '../types';
import { resourceService } from '../services/resourceService';
import { bookmarkService } from '../services/bookmarkService';
import { DocumentGrid } from '../components/resources/DocumentGrid';
import { UploadNotesModal } from '../components/resources/UploadNotesModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [liveResults, setLiveResults] = useState<StudyMaterial[]>([]);
  const [isLiveOpen, setIsLiveOpen] = useState<boolean>(false);
  const searchWrapperRef = useRef<HTMLDivElement | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [continueReading, setContinueReading] = useState<StudyMaterial[]>([]);
  const [recentlyUploaded, setRecentlyUploaded] = useState<StudyMaterial[]>([]);
  const [notes, setNotes] = useState<StudyMaterial[]>([]);
  const [pyqs, setPyqs] = useState<StudyMaterial[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Continue Reading from local service
      const crList = bookmarkService.getContinueReading().slice(0, 8);
      setContinueReading(crList);

      // Fetch recent materials
      const allRecent = await resourceService.getPersonalizedMaterials(user, 20);

      setRecentlyUploaded(allRecent.slice(0, 8));
      setNotes(allRecent.filter((m) => !m.type || !m.type.toLowerCase().includes('pyq')).slice(0, 8));
      setPyqs(allRecent.filter((m) => m.type && m.type.toLowerCase().includes('pyq')).slice(0, 8));
    } catch (err) {
      console.error('Failed to load homepage resources:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load materials from backend & local history
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle live search suggestions as user types
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setLiveResults([]);
      setIsLiveOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await resourceService.searchMaterials(q);
        setLiveResults(results.slice(0, 5));
        setIsLiveOpen(results.length > 0);
      } catch {
        setLiveResults([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close live dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        setIsLiveOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleUploadNotesClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      showToast('Please log in before uploading study materials.', 'warning');
      navigate('/login');
      return;
    }
    if (!user.college || !user.course || !user.branch) {
      e.preventDefault();
      showToast('Please complete your profile in the Account page before uploading.', 'warning');
      navigate('/account');
      return;
    }
  };

  return (
    <div className="home-page-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Hello, What Do You Want To Study?</h1>

          <div className="home-search-wrapper" ref={searchWrapperRef}>
            <form onSubmit={handleSearchSubmit} className="search-bar" id="home-search-bar">
              <i className="fas fa-search search-icon-left"></i>
              <input
                type="text"
                name="q"
                id="home-search-input"
                placeholder="Search for courses, notes, pyqs..."
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (liveResults.length > 0) setIsLiveOpen(true);
                }}
              />
              <button type="submit" style={{ display: 'none' }}>
                Search
              </button>
            </form>

            {/* Live Results Dropdown */}
            {isLiveOpen && (
              <div id="live-search-results" className="live-search-dropdown">
                {liveResults.map((item) => (
                  <div
                    key={item.id}
                    className="live-search-item"
                    onClick={() => {
                      setIsLiveOpen(false);
                      navigate(`/notes/${item.slug || item.id}`, { state: { material: item } });
                    }}
                  >
                    <div className="live-search-icon">
                      <i className={item.type?.toLowerCase().includes('pyq') ? 'fas fa-file-circle-question' : 'fas fa-file-pdf'}></i>
                    </div>
                    <div className="live-search-info">
                      <div className="live-search-title">{item.title}</div>
                      <div className="live-search-subtitle">{item.subject} • {item.course || 'B.Tech'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="hero-quick-links">
            <Link to="/search?q=Notes" className="quick-link-pill">
              Notes
            </Link>
            <Link to="/search?q=PYQs" className="quick-link-pill">
              PYQs
            </Link>
            <Link to="/search?q=Syllabus" className="quick-link-pill hide-on-mobile">
              Syllabus
            </Link>
            <Link to="/calculator" className="quick-link-pill hide-on-mobile">
              SGPA Calculator
            </Link>
          </div>
        </div>
      </section>

      {/* Continue Reading Section (Only shown if history exists) */}
      {continueReading.length > 0 && (
        <section className="content-section" id="continue-reading">
          <div className="section-header-flex">
            <div className="section-header-text">
              <h2 className="section-title">Continue Reading</h2>
              <p className="section-description desktop-only">Pick up where you left off.</p>
            </div>
          </div>
          <DocumentGrid materials={continueReading} />
        </section>
      )}

      {/* Recently Uploaded Section */}
      <section className="content-section" id="recently-uploaded">
        <div className="section-header-flex">
          <div className="section-header-text">
            <h2 className="section-title">Recently Uploaded</h2>
            <p className="section-description desktop-only">
              Check out the newest study materials shared by the community.
            </p>
          </div>
          <Link to="/search" className="view-all-btn">
            View All <i className="fas fa-arrow-right"></i>
          </Link>
        </div>
        <DocumentGrid
          materials={recentlyUploaded}
          loading={loading}
          emptyMessage="No study materials have been uploaded yet. Be the first to share!"
        />
      </section>

      {/* Explore Notes Section */}
      <section className="content-section" id="notes">
        <div className="section-header-flex">
          <div className="section-header-text">
            <h2 className="section-title">Explore Notes</h2>
            <p className="section-description desktop-only">
              Discover the latest notes and resources shared by your peers.
            </p>
          </div>
          <Link to="/search?q=Notes" className="view-all-btn">
            View All <i className="fas fa-arrow-right"></i>
          </Link>
        </div>
        <DocumentGrid
          materials={notes}
          loading={loading}
          emptyMessage="No notes found in this category yet."
        />
      </section>

      {/* Practice PYQs Section */}
      <section className="content-section" id="pyqs">
        <div className="section-header-flex">
          <div className="section-header-text">
            <h2 className="section-title" id="get-started">
              Practice PYQs
            </h2>
            <p className="section-description desktop-only">
              Practice with previous year question papers to understand exam patterns.
            </p>
          </div>
          <Link to="/search?q=PYQs" className="view-all-btn">
            View All <i className="fas fa-arrow-right"></i>
          </Link>
        </div>
        <DocumentGrid
          materials={pyqs}
          loading={loading}
          emptyMessage="No question papers uploaded yet."
        />
      </section>

      {/* Why Study Book Feature Section */}
      <section className="content-section">
        <h2 className="section-title centered">Why Study Book</h2>
        <p className="section-description centered">
          Discover what makes our platform the preferred choice for engineering students.
        </p>
        <div className="features-grid">
          <div className="card feature-card">
            <div className="icon-box blue-icon">
              <i className="fas fa-tools"></i>
            </div>
            <h3>All-in-One Toolkit</h3>
            <p>From an SGPA/CGPA calculator to a powerful PDF viewer, get all the tools you need.</p>
          </div>
          <div className="card feature-card">
            <div className="icon-box blue-icon">
              <i className="fas fa-users"></i>
            </div>
            <h3>Community Powered</h3>
            <p>Access a growing library of notes and PYQs shared by students just like you.</p>
          </div>
          <div className="card feature-card">
            <div className="icon-box blue-icon">
              <i className="fas fa-bookmark"></i>
            </div>
            <h3>Smart & Personalized</h3>
            <p>Save your favorite materials and pick up right where you left off with Continue Reading.</p>
          </div>
        </div>
      </section>

      {/* Share Your Notes CTA */}
      <section className="content-section" style={{ textAlign: 'center' }}>
        <h2 className="section-title">Share Your Notes</h2>
        <p className="section-description" style={{ marginBottom: '24px' }}>
          Help your juniors and peers by sharing your notes and study materials.
        </p>
        <button
          type="button"
          className="btn btn-purple"
          onClick={(e) => {
            if (!user) {
              e.preventDefault();
              showToast('Please log in before uploading study materials.', 'warning');
              navigate('/login');
              return;
            }
            if (!user.college || !user.course || !user.branch) {
              e.preventDefault();
              showToast('Please complete your profile in the Account page before uploading.', 'warning');
              navigate('/account');
              return;
            }
            setIsUploadOpen(true);
          }}
          style={{ padding: '12px 28px', fontSize: '1rem', cursor: 'pointer' }}
        >
          <i className="fas fa-upload"></i> Upload Notes
        </button>
      </section>

      {/* Upload Notes In-App Dialog Box */}
      <UploadNotesModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => loadData()}
      />

      {/* Tagline Footer Branding */}
      <div style={{ marginTop: '50px', textAlign: 'center' }}>
        <h3
          className="tag-line"
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            background: 'linear-gradient(to right, var(--blue-accent), #60a5fa)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Study Book — Study Smarter. Score Better.
        </h3>
      </div>
    </div>
  );
};
