import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { StudyMaterial, SearchFilters, ContactMessage, UserProfile } from '../types';
import { storageService } from './storageService';

export interface IResourceService {
  getRecentMaterials(limitCount?: number): Promise<StudyMaterial[]>;
  getMaterialBySlugOrId(slugOrId: string): Promise<StudyMaterial | null>;
  searchMaterials(queryText: string, filters?: Partial<SearchFilters>): Promise<StudyMaterial[]>;
  getPersonalizedMaterials(user: UserProfile | null, limitCount?: number): Promise<StudyMaterial[]>;
  getUserMaterials(uid: string): Promise<StudyMaterial[]>;
  saveMaterial(data: Partial<StudyMaterial>): Promise<string>;
  updateMaterial(docId: string, data: Partial<StudyMaterial>): Promise<void>;
  deleteMaterial(docId: string, fileUrl?: string): Promise<void>;
  cleanupExpiredMaterials(daysThreshold?: number): Promise<{
    scanned: number;
    deleted: number;
    deletedIds: string[];
    errors: string[];
  }>;
  sendContactMessage(msg: ContactMessage): Promise<string>;
}

/**
 * Identifies dummy, test, or broken legacy materials so they never appear on the website
 */
export const isDummyMaterial = (item: StudyMaterial): boolean => {
  if (!item) return true;
  // Specific known dummy documents
  if (item.id === 'b9kfrOESUicYfS9nyY9K' || item.id === 'lfL5Gpcd8LBnO5Pcxeqs') return true;
  if (item.slug === 'assignment-1-891759') return true;
  if (item.title?.toLowerCase().includes('dummy')) return true;

  // Broken legacy Firebase storage files with no Supabase storage path
  if (item.fileUrl?.includes('firebasestorage.app') && !item.storagePath) {
    return true;
  }

  // Missing file reference entirely
  if (!item.fileUrl && !item.storagePath) {
    return true;
  }

  return false;
};

