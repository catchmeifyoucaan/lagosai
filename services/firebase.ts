import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider, signInWithPopup, signInWithRedirect, signInAnonymously, onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const v = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {} as any;

const firebaseConfig = {
  apiKey: v.VITE_FIREBASE_API_KEY || (typeof process !== 'undefined' && ((process as any).env?.VITE_FIREBASE_API_KEY || (process as any).env?.FIREBASE_API_KEY)) || (typeof window !== 'undefined' && (window as any).FIREBASE_API_KEY) || '',
  authDomain: v.VITE_FIREBASE_AUTH_DOMAIN || (typeof process !== 'undefined' && ((process as any).env?.VITE_FIREBASE_AUTH_DOMAIN || (process as any).env?.FIREBASE_AUTH_DOMAIN)) || (typeof window !== 'undefined' && (window as any).FIREBASE_AUTH_DOMAIN) || '',
  projectId: v.VITE_FIREBASE_PROJECT_ID || (typeof process !== 'undefined' && ((process as any).env?.VITE_FIREBASE_PROJECT_ID || (process as any).env?.FIREBASE_PROJECT_ID)) || (typeof window !== 'undefined' && (window as any).FIREBASE_PROJECT_ID) || '',
  storageBucket: v.VITE_FIREBASE_STORAGE_BUCKET || (typeof process !== 'undefined' && ((process as any).env?.VITE_FIREBASE_STORAGE_BUCKET || (process as any).env?.FIREBASE_STORAGE_BUCKET)) || (typeof window !== 'undefined' && (window as any).FIREBASE_STORAGE_BUCKET) || '',
  messagingSenderId: v.VITE_FIREBASE_MESSAGING_SENDER_ID || (typeof process !== 'undefined' && ((process as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || (process as any).env?.FIREBASE_MESSAGING_SENDER_ID)) || (typeof window !== 'undefined' && (window as any).FIREBASE_MESSAGING_SENDER_ID) || '',
  appId: v.VITE_FIREBASE_APP_ID || (typeof process !== 'undefined' && ((process as any).env?.VITE_FIREBASE_APP_ID || (process as any).env?.FIREBASE_APP_ID)) || (typeof window !== 'undefined' && (window as any).FIREBASE_APP_ID) || ''
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');

const shouldUseRedirect = () => {
  if (typeof window === 'undefined') return false;
  const isSmall = window.innerWidth < 640;
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  return isSmall || isIOS || isSafari;
};

export const signInWithGoogle = async () => {
  if (shouldUseRedirect()) return signInWithRedirect(auth, googleProvider);
  return signInWithPopup(auth, googleProvider);
};

export const signInWithApple = async () => {
  if (shouldUseRedirect()) return signInWithRedirect(auth, appleProvider);
  return signInWithPopup(auth, appleProvider);
};

export const signInAnon = () => signInAnonymously(auth);
export const signOutUser = () => signOut(auth);
export const subscribeAuth = (cb: (user: User | null) => void) => onAuthStateChanged(auth, cb);