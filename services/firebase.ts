import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider, signInWithPopup, signInAnonymously, onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: (typeof process !== 'undefined' && (process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY)) || (typeof window !== 'undefined' && (window as any).FIREBASE_API_KEY) || '',
  authDomain: (typeof process !== 'undefined' && (process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN)) || (typeof window !== 'undefined' && (window as any).FIREBASE_AUTH_DOMAIN) || '',
  projectId: (typeof process !== 'undefined' && (process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID)) || (typeof window !== 'undefined' && (window as any).FIREBASE_PROJECT_ID) || '',
  storageBucket: (typeof process !== 'undefined' && (process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET)) || (typeof window !== 'undefined' && (window as any).FIREBASE_STORAGE_BUCKET) || '',
  messagingSenderId: (typeof process !== 'undefined' && (process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID)) || (typeof window !== 'undefined' && (window as any).FIREBASE_MESSAGING_SENDER_ID) || '',
  appId: (typeof process !== 'undefined' && (process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID)) || (typeof window !== 'undefined' && (window as any).FIREBASE_APP_ID) || ''
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const appleProvider = new OAuthProvider('apple.com');
export const signInWithApple = () => signInWithPopup(auth, appleProvider);
export const signInAnon = () => signInAnonymously(auth);
export const signOutUser = () => signOut(auth);
export const subscribeAuth = (cb: (user: User | null) => void) => onAuthStateChanged(auth, cb);