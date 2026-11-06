import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '40px 20px',
      }}
    >
      <i
        className="fas fa-compass"
        style={{ fontSize: '4rem', color: 'var(--blue-accent)', marginBottom: '20px' }}
      ></i>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '12px' }}>404 — Page Not Found</h1>
      <p style={{ color: 'var(--text-light)', fontSize: '1.1rem', maxWidth: '500px', marginBottom: '30px' }}>
        We couldn't find the page or resource you were looking for. It might have been moved or removed.
      </p>
      <div style={{ display: 'flex', gap: '16px' }}>
        <Link to="/" className="btn btn-purple">
          Back to Home
        </Link>
        <Link to="/search" className="btn btn-outline">
          Search Materials
        </Link>
      </div>
    </div>
  );
};
