import React from 'react';
import { StudyMaterial } from '../../types';
import { DocumentCard } from './DocumentCard';
import { SkeletonCard } from '../common/SkeletonCard';

interface DocumentGridProps {
  materials: StudyMaterial[];
  loading?: boolean;
  emptyMessage?: string;
  onBookmarkChanged?: () => void;
  className?: string;
}

export const DocumentGrid: React.FC<DocumentGridProps> = ({
  materials,
  loading = false,
  emptyMessage = 'No study materials available at the moment.',
  onBookmarkChanged,
  className = '',
}) => {
  if (loading) {
    return (
      <div className={`document-grid ${className}`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (materials.length === 0) {
    return (
      <div className="empty-state">
        <i className="fas fa-folder-open"></i>
        <h3>No Materials Found</h3>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`document-grid ${className}`}>
      {materials.map((mat) => (
        <DocumentCard
          key={mat.id}
          material={mat}
          onBookmarkChanged={onBookmarkChanged}
        />
      ))}
    </div>
  );
};
