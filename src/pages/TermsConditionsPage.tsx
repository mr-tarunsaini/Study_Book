import React from 'react';

export const TermsConditionsPage: React.FC = () => {
  return (
    <div style={{ paddingTop: '20px', paddingBottom: '60px' }}>
      <div className="internal-hero">
        <h1>Terms & Conditions</h1>
        <p>Rules and guidelines for using Study Book.</p>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <p style={{ color: 'var(--text-light)', textAlign: 'center', marginBottom: '8px' }}>
          Last Updated: March 2026
        </p>

        <div className="card" style={{ cursor: 'default', textAlign: 'left' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '1.25rem', color: 'var(--blue-accent)' }}>
            1. Acceptance of Terms
          </h3>
          <p style={{ color: 'var(--text-light)', lineHeight: 1.8 }}>
            By accessing or using the Study Book platform, you agree to be bound by these Terms and
            Conditions. If you do not agree with any part of these terms, please refrain from using
            our services.
          </p>
        </div>

        <div className="card" style={{ cursor: 'default', textAlign: 'left' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '1.25rem', color: 'var(--blue-accent)' }}>
            2. User Uploads & Content
          </h3>
          <p style={{ color: 'var(--text-light)', lineHeight: 1.8 }}>
            Study Book allows users to upload, share, and view educational materials. You retain
            ownership of the content you upload. However, by uploading, you grant Study Book a
            non-exclusive license to host and display the content to other users. You agree{' '}
            <strong>not</strong> to upload copyrighted materials without permission, or any content
            that is inappropriate, misleading, or malicious.
          </p>
        </div>

        <div className="card" style={{ cursor: 'default', textAlign: 'left' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '1.25rem', color: 'var(--blue-accent)' }}>
            3. Disclaimer of Liability
          </h3>
          <p style={{ color: 'var(--text-light)', lineHeight: 1.8 }}>
            The study materials provided on this platform are primarily uploaded by the community.
            Study Book makes no warranties regarding the accuracy, completeness, or reliability of
            any notes, PYQs, or syllabus files. Use these materials at your own discretion.
          </p>
        </div>

        <div className="card" style={{ cursor: 'default', textAlign: 'left' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '1.25rem', color: 'var(--blue-accent)' }}>
            4. Account Termination
          </h3>
          <p style={{ color: 'var(--text-light)', lineHeight: 1.8 }}>
            We reserve the right to suspend or terminate accounts that repeatedly violate these terms
            (e.g., by spamming the platform or uploading prohibited content) without prior notice.
          </p>
        </div>

        <div className="card" style={{ cursor: 'default', textAlign: 'left' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '1.25rem', color: 'var(--blue-accent)' }}>
            5. Changes to Terms
          </h3>
          <p style={{ color: 'var(--text-light)', lineHeight: 1.8 }}>
            Study Book reserves the right to modify these terms at any time. Significant changes will
            be communicated via the platform. Continued use of the platform following modifications
            implies acceptance of the updated terms.
          </p>
        </div>
      </div>
    </div>
  );
};
