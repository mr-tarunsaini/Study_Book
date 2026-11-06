import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Public client Firebase configuration.
// Supports VITE_ environment variables with fallback to the existing verified production project.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCYhE8Iw3KIRwqRmtAkVSE4zGG_8yxYn4M",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "studybook-15297.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "studybook-15297",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "studybook-15297.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "765823309336",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:765823309336:web:1110e756610c3495d6156d",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-JCFQV07N25",
};

// Initialize Firebase App as a singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
