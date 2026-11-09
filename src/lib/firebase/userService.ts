import {
  doc,
  getDoc,
  getDocFromCache,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { getFirebaseDb } from './config';
import type { UserProfile, SongPracticePreference } from './types';

export const USER_PROFILE_EVENT = 'cozy:user-profile-updated';

export function notifyUserProfileChanged(profile: UserProfile): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<UserProfile>(USER_PROFILE_EVENT, { detail: profile }));
  }
}

export function onUserProfileChanged(callback: (profile: UserProfile) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (event: Event) => {
    const custom = event as CustomEvent<UserProfile>;
    if (custom.detail) {
      callback(custom.detail);
    }
  };
  window.addEventListener(USER_PROFILE_EVENT, handler);
  return () => window.removeEventListener(USER_PROFILE_EVENT, handler);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const db = getFirebaseDb();
  if (!db) return null;

  const userRef = doc(db, 'users', uid);

  // Cache-first lookup
  try {
    const cachedSnap = await getDocFromCache(userRef);
    if (cachedSnap.exists()) {
      return cachedSnap.data() as UserProfile;
    }
  } catch {
    // Proceed to network fetch
  }

  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (err) {
    console.warn('[The Cozy Strum] Failed to fetch user profile:', err);
  }

  return null;
}

export async function toggleFavoriteTab(uid: string, tabId: string): Promise<string[]> {
  const db = getFirebaseDb();
  if (!db) {
    throw new Error('Database connection unavailable.');
  }

  const userRef = doc(db, 'users', uid);
  const profile = await getUserProfile(uid);
  const currentFavorites = profile?.favoriteTabIds ?? [];
  const isFavorited = currentFavorites.includes(tabId);

  const updatedFavorites = isFavorited
    ? currentFavorites.filter((id) => id !== tabId)
    : [...currentFavorites, tabId];

  await updateDoc(userRef, {
    favoriteTabIds: isFavorited ? arrayRemove(tabId) : arrayUnion(tabId),
    updatedAt: new Date().toISOString(),
  });

  if (profile) {
    const updatedProfile: UserProfile = {
      ...profile,
      favoriteTabIds: updatedFavorites,
      updatedAt: new Date().toISOString(),
    };
    notifyUserProfileChanged(updatedProfile);
  }

  return updatedFavorites;
}

export function sanitizePrefKey(tabId: string): string {
  if (['__proto__', 'constructor', 'prototype'].includes(tabId)) {
    return `safe_${tabId}`;
  }
  return tabId.replace(/\./g, '_');
}

export async function saveSongPracticePreferences(
  uid: string,
  tabId: string,
  prefs: SongPracticePreference
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;

  const safeKey = sanitizePrefKey(tabId);
  const userRef = doc(db, 'users', uid);
  const now = new Date().toISOString();

  await updateDoc(userRef, {
    [`songPreferences.${safeKey}`]: prefs,
    updatedAt: now,
  });

  const profile = await getUserProfile(uid);
  if (profile) {
    const updatedProfile: UserProfile = {
      ...profile,
      songPreferences: {
        ...profile.songPreferences,
        [safeKey]: prefs,
      },
      updatedAt: now,
    };
    notifyUserProfileChanged(updatedProfile);
  }
}

export async function recordRecentlyPlayed(uid: string, tabId: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;

  const profile = await getUserProfile(uid);
  if (!profile) return;

  const existing = profile.recentlyPlayedIds || [];
  const updated = [tabId, ...existing.filter((id) => id !== tabId)].slice(0, 20);

  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    recentlyPlayedIds: updated,
    updatedAt: new Date().toISOString(),
  });
}
