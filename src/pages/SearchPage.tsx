import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchFilters, StudyMaterial } from '../types';
import { resourceService } from '../services/resourceService';
import { DocumentGrid } from '../components/resources/DocumentGrid';
import { AdvancedFilters } from '../components/resources/AdvancedFilters';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';

  const [inputVal, setInputVal] = useState<string>(queryParam);
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);
  const [filters, setFilters] = useState<SearchFilters>({
    category: searchParams.get('category') || '',
    course: searchParams.get('course') || '',
    univ: searchParams.get('univ') || '',
    year: searchParams.get('year') || '',
  });

  const [results, setResults] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sync inputVal when URL query parameter changes
  useEffect(() => {
    setInputVal(queryParam);
  }, [queryParam]);

  // Execute search when query or filters change
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    const performSearch = async () => {
      try {
        const data = await resourceService.searchMaterials(queryParam, filters);
        if (!isCancelled) {
          setResults(data);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || 'An error occurred while fetching study materials.');
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    performSearch();
    return () => {
      isCancelled = true;
    };
  }, [queryParam, filters]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (inputVal.trim()) {
      newParams.set('q', inputVal.trim());
    } else {
      newParams.delete('q');
    }
    setSearchParams(newParams);
  };

  const handleClearFilter = (key: keyof SearchFilters) => {
    const updated = { ...filters, [key]: '' };
    setFilters(updated);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete(key);
    setSearchParams(newParams);
  };

  const handleClearAllFilters = () => {
    setFilters({ category: '', course: '', univ: '', year: '' });
    const newParams = new URLSearchParams();
    if (queryParam) newParams.set('q', queryParam);
    setSearchParams(newParams);
  };

  const activeChips = Object.entries(filters).filter(([_, val]) => Boolean(val));

  return (
    <div className="search-main-content" style={{ paddingTop: '20px' }}>
      {/* Top Search Input & Filter Toggle */}
      <div className="search-header-section">
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <i
              className="fas fa-search"
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-light)',
              }}
            ></i>
            <input
              type="text"
              name="q"
              id="top-search-input"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Search for courses, notes, pyqs..."
              className="form-input"
              style={{
                width: '100%',
                padding: '14px 16px 14px 45px',
                borderRadius: '12px',
                fontSize: '1.05rem',
              }}
            />
          </div>
          <button
            type="button"
            className="btn btn-outline"
            style={{ borderRadius: '12px', background: 'var(--card-bg)' }}
            onClick={() => setFiltersOpen((prev) => !prev)}
            aria-expanded={filtersOpen}
          >
            <i className="fas fa-filter"></i>{' '}
            <span className="desktop-only">{filtersOpen ? 'Hide Filters' : 'Filters'}</span>
          </button>
        </form>
      </div>

      {/* Advanced Filters Panel */}
      <AdvancedFilters
        filters={filters}
        isOpen={filtersOpen}
        onChange={(newFilters) => {
          setFilters(newFilters);
          const newParams = new URLSearchParams(searchParams);
          Object.entries(newFilters).forEach(([k, v]) => {
            if (v) newParams.set(k, v);
            else newParams.delete(k);
          });
          setSearchParams(newParams);
        }}
        onClear={handleClearAllFilters}
      />

      {/* Active Filter Chips */}
      {activeChips.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {activeChips.map(([key, val]) => (
            <span key={key} className="filter-chip">
              <span style={{ textTransform: 'capitalize' }}>{key}: {val}</span>
              <button
                type="button"
                onClick={() => handleClearFilter(key as keyof SearchFilters)}
                aria-label={`Remove filter ${key}`}
              >
                <i className="fas fa-times"></i>
              </button>
            </span>
          ))}
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleClearAllFilters}
            style={{ fontSize: '0.8rem', padding: '4px 12px', borderRadius: '20px' }}
          >
            Clear All
          </button>
        </div>
      )}

      {/* Search Results Meta Info */}
      <div className="search-meta-info" id="search-results-info">
        {!loading && (
          <span>
            Found <strong>{results.length}</strong> {results.length === 1 ? 'material' : 'materials'}
            {queryParam && (
              <>
                {' '}
                for "<em>{queryParam}</em>"
              </>
            )}
          </span>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="empty-state" style={{ color: '#ef4444' }}>
          <i className="fas fa-exclamation-circle"></i>
          <h3>Error Loading Materials</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Results Document Grid */}
      {!error && (
        <DocumentGrid
          materials={results}
          loading={loading}
          className="search-results-grid"
          emptyMessage={
            queryParam
              ? `No resources match your search query "${queryParam}". Try checking for spelling errors or clearing filters.`
              : 'No materials match the selected filters.'
          }
        />
      )}
    </div>
  );
};
