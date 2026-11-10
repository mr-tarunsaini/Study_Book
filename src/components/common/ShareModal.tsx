import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';

interface ShareModalProps {
  isOpen: boolean;
  url: string;
  title: string;
  details?: string;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  url,
  title,
  details = '',
  onClose,
}) => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
  const shareText = `*${title}*\n${details ? `${details}\n` : ''}Access study materials on Study Book:\n${fullUrl}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      showToast('Link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Failed to copy link.', 'error');
    }
  };

  const shareWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const shareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(title)}`, '_blank');
  };

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out "${title}" on Study Book! ${fullUrl}`)}`, '_blank');
  };

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Share Material</h2>
          <button className="close-modal-btn" onClick={onClose} aria-label="Close share modal">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '16px' }}>
          Share <strong>{title}</strong> with your classmates and study groups:
        </p>

        {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
          <button
            onClick={async () => {
              try {
                await navigator.share({
                  title,
                  text: `Check out "${title}" on Study Book!`,
                  url: fullUrl,
                });
                onClose();
              } catch (e: any) {
                if (e.name !== 'AbortError') console.warn(e);
              }
            }}
            className="btn btn-purple"
            style={{
              width: '100%',
              marginBottom: '14px',
              borderRadius: '10px',
              gap: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
            }}
          >
            <i className="fas fa-share-alt"></i> Share with Apps
          </button>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
          <button
            onClick={shareWhatsApp}
            className="btn btn-outline"
            style={{ flexDirection: 'column', gap: '6px', padding: '12px 8px', borderRadius: '12px' }}
          >
            <i className="fab fa-whatsapp" style={{ color: '#25D366', fontSize: '1.5rem' }}></i>
            <span style={{ fontSize: '0.8rem' }}>WhatsApp</span>
          </button>

          <button
            onClick={shareTelegram}
            className="btn btn-outline"
            style={{ flexDirection: 'column', gap: '6px', padding: '12px 8px', borderRadius: '12px' }}
          >
            <i className="fab fa-telegram-plane" style={{ color: '#0088cc', fontSize: '1.5rem' }}></i>
            <span style={{ fontSize: '0.8rem' }}>Telegram</span>
          </button>

          <button
            onClick={shareTwitter}
            className="btn btn-outline"
            style={{ flexDirection: 'column', gap: '6px', padding: '12px 8px', borderRadius: '12px' }}
          >
            <i className="fab fa-x-twitter" style={{ fontSize: '1.5rem' }}></i>
            <span style={{ fontSize: '0.8rem' }}>X (Twitter)</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            readOnly
            value={fullUrl}
            className="form-input"
            style={{ fontSize: '0.85rem', padding: '10px 12px' }}
          />
          <button
            onClick={copyToClipboard}
            className="btn btn-purple"
            style={{ padding: '10px 18px', whiteSpace: 'nowrap', borderRadius: '8px' }}
          >
            <i className={copied ? 'fas fa-check' : 'fas fa-copy'}></i> {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
};