class FirestoreResourceService implements IResourceService {
  async getRecentMaterials(limitCount: number = 8): Promise<StudyMaterial[]> {
    try {
      const q = query(collection(db, 'study_materials'), orderBy('createdAt', 'desc'), limit(limitCount * 2));
      const snapshot = await getDocs(q);
      const list: StudyMaterial[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as StudyMaterial);
      });
      return list.filter((m) => !isDummyMaterial(m)).slice(0, limitCount);
    } catch (e) {
      console.error('Error getting recent materials:', e);
      return [];
    }
  }

  async getMaterialBySlugOrId(slugOrId: string): Promise<StudyMaterial | null> {
    try {
      // 1. Try slug query
      const q = query(collection(db, 'study_materials'), where('slug', '==', slugOrId), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        const docData = { id: d.id, ...d.data() } as StudyMaterial;
        return isDummyMaterial(docData) ? null : docData;
      }

      // 2. Fallback to direct document ID
      const docRef = doc(db, 'study_materials', slugOrId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const docData = { id: docSnap.id, ...docSnap.data() } as StudyMaterial;
        return isDummyMaterial(docData) ? null : docData;
      }
      return null;
    } catch (e) {
      console.error('Error fetching material by slug or id:', e);
      return null;
    }
  }

  async searchMaterials(queryText: string = '', filters: Partial<SearchFilters> = {}): Promise<StudyMaterial[]> {
    try {
      // Fetch materials ordered by newest
      const q = query(collection(db, 'study_materials'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      let materials: StudyMaterial[] = [];
      snap.forEach((d) => {
        materials.push({ id: d.id, ...d.data() } as StudyMaterial);
      });

      // Filter by text query
      const cleanQ = queryText.toLowerCase().trim();
      if (cleanQ) {
        materials = materials.filter((m) => {
          const title = (m.title || '').toLowerCase();
          const subject = (m.subject || '').toLowerCase();
          const type = (m.type || '').toLowerCase();
          const course = (m.course || '').toLowerCase();
          const branch = (m.branch || '').toLowerCase();
          const college = (m.college || m.university || '').toLowerCase();
          const desc = (m.description || '').toLowerCase();

          return (
            title.includes(cleanQ) ||
            subject.includes(cleanQ) ||
            type.includes(cleanQ) ||
            course.includes(cleanQ) ||
            branch.includes(cleanQ) ||
            college.includes(cleanQ) ||
            desc.includes(cleanQ)
          );
        });
      }

      // Filter by category
      if (filters.category) {
        const cat = filters.category.toLowerCase();
        materials = materials.filter((m) => {
          const type = (m.type || '').toLowerCase();
          if (cat === 'pyq') return type.includes('pyq') || type.includes('question');
          if (cat === 'notes') return type.includes('note');
          if (cat === 'books') return type.includes('book');
          if (cat === 'short notes') return type.includes('short');
          return type.includes(cat);
        });
      }

      // Filter by course
      if (filters.course) {
        const course = filters.course.toLowerCase();
        materials = materials.filter((m) => (m.course || '').toLowerCase().includes(course));
      }

      // Filter by college / university
      if (filters.univ) {
        const univ = filters.univ.toLowerCase();
        materials = materials.filter((m) =>
          (m.college || m.university || '').toLowerCase().includes(univ)
        );
      }

      // Filter by year
      if (filters.year) {
        materials = materials.filter((m) => {
          const text = `${m.title} ${m.subject} ${m.description || ''}`.toLowerCase();
          return text.includes(`year ${filters.year}`) || text.includes(`${filters.year}st year`) || text.includes(`${filters.year}nd year`) || text.includes(`${filters.year}rd year`) || text.includes(`${filters.year}th year`);
        });
      }

      return materials.filter((m) => !isDummyMaterial(m));
    } catch (e) {
      console.error('Error searching materials:', e);
      return [];
    }
  }

  async getPersonalizedMaterials(user: UserProfile | null, limitCount: number = 8): Promise<StudyMaterial[]> {
    if (!user || !user.course || !user.branch || !user.college) {
      return this.getRecentMaterials(limitCount);
    }

    try {
      // Single-field query on course requires no multi-field composite index in Firestore
      const q = query(
        collection(db, 'study_materials'),
        where('course', '==', user.course),
        limit(limitCount * 2)
      );
      const snap = await getDocs(q);
      const list: StudyMaterial[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as StudyMaterial));

      if (list.length > 0) {
        // Sort and prioritize exact branch and college match, then by createdAt desc
        list.sort((a, b) => {
          const aBranch = a.branch?.toLowerCase() === user.branch?.toLowerCase() ? 2 : 0;
          const aCollege = a.college?.toLowerCase() === user.college?.toLowerCase() ? 1 : 0;
          const bBranch = b.branch?.toLowerCase() === user.branch?.toLowerCase() ? 2 : 0;
          const bCollege = b.college?.toLowerCase() === user.college?.toLowerCase() ? 1 : 0;
          const aScore = aBranch + aCollege;
          const bScore = bBranch + bCollege;
          if (bScore !== aScore) return bScore - aScore;
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });
        return list.filter((m) => !isDummyMaterial(m)).slice(0, limitCount);
      }

      return this.getRecentMaterials(limitCount);
    } catch {
      return this.getRecentMaterials(limitCount);
    }
  }

  async getUserMaterials(uid: string): Promise<StudyMaterial[]> {
    try {
      const map = new Map<string, StudyMaterial>();

      // 1. Query by uploaderUid
      try {
        const q1 = query(collection(db, 'study_materials'), where('uploaderUid', '==', uid));
        const snap1 = await getDocs(q1);
        snap1.forEach((d) => map.set(d.id, { id: d.id, ...d.data() } as StudyMaterial));
      } catch (err) {
        console.warn('Error querying by uploaderUid:', err);
      }

      // 2. Fallback query by legacy uploadedBy field
      try {
        const q2 = query(collection(db, 'study_materials'), where('uploadedBy', '==', uid));
        const snap2 = await getDocs(q2);
        snap2.forEach((d) => {
          if (!map.has(d.id)) {
            map.set(d.id, { id: d.id, ...d.data() } as StudyMaterial);
          }
        });
      } catch (err) {
        console.warn('Error querying by uploadedBy:', err);
      }

      const list = Array.from(map.values());
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return list.filter((m) => !isDummyMaterial(m));
    } catch (e) {
      console.error('Error getting user materials:', e);
      return [];
    }
  }

  async saveMaterial(data: Partial<StudyMaterial>): Promise<string> {
    const rawTitle = data.title || 'Material';
    const slug =
      rawTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') +
      '-' +
      Date.now().toString().slice(-6);

    const now = new Date().toISOString();

    const docRef = await addDoc(collection(db, 'study_materials'), {
      ...data,
      resourceType: data.resourceType || data.type || 'Class Notes',
      type: data.type || data.resourceType || 'Class Notes',
      uploadedBy: data.uploadedBy || data.uploaderUid || '',
      uploaderUid: data.uploaderUid || data.uploadedBy || '',
      uploadedAt: data.uploadedAt || now,
      createdAt: data.createdAt || now,
      storagePath: data.storagePath || '',
      storageProvider: data.storageProvider || (data.storagePath ? 'supabase' : 'firebase'),
      slug,
      likedBy: [],
      savedBy: [],
    });
    return docRef.id;
  }

  async updateMaterial(docId: string, data: Partial<StudyMaterial>): Promise<void> {
    const docRef = doc(db, 'study_materials', docId);
    await updateDoc(docRef, data);
  }

  async deleteMaterial(docId: string, storagePathOrUrl?: string): Promise<void> {
    let target = storagePathOrUrl;
    if (!target) {
      try {
        const docSnap = await getDoc(doc(db, 'study_materials', docId));
        if (docSnap.exists()) {
          const matData = docSnap.data();
          target = matData.storagePath || matData.fileUrl;
        }
      } catch (err) {
        console.warn('Could not inspect document before deletion:', err);
      }
    }

    // Delete corresponding PDF from Supabase Storage / Firebase Storage first
    if (target) {
      await storageService.deleteFile(target);
    }

    // Only delete metadata from Firestore after successful storage deletion
    await deleteDoc(doc(db, 'study_materials', docId));
  }

  /**
   * Automatically removes all PDF files along with their Firestore database records
   * that are older than the specified number of days (default: 100 days).
   */
  async cleanupExpiredMaterials(daysThreshold: number = 100): Promise<{
    scanned: number;
    deleted: number;
    deletedIds: string[];
    errors: string[];
  }> {
    const cutoffTime = Date.now() - daysThreshold * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(cutoffTime);
    console.log(
      `[Auto-Cleanup] Scanning for materials older than ${daysThreshold} days (prior to ${cutoffDate.toISOString()})...`
    );

    const result = {
      scanned: 0,
      deleted: 0,
      deletedIds: [] as string[],
      errors: [] as string[],
    };

    try {
      const snap = await getDocs(collection(db, 'study_materials'));
      result.scanned = snap.size;

      const expiredList: { id: string; storagePath?: string; title: string; createdAt: string }[] = [];

      snap.forEach((d) => {
        const data = d.data();
        const dateStr = data.createdAt || data.uploadedAt;
        if (dateStr) {
          const time = new Date(dateStr).getTime();
          if (!isNaN(time) && time < cutoffTime) {
            expiredList.push({
              id: d.id,
              storagePath: data.storagePath || data.fileUrl,
              title: data.title || d.id,
              createdAt: dateStr,
            });
          }
        }
      });

      if (expiredList.length === 0) {
        console.log(`[Auto-Cleanup] No materials older than ${daysThreshold} days found.`);
        return result;
      }

      console.log(
        `[Auto-Cleanup] Found ${expiredList.length} expired material(s) older than ${daysThreshold} days. Deleting from Supabase Storage & Firestore...`
      );

      for (const item of expiredList) {
        try {
          await this.deleteMaterial(item.id, item.storagePath);
          result.deleted++;
          result.deletedIds.push(item.id);
          console.log(`[Auto-Cleanup] Removed expired material: "${item.title}" (${item.id})`);
        } catch (itemErr: any) {
          console.error(`[Auto-Cleanup] Failed to delete expired material ${item.id}:`, itemErr);
          result.errors.push(`${item.id}: ${itemErr.message || 'Deletion error'}`);
        }
      }

      console.log(
        `[Auto-Cleanup] Completed: ${result.deleted} material(s) deleted, ${result.errors.length} failed.`
      );
    } catch (err: any) {
      console.error('[Auto-Cleanup] Failed during scan:', err);
      result.errors.push(err.message || 'Auto-cleanup scan failed');
    }

    return result;
  }

  async sendContactMessage(msg: ContactMessage): Promise<string> {
    const docRef = await addDoc(collection(db, 'contact_messages'), {
      ...msg,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  }
}

export const resourceService: IResourceService = new FirestoreResourceService();
