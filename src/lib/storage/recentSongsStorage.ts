import type { RecentSongItem } from '../firebase/types';

const RECENT_SONGS_KEY = 'cozy_strum_recent_songs';
const MAX_RECENT_SONGS = 8;

export const STARTER_PRACTICE_SONGS: RecentSongItem[] = [
  {
    id: 'seed-acoustic-strumming',
    title: 'Wonderwall',
    artist: 'Oasis',
    instrument: 'guitar',
    openedAt: 1700000000000,
  },
  {
    id: 'seed-fingerstyle-blues',
    title: 'Dust in the Wind',
    artist: 'Kansas',
    instrument: 'guitar',
    openedAt: 1700000001000,
  },
  {
    id: 'seed-ukulele-island',
    title: 'Riptide (Ukulele Edition)',
    artist: 'Vance Joy',
    instrument: 'ukulele',
    openedAt: 1700000002000,
  },
];

export function getRecentSongs(): RecentSongItem[] {
  if (typeof window === 'undefined') return STARTER_PRACTICE_SONGS;
  try {
    const raw = localStorage.getItem(RECENT_SONGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is RecentSongItem => {
      return Boolean(
        item &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        typeof item.artist === 'string' &&
        (item.instrument === 'guitar' || item.instrument === 'ukulele')
      );
    });
  } catch {
    return [];
  }
}

export function recordRecentSong(song: Omit<RecentSongItem, 'openedAt'>): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getRecentSongs();
    const updated: RecentSongItem[] = [
      { ...song, openedAt: Date.now() },
      ...current.filter((s) => s.id !== song.id),
    ].slice(0, MAX_RECENT_SONGS);
    localStorage.setItem(RECENT_SONGS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota error
  }
}

export function clearRecentSongs(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(RECENT_SONGS_KEY);
  } catch {
    // Ignore
  }
}
