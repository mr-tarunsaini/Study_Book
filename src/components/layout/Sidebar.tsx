import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { UploadNotesModal } from '../resources/UploadNotesModal';

interface SidebarProps {
  expanded: boolean;
  onToggleExpand: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  expanded,
  onToggleExpand,
  mobileOpen,
  onCloseMobile,
}) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const currentQ = (searchParams.get('q') || '').toLowerCase();
  const isNotesActive = location.pathname === '/search' && currentQ === 'notes';
  const isPyqsActive = location.pathname === '/search' && currentQ === 'pyqs';

  const handleUploadClick = () => {
    onCloseMobile();
    setIsUploadOpen(true);
  };

  return (
    <>
      <div
        className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`}
        id="overlay"
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside className={`sidebar ${expanded ? 'expanded' : ''} ${mobileOpen ? 'mobile-open' : ''}`} id="sidebar">
        <div className="sidebar-header">
          <button
            className="menu-btn"
            id="sidebar-toggle-btn"
            onClick={onToggleExpand}
            title={expanded ? 'Collapse Sidebar' : 'Expand Sidebar'}
            aria-label="Toggle navigation sidebar"
          >
            <i className="fas fa-book-open sidebar-toggle-icon-default"></i>
            <i className="fas fa-bars sidebar-toggle-icon-hover"></i>
          </button>

          <div className="logo">
            <div className="logo-icon"><i className="fas fa-book-open"></i></div>
            <span>Study Book</span>
          </div>

          <button
            className="close-btn"
            id="close-btn"
            onClick={onCloseMobile}
            aria-label="Close sidebar"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <nav className="sidebar-menu">
          <NavLink
            to={user ? '/account' : '/login'}
            className={({ isActive }) => `sidebar-link profile-link ${isActive ? 'active' : ''}`}
            onClick={onCloseMobile}
          >
            {user ? (
              <div className="user-avatar">{user.name ? user.name.trim().charAt(0).toUpperCase() : 'U'}</div>
            ) : (
              <i className="fas fa-user-circle"></i>
            )}
            <span>{user ? user.name : 'Profile'}</span>
          </NavLink>

          <div className="menu-divider expanded-only"></div>

          <button
            type="button"
            className="sidebar-link upload-notes-sidebar-btn"
            onClick={handleUploadClick}
            style={{
              background: 'none',
              border: 'none',
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer',
              font: 'inherit',
              padding: '12px 28px',
            }}
          >
            <i className="fas fa-plus"></i>
            <span>Upload Notes</span>
          </button>

          <div className="menu-divider expanded-only"></div>

          <NavLink
            to="/"
            end
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onCloseMobile}
          >
            <i className="fas fa-home"></i>
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/search?q=Notes"
            className={() => `sidebar-link ${isNotesActive ? 'active' : ''}`}
            onClick={onCloseMobile}
          >
            <i className="fas fa-file-alt"></i>
            <span>Notes</span>
          </NavLink>

          <NavLink
            to="/search?q=PYQs"
            className={() => `sidebar-link ${isPyqsActive ? 'active' : ''}`}
            onClick={onCloseMobile}
          >
            <i className="fas fa-file-circle-question"></i>
            <span>PYQs</span>
          </NavLink>

          <NavLink
            to="/calculator"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onCloseMobile}
          >
            <i className="fas fa-calculator"></i>
            <span>Calculator</span>
          </NavLink>

          <NavLink
            to="/about"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onCloseMobile}
          >
            <i className="fas fa-info-circle"></i>
            <span>About Us</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button className="theme-toggle-btn" id="theme-toggle" onClick={toggleTheme} aria-label="Switch theme">
            <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </aside>

      <UploadNotesModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </>
  );
};
