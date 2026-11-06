import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from './firebase';
import { StudyMaterial } from '../types';
import { isDummyMaterial } from './resourceService';

const CONTINUE_READING_KEY = 'continue_reading_history';

export interface IBookmarkService {
  toggleBookmark(material: StudyMaterial, uid?: string): Promise<boolean>;
  isBookmarked(materialId: string, uid?: string): boolean;
  getSavedMaterials(uid?: string): Promise<StudyMaterial[]>;
  getContinueReading(): StudyMaterial[];
  saveContinueReading(material: StudyMaterial): void;
}

class HybridBookmarkService implements IBookmarkService {
  private getLocalSavedMap(uid?: string): Record<string, StudyMaterial> {
    const key = uid ? `saved_pdfs_${uid}` : 'saved_pdfs_guest';
    try {
      return JSON.parse(localStorage.getItem(key) || '{}');
    } catch {
      return {};
    }
  }

  private setLocalSavedMap(map: Record<string, StudyMaterial>, uid?: string): void {
    const key = uid ? `saved_pdfs_${uid}` : 'saved_pdfs_guest';
    try {
      localStorage.setItem(key, JSON.stringify(map));
    } catch (e) {
      console.warn('Failed to save bookmarks to localStorage:', e);
    }
  }

  isBookmarked(materialId: string, uid?: string): boolean {
    const map = this.getLocalSavedMap(uid);
    return !!map[materialId];
  }

  async toggleBookmark(material: StudyMaterial, uid?: string): Promise<boolean> {
    const map = this.getLocalSavedMap(uid);
    const wasBookmarked = !!map[material.id];
    const isNowBookmarked = !wasBookmarked;

    if (wasBookmarked) {
      delete map[material.id];
    } else {
      map[material.id] = {
        ...material,
        savedAt: new Date().toISOString(),
      };
    }

    // 1. Instantly persist to local storage (0ms latency)
    this.setLocalSavedMap(map, uid);

    // 2. Perform atomic Firestore update in the background (non-blocking)
    if (uid && material.id) {
      try {
        const docRef = doc(db, 'study_materials', material.id);
        updateDoc(docRef, {
          savedBy: isNowBookmarked ? arrayUnion(uid) : arrayRemove(uid),
        }).catch((err) => {
          console.warn('[Bookmark Sync] Background Firestore update warning:', err?.message || err);
        });
      } catch (err) {
        console.warn('Could not initiate bookmark sync to Firestore:', err);
      }
    }

    return isNowBookmarked;
  }

  async getSavedMaterials(uid?: string): Promise<StudyMaterial[]> {
    const localMap = this.getLocalSavedMap(uid);
    const list = Object.values(localMap).filter((m) => !isDummyMaterial(m));
    list.sort((a, b) => new Date(b.savedAt || b.createdAt).getTime() - new Date(a.savedAt || a.createdAt).getTime());
    return list;
  }

  getContinueReading(): StudyMaterial[] {
    try {
      const list = JSON.parse(localStorage.getItem(CONTINUE_READING_KEY) || '[]');
      return Array.isArray(list) ? list.filter((m) => !isDummyMaterial(m)) : [];
    } catch {
      return [];
    }
  }

  saveContinueReading(material: StudyMaterial): void {
    if (!material || !material.fileUrl) return;
    const item: StudyMaterial = {
      ...material,
      lastOpenedAt: new Date().toISOString(),
    };
    const current = this.getContinueReading().filter((m) => m.fileUrl !== material.fileUrl);
    const updated = [item, ...current].slice(0, 20);
    localStorage.setItem(CONTINUE_READING_KEY, JSON.stringify(updated));
  }
}

export const bookmarkService: IBookmarkService = new HybridBookmarkService();
