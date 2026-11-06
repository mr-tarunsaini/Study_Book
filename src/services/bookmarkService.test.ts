import { describe, it, expect, beforeEach } from 'vitest';
import { bookmarkService } from './bookmarkService';
import { StudyMaterial } from '../types';

// Mock localStorage for headless Node environment
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

if (typeof window === 'undefined' || !window.localStorage) {
  (globalThis as any).localStorage = createLocalStorageMock();
}

describe('Bookmark & Continue Reading Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const sampleMaterial: StudyMaterial = {
    id: 'mat-123',
    title: 'Operating Systems Notes',
    subject: 'Operating Systems',
    type: 'Notes',
    fileUrl: 'https://example.com/os.pdf',
    createdAt: '2026-03-01T10:00:00Z',
  };

  it('initially reports material as not bookmarked', () => {
    expect(bookmarkService.isBookmarked('mat-123')).toBe(false);
  });

  it('toggles bookmark state in local storage', async () => {
    const bookmarked = await bookmarkService.toggleBookmark(sampleMaterial);
    expect(bookmarked).toBe(true);
    expect(bookmarkService.isBookmarked('mat-123')).toBe(true);

    const savedList = await bookmarkService.getSavedMaterials();
    expect(savedList.length).toBe(1);
    expect(savedList[0].title).toBe('Operating Systems Notes');

    const unbookmarked = await bookmarkService.toggleBookmark(sampleMaterial);
    expect(unbookmarked).toBe(false);
    expect(bookmarkService.isBookmarked('mat-123')).toBe(false);
  });

  it('saves and retrieves continue reading history', () => {
    expect(bookmarkService.getContinueReading()).toEqual([]);

    bookmarkService.saveContinueReading(sampleMaterial);
    const crList = bookmarkService.getContinueReading();
    expect(crList.length).toBe(1);
    expect(crList[0].id).toBe('mat-123');
    expect(crList[0].fileUrl).toBe('https://example.com/os.pdf');
  });
});
