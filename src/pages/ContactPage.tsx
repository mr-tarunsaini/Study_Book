import React, { useState } from 'react';
import { resourceService } from '../services/resourceService';
import { useToast } from '../context/ToastContext';

export const ContactPage: React.FC = () => {
  const { showToast } = useToast();

  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await resourceService.sendContactMessage({
        name,
        email,
        subject,
        message,
      });

      showToast('Your message has been sent successfully. We will get back to you soon!', 'success');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      showToast(`Error: ${err.message || 'Failed to send message.'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ paddingTop: '20px', paddingBottom: '60px' }}>
      <div className="internal-hero">
        <h1>Contact Us</h1>
        <p>Have questions, suggestions, or found an issue? We'd love to hear from you.</p>
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '36px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Subject</label>
            <input
              type="text"
              className="form-input"
              placeholder="How can we help you?"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Message</label>
            <textarea
              className="form-textarea"
              placeholder="Write your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              style={{ minHeight: '140px' }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-purple full-width"
            disabled={submitting}
            style={{ padding: '14px', fontSize: '1.05rem', borderRadius: '10px' }}
          >
            {submitting ? 'Sending Message...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
};
