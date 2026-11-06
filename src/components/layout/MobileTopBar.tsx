import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface MobileTopBarProps {
  onOpenMobile: () => void;
}

export const MobileTopBar: React.FC<MobileTopBarProps> = ({ onOpenMobile }) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <div className="mobile-top-bar">
      <button
        className="menu-btn"
        id="mobile-menu-btn"
        onClick={onOpenMobile}
        aria-label="Open navigation menu"
      >
        <i className="fas fa-bars"></i>
      </button>

      <div className="logo">
        <div className="logo-icon"><i className="fas fa-book-open"></i></div>
        <span>Study Book</span>
      </div>

      <div className="mobile-top-actions">
        <button
          className="theme-toggle-nav"
          id="theme-toggle-mobile"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
        </button>

        <Link
          to={user ? '/account' : '/login'}
          className="mobile-profile-link"
          aria-label={user ? 'User Account' : 'Sign in'}
        >
          {user ? (
            <div className="user-avatar nav-avatar">
              {user.name ? user.name.trim().charAt(0).toUpperCase() : 'U'}
            </div>
          ) : (
            <i className="fas fa-user-circle mobile-profile-icon"></i>
          )}
        </Link>
      </div>
    </div>
  );
};
