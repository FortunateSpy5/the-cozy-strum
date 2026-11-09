import {
  doc,
  getDoc,
  getDocFromCache,
  writeBatch,
} from 'firebase/firestore';
import { getFirebaseDb } from './config';
import type { CloudTab, CatalogIndexDoc, TabSummary, SongCategory } from './types';
import { SEED_TABS } from './seedTabs';

const CACHE_KEY = 'cozy_strum_catalog_cache';
const TTL_MS = 15 * 60 * 1000; // 15 minutes

interface CachedCatalog {
  timestamp: number;
  data: CatalogIndexDoc;
}

export function createFallbackCatalogIndex(): CatalogIndexDoc {
  const items: Record<string, TabSummary> = {};
  const categoryCounts: Partial<Record<SongCategory, number>> = {};

  for (const tab of SEED_TABS) {
    items[tab.id] = {
      id: tab.id,
      slug: tab.slug,
      title: tab.title,
      artist: tab.artist,
      album: tab.album,
      releaseYear: tab.releaseYear,
      category: tab.category,
      categories: tab.categories,
      instrument: tab.instrument,
      tuning: tab.tuning,
      capo: tab.capo,
      bpm: tab.bpm,
      key: tab.key,
      timeSignature: tab.timeSignature,
      difficulty: tab.difficulty,
      isFingerstyle: tab.isFingerstyle,
      chordsUsed: tab.chordsUsed,
      updatedAt: tab.updatedAt,
    };

    for (const cat of tab.categories) {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }
  }

  return {
    lastUpdated: new Date().toISOString(),
    totalCount: SEED_TABS.length,
    items,
    categoryCounts,
  };
}

export function catalogToTabItems(catalog: CatalogIndexDoc): import('../types').TabItem[] {
  return Object.values(catalog.items).map((s) => ({
    id: s.id,
    slug: s.slug,
    title: s.title,
    artist: s.artist,
    album: s.album,
    releaseYear: s.releaseYear,
    category: s.category,
    categories: s.categories || [],
    instrument: s.instrument,
    tuning: s.tuning,
    capo: s.capo,
    bpm: s.bpm,
    difficulty: s.difficulty.toLowerCase() as import('../types').Difficulty,
    tags: [s.instrument, ...(s.categories || [])],
    isFingerstyle: s.isFingerstyle,
    createdAt: s.updatedAt,
    isCustom: false,
  }));
}

export async function getCatalogIndex(forceRefresh = false): Promise<CatalogIndexDoc> {
  if (typeof window !== 'undefined' && !forceRefresh) {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CachedCatalog;
        if (Date.now() - parsed.timestamp < TTL_MS) {
          return parsed.data;
        }
      }
    } catch {
      // LocalStorage access issue, proceed to fetch
    }
  }

  const db = getFirebaseDb();
  if (!db) {
    return createFallbackCatalogIndex();
  }

  try {
    const metaRef = doc(db, 'meta', 'catalog_index');
    const snap = await getDoc(metaRef);

    if (snap.exists()) {
      const data = snap.data() as CatalogIndexDoc;
      if (typeof window !== 'undefined') {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
      }
      return data;
    }
  } catch (err) {
    console.warn('[The Cozy Strum] Error fetching catalog_index, using fallback:', err);
  }

  const fallback = createFallbackCatalogIndex();
  if (typeof window !== 'undefined') {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: fallback }));
  }
  return fallback;
}

export async function getTabById(tabId: string, expectedUpdatedAt?: string): Promise<CloudTab | null> {
  const db = getFirebaseDb();
  if (!db) {
    return SEED_TABS.find((t) => t.id === tabId || t.slug === tabId) ?? null;
  }

  const tabRef = doc(db, 'tabs', tabId);

  // 1. Try cache-first to achieve 0 reads
  try {
    const cachedSnap = await getDocFromCache(tabRef);
    if (cachedSnap.exists()) {
      const cachedTab = cachedSnap.data() as CloudTab;
      if (!expectedUpdatedAt || cachedTab.updatedAt >= expectedUpdatedAt) {
        return cachedTab;
      }
    }
  } catch {
    // Cache miss is normal on first visit, proceed to server fetch
  }

  // 2. Fetch from server if not cached or cache is stale
  try {
    const serverSnap = await getDoc(tabRef);
    if (serverSnap.exists()) {
      return serverSnap.data() as CloudTab;
    }
  } catch (err) {
    console.error('[The Cozy Strum] Error loading tab from server:', err);
  }

  return SEED_TABS.find((t) => t.id === tabId || t.slug === tabId) ?? null;
}

export async function seedInitialTabs(): Promise<CatalogIndexDoc> {
  const db = getFirebaseDb();
  const catalog = createFallbackCatalogIndex();

  if (!db) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: catalog }));
    }
    return catalog;
  }

  const batch = writeBatch(db);

  for (const tab of SEED_TABS) {
    const tabRef = doc(db, 'tabs', tab.id);
    batch.set(tabRef, tab);
  }

  const metaRef = doc(db, 'meta', 'catalog_index');
  batch.set(metaRef, catalog);

  await batch.commit();

  if (typeof window !== 'undefined') {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: catalog }));
  }

  return catalog;
}
