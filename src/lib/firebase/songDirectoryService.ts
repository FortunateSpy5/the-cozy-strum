import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseDb } from './config';
import type { CompactSongEntry, SongDirectoryDoc } from './types';
import fallbackDirectoryData from './songDirectoryFallback.json';

export const DIRECTORY_CACHE_KEY = 'cozy_strum_dir_v1';
export const DIRECTORY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedDirectory {
  timestamp: number;
  data: SongDirectoryDoc;
}

export function getFallbackSongDirectory(): SongDirectoryDoc {
  return fallbackDirectoryData as SongDirectoryDoc;
}

export async function getSongDirectory(forceRefresh = false): Promise<SongDirectoryDoc> {
  // 1. Check 24-hour localStorage cache first (0 DB reads!)
  if (typeof window !== 'undefined' && !forceRefresh) {
    try {
      const raw = localStorage.getItem(DIRECTORY_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CachedDirectory;
        if (Date.now() - parsed.timestamp < DIRECTORY_TTL_MS && parsed.data?.songs?.length > 0) {
          return parsed.data;
        }
      }
    } catch {
      // Storage access error, continue to fetch
    }
  }

  // 2. Fetch single compact document from Firestore (1 DB read)
  const db = getFirebaseDb();
  if (db) {
    try {
      const metaRef = doc(db, 'meta', 'song_directory');
      const snap = await getDoc(metaRef);
      if (snap.exists()) {
        const data = snap.data() as SongDirectoryDoc;
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(DIRECTORY_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
          } catch {
            // Quota or storage error ignored
          }
        }
        return data;
      }
    } catch (err) {
      console.warn('[The Cozy Strum] Error fetching meta/song_directory, using fallback:', err);
    }
  }

  // 3. Fallback to bundled directory
  const fallback = getFallbackSongDirectory();
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(DIRECTORY_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: fallback }));
    } catch {
      // Ignore
    }
  }
  return fallback;
}

export async function syncSongDirectory(): Promise<SongDirectoryDoc> {
  return getSongDirectory(true);
}

export function filterSongDirectory(
  songs: CompactSongEntry[],
  query: string,
  instrument: 'all' | 'guitar' | 'ukulele' = 'all',
  fingerstyleOnly = false
): CompactSongEntry[] {
  const q = query.trim().toLowerCase();
  return songs.filter((s) => {
    if (instrument !== 'all') {
      const expectedIns = instrument === 'guitar' ? 'g' : 'u';
      if (s.ins !== expectedIns) return false;
    }
    if (fingerstyleOnly && !s.f) return false;
    if (!q) return true;
    return s.t.toLowerCase().includes(q) || s.a.toLowerCase().includes(q);
  });
}

export function difficultyLabel(d: 1 | 2 | 3): 'Beginner' | 'Intermediate' | 'Advanced' {
  switch (d) {
    case 3: return 'Advanced';
    case 2: return 'Intermediate';
    default: return 'Beginner';
  }
}
