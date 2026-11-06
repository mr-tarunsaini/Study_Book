import React from 'react';
import { Link } from 'react-router-dom';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div style={{ paddingTop: '20px', paddingBottom: '60px' }}>
      <div className="internal-hero">
        <h1>Privacy Policy</h1>
        <p>How we handle and protect your data.</p>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <p style={{ color: 'var(--text-light)', textAlign: 'center', marginBottom: '8px' }}>
          Last Updated: March 2026
        </p>

        <div className="card" style={{ cursor: 'default', textAlign: 'left' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '1.25rem', color: 'var(--blue-accent)' }}>
            1. Information We Collect
          </h3>
          <p style={{ color: 'var(--text-light)', lineHeight: 1.8 }}>
            When you create an account, we collect your basic profile information such as your Name,
            Email Address, and authentication data. If you choose to update your profile, we may also
            collect your College, Course, and Branch details to personalize your experience. We do not
            collect sensitive payment or location data.
          </p>
        </div>

        <div className="card" style={{ cursor: 'default', textAlign: 'left' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '1.25rem', color: 'var(--blue-accent)' }}>
            2. How We Use Your Data
          </h3>
          <p style={{ color: 'var(--text-light)', lineHeight: 1.8 }}>
            Your data is primarily used to provide, maintain, and improve our services. Specifically,
            it allows us to track the PDFs you have saved, manage the notes you upload to the
            community, and suggest study materials that match your engineering branch.
          </p>
        </div>

        <div className="card" style={{ cursor: 'default', textAlign: 'left' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '1.25rem', color: 'var(--blue-accent)' }}>
            3. Data Storage & Security
          </h3>
          <p style={{ color: 'var(--text-light)', lineHeight: 1.8 }}>
            We use Google Firebase to securely store user data and uploaded documents.
            Industry-standard security measures are implemented to ensure your account and files
            remain secure. However, please remember that no method of electronic transmission or
            storage is 100% secure.
          </p>
        </div>

        <div className="card" style={{ cursor: 'default', textAlign: 'left' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '1.25rem', color: 'var(--blue-accent)' }}>
            4. Cookies & Local Storage
          </h3>
          <p style={{ color: 'var(--text-light)', lineHeight: 1.8 }}>
            Study Book utilizes basic local storage and essential cookies to keep you logged in and to
            remember your UI preferences (such as Dark/Light mode and your "Continue Reading"
            history).
          </p>
        </div>

        <div className="card" style={{ cursor: 'default', textAlign: 'left' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '1.25rem', color: 'var(--blue-accent)' }}>
            5. Contact Us
          </h3>
          <p style={{ color: 'var(--text-light)', lineHeight: 1.8 }}>
            If you have any questions or concerns about our Privacy Policy, please feel free to reach
            out to us via the{' '}
            <Link to="/contact" style={{ color: 'var(--blue-accent)', fontWeight: 600 }}>
              Contact Us
            </Link>{' '}
            page.
          </p>
        </div>
      </div>
    </div>
  );
};
