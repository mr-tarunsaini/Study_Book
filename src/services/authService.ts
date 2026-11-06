import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile } from '../types';

export interface IAuthService {
  onAuthStateChange(callback: (user: UserProfile | null) => void): () => void;
  getCurrentUser(): UserProfile | null;
  loginWithEmail(email: string, pass: string): Promise<UserProfile>;
  registerWithEmail(name: string, email: string, pass: string): Promise<UserProfile>;
  loginWithGoogle(): Promise<UserProfile>;
  sendPasswordReset(email: string): Promise<void>;
  logout(): Promise<void>;
}

class FirebaseAuthService implements IAuthService {
  private currentUserProfile: UserProfile | null = null;

  onAuthStateChange(callback: (user: UserProfile | null) => void): () => void {
    return onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (user) {
        let profileData: Partial<UserProfile> = {};
        try {
          const userDocSnap = await getDoc(doc(db, 'users', user.uid));
          if (userDocSnap.exists()) {
            profileData = userDocSnap.data() as Partial<UserProfile>;
          }
        } catch (err) {
          console.warn('Could not fetch user profile from Firestore:', err);
        }

        const resolvedUser: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          name: profileData.name || user.displayName || (user.email ? user.email.split('@')[0] : 'Student'),
          college: profileData.college || '',
          course: profileData.course || '',
          branch: profileData.branch || '',
          createdAt: profileData.createdAt,
          lastLogin: new Date().toISOString(),
          avatar: user.photoURL || undefined,
        };

        this.currentUserProfile = resolvedUser;
        localStorage.setItem('userUid', resolvedUser.uid);
        localStorage.setItem('userName', resolvedUser.name);
        callback(resolvedUser);
      } else {
        this.currentUserProfile = null;
        localStorage.removeItem('userUid');
        localStorage.removeItem('userName');
        callback(null);
      }
    });
  }

  getCurrentUser(): UserProfile | null {
    return this.currentUserProfile;
  }

  async loginWithEmail(email: string, pass: string): Promise<UserProfile> {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const user = cred.user;

    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    let name = user.displayName || email.split('@')[0];
    const now = new Date().toISOString();

    const userData: Record<string, any> = {
      email: user.email,
      lastLogin: now,
    };

    if (!userDoc.exists()) {
      userData.createdAt = now;
      userData.name = name;
    } else if (userDoc.data().name) {
      name = userDoc.data().name;
    }

    await setDoc(userRef, userData, { merge: true });

    const profile: UserProfile = {
      uid: user.uid,
      name,
      email: user.email || '',
      college: userDoc.exists() ? userDoc.data().college : undefined,
      course: userDoc.exists() ? userDoc.data().course : undefined,
      branch: userDoc.exists() ? userDoc.data().branch : undefined,
      createdAt: userDoc.exists() ? userDoc.data().createdAt : now,
      lastLogin: now,
    };

    this.currentUserProfile = profile;
    localStorage.setItem('userUid', profile.uid);
    localStorage.setItem('userName', profile.name);
    return profile;
  }

  async registerWithEmail(name: string, email: string, pass: string): Promise<UserProfile> {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const user = cred.user;

    await updateProfile(user, { displayName: name });

    const now = new Date().toISOString();
    const profile: UserProfile = {
      uid: user.uid,
      name,
      email,
      createdAt: now,
      lastLogin: now,
    };

    await setDoc(doc(db, 'users', user.uid), {
      name,
      email,
      createdAt: now,
      lastLogin: now,
    });

    this.currentUserProfile = profile;
    localStorage.setItem('userUid', profile.uid);
    localStorage.setItem('userName', profile.name);
    return profile;
  }

  async loginWithGoogle(): Promise<UserProfile> {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    let finalName = user.displayName || (user.email ? user.email.split('@')[0] : 'Student');
    const now = new Date().toISOString();

    const userData: Record<string, any> = {
      email: user.email,
      lastLogin: now,
    };

    if (!userDoc.exists()) {
      userData.createdAt = now;
      userData.name = finalName;
    } else if (user.displayName) {
      userData.name = user.displayName;
      finalName = user.displayName;
    } else if (userDoc.data().name) {
      finalName = userDoc.data().name;
    }

    await setDoc(userRef, userData, { merge: true });

    const profile: UserProfile = {
      uid: user.uid,
      name: finalName,
      email: user.email || '',
      college: userDoc.exists() ? userDoc.data().college : undefined,
      course: userDoc.exists() ? userDoc.data().course : undefined,
      branch: userDoc.exists() ? userDoc.data().branch : undefined,
      createdAt: userDoc.exists() ? userDoc.data().createdAt : now,
      lastLogin: now,
      avatar: user.photoURL || undefined,
    };

    this.currentUserProfile = profile;
    localStorage.setItem('userUid', profile.uid);
    localStorage.setItem('userName', profile.name);
    return profile;
  }

  async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  async logout(): Promise<void> {
    await signOut(auth);
    this.currentUserProfile = null;
    localStorage.removeItem('userUid');
    localStorage.removeItem('userName');
  }
}

export const authService: IAuthService = new FirebaseAuthService();
