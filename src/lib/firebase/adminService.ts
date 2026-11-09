import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { getFirebaseDb } from './config';
import type { CloudTab, TabSummary, CatalogIndexDoc, SongCategory } from './types';
import { CATALOG_CACHE_KEY } from './tabsService';

export async function getPendingSubmissions(): Promise<CloudTab[]> {
  const db = getFirebaseDb();
  if (!db) return [];

  const q = query(
    collection(db, 'tabs'),
    where('status', '==', 'pending_review'),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as CloudTab);
}

export async function getAllTabsForAdmin(statusFilter?: string): Promise<CloudTab[]> {
  const db = getFirebaseDb();
  if (!db) return [];

  const baseCol = collection(db, 'tabs');
  const q = statusFilter && statusFilter !== 'all'
    ? query(baseCol, where('status', '==', statusFilter), orderBy('updatedAt', 'desc'), limit(100))
    : query(baseCol, orderBy('updatedAt', 'desc'), limit(100));

  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as CloudTab);
}

export async function approveSubmission(tab: CloudTab): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;

  const now = new Date().toISOString();
  const tabRef = doc(db, 'tabs', tab.id);

  // 1. Mark approved
  await updateDoc(tabRef, {
    status: 'approved',
    updatedAt: now,
  });

  // 2. Add lightweight TabSummary to meta/catalog_index
  const summary: TabSummary = {
    id: tab.id,
    slug: tab.slug,
    title: tab.title,
    artist: tab.artist,
    categories: tab.categories,
    instrument: tab.instrument,
    tuning: tab.tuning,
    capo: tab.capo,
    difficulty: tab.difficulty,
    isFingerstyle: tab.isFingerstyle,
    chordsUsed: tab.chordsUsed,
    updatedAt: now,
    ...(tab.album ? { album: tab.album } : {}),
    ...(tab.releaseYear ? { releaseYear: tab.releaseYear } : {}),
    ...(tab.bpm ? { bpm: tab.bpm } : {}),
    ...(tab.key ? { key: tab.key } : {}),
    ...(tab.timeSignature ? { timeSignature: tab.timeSignature } : {}),
  };

  const metaRef = doc(db, 'meta', 'catalog_index');
  const metaSnap = await getDoc(metaRef);
  const currentCatalog = metaSnap.exists()
    ? (metaSnap.data() as CatalogIndexDoc)
    : { lastUpdated: now, totalCount: 0, items: {}, categoryCounts: {} };

  const updatedItems = {
    ...currentCatalog.items,
    [tab.id]: summary,
  };

  const categoryCounts: Partial<Record<SongCategory, number>> = {};
  for (const item of Object.values(updatedItems)) {
    for (const cat of item.categories || []) {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }
  }

  await setDoc(metaRef, {
    lastUpdated: now,
    totalCount: Object.keys(updatedItems).length,
    items: updatedItems,
    categoryCounts,
  });

  if (typeof window !== 'undefined') {
    localStorage.removeItem(CATALOG_CACHE_KEY);
  }
}

export async function rejectSubmission(tabId: string, reason?: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;

  const now = new Date().toISOString();
  const tabRef = doc(db, 'tabs', tabId);

  await updateDoc(tabRef, {
    status: 'rejected',
    rejectionReason: reason?.trim() || 'Did not meet formatting or quality guidelines',
    updatedAt: now,
  });
}

export async function rebuildCatalogIndex(): Promise<number> {
  const db = getFirebaseDb();
  if (!db) return 0;

  const q = query(
    collection(db, 'tabs'),
    where('status', '==', 'approved'),
    where('visibility', '==', 'public')
  );

  const snap = await getDocs(q);
  const items: Record<string, TabSummary> = {};
  const categoryCounts: Partial<Record<SongCategory, number>> = {};

  snap.docs.forEach((docSnap) => {
    const data = docSnap.data() as CloudTab;
    items[data.id] = {
      id: data.id,
      slug: data.slug,
      title: data.title,
      artist: data.artist,
      album: data.album,
      releaseYear: data.releaseYear,
      category: data.category,
      categories: data.categories || [],
      instrument: data.instrument,
      tuning: data.tuning,
      capo: data.capo,
      bpm: data.bpm,
      key: data.key,
      timeSignature: data.timeSignature,
      difficulty: data.difficulty,
      isFingerstyle: data.isFingerstyle,
      chordsUsed: data.chordsUsed || [],
      updatedAt: data.updatedAt,
    };

    for (const cat of data.categories || []) {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }
  });

  const now = new Date().toISOString();
  const metaRef = doc(db, 'meta', 'catalog_index');
  await setDoc(metaRef, {
    lastUpdated: now,
    totalCount: Object.keys(items).length,
    items,
    categoryCounts,
  });

  if (typeof window !== 'undefined') {
    localStorage.removeItem(CATALOG_CACHE_KEY);
  }

  return Object.keys(items).length;
}
