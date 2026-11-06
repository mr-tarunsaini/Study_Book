import React from 'react';
import { SearchFilters } from '../../types';

interface AdvancedFiltersProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  isOpen: boolean;
  onClear: () => void;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onChange,
  isOpen,
  onClear,
}) => {
  if (!isOpen) return null;

  const handleChange = (field: keyof SearchFilters, val: string) => {
    onChange({
      ...filters,
      [field]: val,
    });
  };

  const hasActiveFilters = Boolean(
    filters.category || filters.course || filters.univ || filters.year
  );

  return (
    <div className="advanced-filters-panel" id="advanced-filters-panel">
      <div>
        <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
          Category
        </label>
        <select
          id="filter-category"
          className="form-input"
          value={filters.category}
          onChange={(e) => handleChange('category', e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="Notes">Notes</option>
          <option value="PYQ">Question Papers</option>
          <option value="Books">Books</option>
          <option value="Short Notes">Short Notes</option>
        </select>
      </div>

      <div>
        <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
          Course
        </label>
        <select
          id="filter-course"
          className="form-input"
          value={filters.course}
          onChange={(e) => handleChange('course', e.target.value)}
        >
          <option value="">All Courses</option>
          <option value="B.Tech">B.Tech</option>
          <option value="BCA">BCA</option>
          <option value="B.Sc">B.Sc</option>
          <option value="MBA">MBA</option>
          <option value="MCA">MCA</option>
        </select>
      </div>

      <div>
        <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
          College / University
        </label>
        <select
          id="filter-univ"
          className="form-input"
          value={filters.univ}
          onChange={(e) => handleChange('univ', e.target.value)}
        >
          <option value="">All Colleges</option>
          <option value="GLA University">GLA University</option>
          <option value="Gl Bajaj Group Of Institutions">Gl Bajaj Group Of Institutions</option>
          <option value="Sanskriti University">Sanskriti University</option>
          <option value="BSA College Of Engineering & Technology">BSA College Of Engineering & Technology</option>
          <option value="AKTU">AKTU</option>
        </select>
      </div>

      <div>
        <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
          Year
        </label>
        <select
          id="filter-year"
          className="form-input"
          value={filters.year}
          onChange={(e) => handleChange('year', e.target.value)}
        >
          <option value="">All Years</option>
          <option value="1">1st Year</option>
          <option value="2">2nd Year</option>
          <option value="3">3rd Year</option>
          <option value="4">4th Year</option>
        </select>
      </div>

      {hasActiveFilters && (
        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-outline"
            style={{ fontSize: '0.85rem', padding: '6px 14px' }}
            onClick={onClear}
          >
            <i className="fas fa-undo"></i> Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
