import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  type Firestore,
} from 'firebase/firestore';

export function getEnvVar(key: string): string {
  if (typeof import.meta !== 'undefined' && import.meta.env && typeof import.meta.env[key] === 'string') {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && typeof process.env[key] === 'string') {
    return process.env[key];
  }
  return '';
}

export function getFirebaseConfig() {
  return {
    apiKey: getEnvVar('PUBLIC_FIREBASE_API_KEY'),
    authDomain: getEnvVar('PUBLIC_FIREBASE_AUTH_DOMAIN'),
    projectId: getEnvVar('PUBLIC_FIREBASE_PROJECT_ID'),
    storageBucket: getEnvVar('PUBLIC_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getEnvVar('PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    appId: getEnvVar('PUBLIC_FIREBASE_APP_ID'),
  };
}

export function isFirebaseConfigured(): boolean {
  return Boolean(
    getEnvVar('PUBLIC_FIREBASE_API_KEY') &&
    getEnvVar('PUBLIC_FIREBASE_PROJECT_ID')
  );
}

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined') return null;
  if (!isFirebaseConfigured()) return null;

  if (!appInstance) {
    appInstance = getApps().length > 0 ? getApp() : initializeApp(getFirebaseConfig());
  }
  return appInstance;
}

export function getFirebaseAuth(): Auth | null {
  if (typeof window === 'undefined') return null;
  const app = getFirebaseApp();
  if (!app) return null;

  if (!authInstance) {
    authInstance = getAuth(app);
  }
  return authInstance;
}

export function getFirebaseDb(): Firestore | null {
  if (typeof window === 'undefined') return null;
  const app = getFirebaseApp();
  if (!app) return null;

  if (!dbInstance) {
    try {
      dbInstance = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    } catch {
      // Fall back if already initialized or browser doesn't support persistent cache
      dbInstance = getFirestore(app);
    }
  }
  return dbInstance;
}
