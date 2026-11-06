import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UploadNotesModal } from '../components/resources/UploadNotesModal';

export const AboutPage: React.FC = () => {
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  return (
    <div style={{ paddingTop: '20px', paddingBottom: '60px' }}>
      <div className="internal-hero">
        <h1>About Study Book</h1>
        <p>Empowering engineering students with the best study resources.</p>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="card" style={{ cursor: 'default', textAlign: 'left' }}>
          <h2 style={{ marginBottom: '12px', fontSize: '1.4rem', color: 'var(--blue-accent)' }}>
            Our Mission
          </h2>
          <p style={{ color: 'var(--text-light)', lineHeight: 1.8 }}>
            Study Book is a community-driven platform designed exclusively for engineering students.
            Our primary mission is to provide free, high-quality, and easily accessible notes,
            previous year questions (PYQs), and comprehensive syllabus guides to help you achieve
            your academic goals.
          </p>
        </div>

        <div className="card" style={{ cursor: 'default', textAlign: 'left' }}>
          <h2 style={{ marginBottom: '12px', fontSize: '1.4rem', color: 'var(--blue-accent)' }}>
            Why We Built This
          </h2>
          <p style={{ color: 'var(--text-light)', lineHeight: 1.8 }}>
            We understand the struggle of scrambling for notes right before exams. By centralizing
            study materials that are often scattered across various drives, chats, and websites, we
            aim to save students valuable time. Knowledge grows when shared, and Study Book is built on
            the foundation of students helping students.
          </p>
        </div>

        <div className="card" style={{ cursor: 'default', textAlign: 'left' }}>
          <h2 style={{ marginBottom: '12px', fontSize: '1.4rem', color: 'var(--blue-accent)' }}>
            Join the Community
          </h2>
          <p style={{ color: 'var(--text-light)', lineHeight: 1.8, marginBottom: '20px' }}>
            We encourage everyone to not just consume, but also contribute. Have great handwritten
            notes? Upload them and help thousands of your peers succeed.
          </p>
          <button
            type="button"
            className="btn btn-purple"
            onClick={() => setIsUploadOpen(true)}
            style={{ cursor: 'pointer' }}
          >
            <i className="fas fa-upload"></i> Share Your Notes
          </button>
        </div>
      </div>

      <UploadNotesModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  );
};
