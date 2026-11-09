import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
  type Unsubscribe,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured, getEnvVar } from './config';
import type { UserProfile } from './types';

function getSuperAdminEmail(): string {
  const envVal = getEnvVar('PUBLIC_SUPERADMIN_EMAIL');
  return envVal.trim().toLowerCase();
}

export function isUserSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmail = getSuperAdminEmail();
  return Boolean(adminEmail && email.trim().toLowerCase() === adminEmail);
}

export async function ensureUserProfileDoc(user: User): Promise<UserProfile> {
  const db = getFirebaseDb();
  const superAdmin = isUserSuperAdmin(user.email);
  const now = new Date().toISOString();

  const defaultProfile: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'Acoustic Musician',
    photoURL: user.photoURL || '',
    role: superAdmin ? 'admin' : 'user',
    favoriteTabIds: [],
    recentlyPlayedIds: [],
    songPreferences: {},
    createdAt: now,
    updatedAt: now,
  };

  if (!db) {
    return defaultProfile;
  }

  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, defaultProfile);
    return defaultProfile;
  }

  const existing = snap.data() as UserProfile;

  // Auto-upgrade to admin role if matching the configured superadmin email
  if (superAdmin && existing.role !== 'admin') {
    const updated: UserProfile = {
      ...existing,
      role: 'admin',
      updatedAt: now,
    };
    await updateDoc(userRef, { role: 'admin', updatedAt: now });
    return updated;
  }

  return existing;
}

export async function signInWithGoogle(): Promise<{ user: User; profile: UserProfile } | null> {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase credentials not configured in environment.');
  }

  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error('Firebase Auth unavailable.');
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  const result = await signInWithPopup(auth, provider);
  const profile = await ensureUserProfileDoc(result.user);
  return { user: result.user, profile };
}

export async function logout(): Promise<void> {
  const auth = getFirebaseAuth();
  if (auth) {
    await signOut(auth);
  }
}

export function subscribeToAuth(
  callback: (user: User | null, profile: UserProfile | null, loading: boolean) => void
): Unsubscribe {
  const auth = getFirebaseAuth();
  if (!auth) {
    callback(null, null, false);
    return () => {};
  }

  return onAuthStateChanged(auth, async (currentUser) => {
    if (!currentUser) {
      callback(null, null, false);
      return;
    }

    try {
      const profile = await ensureUserProfileDoc(currentUser);
      callback(currentUser, profile, false);
    } catch (err) {
      console.error('[The Cozy Strum] Error fetching user profile:', err);
      callback(currentUser, null, false);
    }
  });
}
