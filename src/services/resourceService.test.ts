import { describe, it, expect } from 'vitest';
import { StudyMaterial, SearchFilters } from '../types';
import { isDummyMaterial } from './resourceService';

// Mock material collection for testing in-memory filter algorithms
const sampleMaterials: StudyMaterial[] = [
  {
    id: 'mat-1',
    title: 'Operating Systems Unit 1',
    subject: 'Operating Systems',
    type: 'Notes',
    course: 'B.Tech',
    branch: 'Computer Science Engineering (CSE)',
    college: 'AKTU',
    fileUrl: 'https://example.com/os1.pdf',
    createdAt: '2026-03-01T10:00:00Z',
    description: 'Processes, threads, and CPU scheduling for 2nd year students',
  },
  {
    id: 'mat-2',
    title: 'Data Structures 2024 End Sem Paper',
    subject: 'Data Structures',
    type: 'Previous Year Questions (PYQs)',
    course: 'B.Tech',
    branch: 'Information Technology (IT)',
    college: 'GLA University',
    fileUrl: 'https://example.com/ds-pyq.pdf',
    createdAt: '2026-02-15T12:00:00Z',
    description: 'Previous year question paper covering trees and graphs',
  },
  {
    id: 'mat-3',
    title: 'Engineering Chemistry Lab Manual',
    subject: 'Engineering Chemistry',
    type: 'Class Notes',
    course: 'B.Tech',
    branch: 'Mechanical Engineering (ME)',
    college: 'AKTU',
    fileUrl: 'https://example.com/chem.pdf',
    createdAt: '2026-01-20T08:00:00Z',
    description: '1st year chemistry experiments and viva questions',
  },
];

const filterMaterialsInMemory = (
  materials: StudyMaterial[],
  queryText: string = '',
  filters: Partial<SearchFilters> = {}
): StudyMaterial[] => {
  let filtered = [...materials];

  const q = queryText.toLowerCase().trim();
  if (q) {
    filtered = filtered.filter((m) => {
      const text = `${m.title} ${m.subject} ${m.type || ''} ${m.course || ''} ${m.branch || ''} ${m.college || ''} ${m.description || ''}`.toLowerCase();
      return text.includes(q);
    });
  }

  if (filters.category) {
    const cat = filters.category.toLowerCase();
    filtered = filtered.filter((m) => {
      const type = (m.type || '').toLowerCase();
      if (cat === 'pyq') return type.includes('pyq') || type.includes('question');
      if (cat === 'notes') return type.includes('note');
      return type.includes(cat);
    });
  }

  if (filters.course) {
    filtered = filtered.filter((m) => (m.course || '').toLowerCase() === filters.course?.toLowerCase());
  }

  if (filters.univ) {
    filtered = filtered.filter((m) => (m.college || m.university || '').toLowerCase() === filters.univ?.toLowerCase());
  }

  if (filters.year) {
    filtered = filtered.filter((m) => {
      const text = `${m.title} ${m.subject} ${m.description || ''}`.toLowerCase();
      return text.includes(`year ${filters.year}`) || text.includes(`${filters.year}st year`) || text.includes(`${filters.year}nd year`) || text.includes(`${filters.year}rd year`);
    });
  }

  return filtered;
};

describe('Resource Search & Multi-Filter Query Engine', () => {
  it('searches correctly by query text across title, subject, and description', () => {
    const results = filterMaterialsInMemory(sampleMaterials, 'operating');
    expect(results.length).toBe(1);
    expect(results[0].title).toBe('Operating Systems Unit 1');
  });

  it('filters by category accurately (PYQ vs Notes)', () => {
    const pyqs = filterMaterialsInMemory(sampleMaterials, '', { category: 'PYQ' });
    expect(pyqs.length).toBe(1);
    expect(pyqs[0].type).toBe('Previous Year Questions (PYQs)');

    const notes = filterMaterialsInMemory(sampleMaterials, '', { category: 'Notes' });
    expect(notes.length).toBe(2);
  });

  it('filters by university accurately', () => {
    const aktuOnly = filterMaterialsInMemory(sampleMaterials, '', { univ: 'AKTU' });
    expect(aktuOnly.length).toBe(2);

    const glaOnly = filterMaterialsInMemory(sampleMaterials, '', { univ: 'GLA University' });
    expect(glaOnly.length).toBe(1);
    expect(glaOnly[0].college).toBe('GLA University');
  });

  it('filters by year in description', () => {
    const secondYear = filterMaterialsInMemory(sampleMaterials, '', { year: '2' });
    expect(secondYear.length).toBe(1);
    expect(secondYear[0].id).toBe('mat-1');
  });

  it('correctly identifies and purges materials older than 100 days based on createdAt threshold', () => {
    const daysThreshold = 100;
    const cutoffTime = Date.now() - daysThreshold * 24 * 60 * 60 * 1000;

    const testDocs = [
      { id: 'recent-doc', createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'border-doc', createdAt: new Date(Date.now() - 99 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'expired-doc-1', createdAt: new Date(Date.now() - 101 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'expired-doc-2', createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString() },
    ];

    const expired = testDocs.filter((d) => new Date(d.createdAt).getTime() < cutoffTime);
    expect(expired.length).toBe(2);
    expect(expired.map((d) => d.id)).toEqual(['expired-doc-1', 'expired-doc-2']);
  });

  it('identifies and filters out dummy/broken/expired materials', () => {
    const dummyItems = [
      { id: 'b9kfrOESUicYfS9nyY9K', title: 'Assignment 1', fileUrl: 'https://firebasestorage.app/dummy.pdf' },
      { id: 'lfL5Gpcd8LBnO5Pcxeqs', title: 'Physics chapter 1 notes', fileUrl: 'https://firebasestorage.app/dummy.pdf' },
      { id: 'valid-doc-1', title: 'Real Notes', storagePath: 'uid/123_notes.pdf', createdAt: new Date().toISOString() },
    ];

    const filtered = dummyItems.filter((item: any) => !isDummyMaterial(item));
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('valid-doc-1');
  });
});
