import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  type Firestore,
} from 'firebase/firestore';

export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyB1QeDAh4uYI8mhbiyD9UF9hfUqoFJVv8A',
  authDomain: 'the-cozy-strum.firebaseapp.com',
  projectId: 'the-cozy-strum',
  storageBucket: 'the-cozy-strum.firebasestorage.app',
  messagingSenderId: '39514743662',
  appId: '1:39514743662:web:9fd0d6a6daf459065cd77f',
};

export const DEFAULT_SUPERADMIN_EMAIL = 'msoumotanu@gmail.com';

export function getEnvVar(key: string): string {
  // 1. Process environment (SSR / Node test environment)
  if (typeof process !== 'undefined' && process.env && typeof process.env[key] === 'string' && process.env[key]) {
    return process.env[key];
  }
  // 2. Vite static env inlining for client builds
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (key === 'PUBLIC_FIREBASE_API_KEY' && import.meta.env.PUBLIC_FIREBASE_API_KEY) {
      return import.meta.env.PUBLIC_FIREBASE_API_KEY;
    }
    if (key === 'PUBLIC_FIREBASE_AUTH_DOMAIN' && import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN) {
      return import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN;
    }
    if (key === 'PUBLIC_FIREBASE_PROJECT_ID' && import.meta.env.PUBLIC_FIREBASE_PROJECT_ID) {
      return import.meta.env.PUBLIC_FIREBASE_PROJECT_ID;
    }
    if (key === 'PUBLIC_FIREBASE_STORAGE_BUCKET' && import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET) {
      return import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET;
    }
    if (key === 'PUBLIC_FIREBASE_MESSAGING_SENDER_ID' && import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID) {
      return import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
    }
    if (key === 'PUBLIC_FIREBASE_APP_ID' && import.meta.env.PUBLIC_FIREBASE_APP_ID) {
      return import.meta.env.PUBLIC_FIREBASE_APP_ID;
    }
    if (key === 'PUBLIC_SUPERADMIN_EMAIL' && import.meta.env.PUBLIC_SUPERADMIN_EMAIL) {
      return import.meta.env.PUBLIC_SUPERADMIN_EMAIL;
    }
    if (typeof import.meta.env[key] === 'string' && import.meta.env[key]) {
      return import.meta.env[key];
    }
  }

  // 3. Fallback to built-in project credentials
  switch (key) {
    case 'PUBLIC_FIREBASE_API_KEY': return DEFAULT_FIREBASE_CONFIG.apiKey;
    case 'PUBLIC_FIREBASE_AUTH_DOMAIN': return DEFAULT_FIREBASE_CONFIG.authDomain;
    case 'PUBLIC_FIREBASE_PROJECT_ID': return DEFAULT_FIREBASE_CONFIG.projectId;
    case 'PUBLIC_FIREBASE_STORAGE_BUCKET': return DEFAULT_FIREBASE_CONFIG.storageBucket;
    case 'PUBLIC_FIREBASE_MESSAGING_SENDER_ID': return DEFAULT_FIREBASE_CONFIG.messagingSenderId;
    case 'PUBLIC_FIREBASE_APP_ID': return DEFAULT_FIREBASE_CONFIG.appId;
    case 'PUBLIC_SUPERADMIN_EMAIL': return DEFAULT_SUPERADMIN_EMAIL;
    default: return '';
  }
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
        ignoreUndefinedProperties: true,
      });
    } catch {
      dbInstance = getFirestore(app);
    }
  }
  return dbInstance;
}
