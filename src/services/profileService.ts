import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { auth, db } from './firebase';
import { UserProfile } from '../types';

export interface IProfileService {
  getProfile(uid: string): Promise<UserProfile | null>;
  saveProfile(uid: string, data: Partial<UserProfile>): Promise<void>;
}

class FirestoreProfileService implements IProfileService {
  async getProfile(uid: string): Promise<UserProfile | null> {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        return { uid, ...snap.data() } as UserProfile;
      }
      return null;
    } catch (e) {
      console.error('Error fetching user profile:', e);
      return null;
    }
  }

  async saveProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    await setDoc(doc(db, 'users', uid), data, { merge: true });

    if (auth.currentUser && data.name) {
      await updateProfile(auth.currentUser, { displayName: data.name });
    }
    if (data.name) {
      localStorage.setItem('userName', data.name);
    }
  }
}

export const profileService: IProfileService = new FirestoreProfileService();
