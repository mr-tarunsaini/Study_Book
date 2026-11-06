import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  isDanger = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay active">
      <div className="modal-card" style={{ maxWidth: '420px', textAlign: 'center' }}>
        <i
          className={isDanger ? 'fas fa-exclamation-triangle' : 'fas fa-question-circle'}
          style={{
            fontSize: '3rem',
            color: isDanger ? '#ef4444' : 'var(--blue-accent)',
            marginBottom: '16px',
            display: 'inline-block',
          }}
        ></i>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--text-dark)' }}>
          {title}
        </h3>
        <p style={{ color: 'var(--text-light)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.5 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button className="btn btn-outline" onClick={onCancel} style={{ borderRadius: '8px' }}>
            Cancel
          </button>
          <button
            className={isDanger ? 'btn btn-danger' : 'btn btn-blue'}
            onClick={onConfirm}
            style={{ borderRadius: '8px' }}
          >
            {isDanger ? 'Delete' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};
