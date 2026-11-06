import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="document-card" style={{ minHeight: '280px' }}>
      <div className="doc-preview-container skeleton-box" style={{ height: '190px' }}></div>
      <div className="doc-info" style={{ padding: '14px 2px 2px 2px' }}>
        <div className="skeleton-box" style={{ width: '85%', height: '18px', marginBottom: '10px' }}></div>
        <div className="skeleton-box" style={{ width: '60%', height: '14px' }}></div>
      </div>
    </div>
  );
};
