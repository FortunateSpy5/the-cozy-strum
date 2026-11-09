import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { getFirebaseDb } from './config';
import type { Setlist } from './types';

const LOCAL_KEY = 'cozy_strum_local_setlists';

function getLocalSetlists(): Setlist[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as Setlist[]) : [];
  } catch {
    return [];
  }
}

function saveLocalSetlists(setlists: Setlist[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(setlists));
  } catch {
    // quota exceeded
  }
}

export async function getUserSetlists(uid: string): Promise<Setlist[]> {
  const db = getFirebaseDb();
  if (!db) {
    return getLocalSetlists().filter((s) => s.ownerUid === uid || s.ownerUid === 'local-user');
  }

  try {
    const snap = await getDocs(query(collection(db, 'setlists'), where('ownerUid', '==', uid)));
    const list: Setlist[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<Setlist, 'id'>) }));
    list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return list;
  } catch (err) {
    console.warn('[The Cozy Strum] Error fetching user setlists, falling back to local:', err);
    return getLocalSetlists().filter((s) => s.ownerUid === uid || s.ownerUid === 'local-user');
  }
}

export async function getSetlistById(setlistId: string): Promise<Setlist | null> {
  const db = getFirebaseDb();
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'setlists', setlistId));
      if (snap.exists()) return { id: snap.id, ...(snap.data() as Omit<Setlist, 'id'>) };
    } catch (err) {
      console.warn('[The Cozy Strum] Error fetching setlist by ID:', err);
    }
  }
  return getLocalSetlists().find((s) => s.id === setlistId) || null;
}

export async function createSetlist(
  uid: string,
  ownerName: string,
  title: string,
  description = '',
  initialTabIds: string[] = []
): Promise<Setlist> {
  const now = new Date().toISOString();
  const db = getFirebaseDb();
  const id = `setlist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const newSetlist: Setlist = {
    id,
    ownerUid: uid,
    ownerName,
    title: title.trim(),
    description: description.trim(),
    isPublic: false,
    tabIds: initialTabIds,
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    try {
      await setDoc(doc(db, 'setlists', id), newSetlist);
      return newSetlist;
    } catch (err) {
      console.warn('[The Cozy Strum] Error saving setlist to Firestore, falling back to local:', err);
    }
  }

  saveLocalSetlists([newSetlist, ...getLocalSetlists()]);
  return newSetlist;
}

export async function updateSetlist(
  setlistId: string,
  updates: Partial<Pick<Setlist, 'title' | 'description' | 'isPublic' | 'tabIds'>>
): Promise<void> {
  const now = new Date().toISOString();
  const db = getFirebaseDb();

  if (db) {
    try {
      await updateDoc(doc(db, 'setlists', setlistId), { ...updates, updatedAt: now });
      return;
    } catch (err) {
      console.warn('[The Cozy Strum] Error updating setlist in Firestore, updating local:', err);
    }
  }

  const updated = getLocalSetlists().map((s) =>
    s.id === setlistId ? { ...s, ...updates, updatedAt: now } : s
  );
  saveLocalSetlists(updated);
}

export async function deleteSetlist(setlistId: string): Promise<void> {
  const db = getFirebaseDb();
  if (db) {
    try {
      await deleteDoc(doc(db, 'setlists', setlistId));
    } catch (err) {
      console.warn('[The Cozy Strum] Error deleting setlist from Firestore:', err);
    }
  }
  saveLocalSetlists(getLocalSetlists().filter((s) => s.id !== setlistId));
}

export async function addTabToSetlist(setlistId: string, tabId: string): Promise<void> {
  const setlist = await getSetlistById(setlistId);
  if (!setlist || setlist.tabIds.includes(tabId)) return;
  await updateSetlist(setlistId, { tabIds: [...setlist.tabIds, tabId] });
}

export async function removeTabFromSetlist(setlistId: string, tabId: string): Promise<void> {
  const setlist = await getSetlistById(setlistId);
  if (!setlist) return;
  await updateSetlist(setlistId, { tabIds: setlist.tabIds.filter((id) => id !== tabId) });
}
