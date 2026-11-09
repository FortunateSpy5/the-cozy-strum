import type { SongCategory } from '../types';
export { SONG_CATEGORIES, type SongCategory } from '../types';

export type UserRole = 'user' | 'admin';

export interface SongPracticePreference {
  transpose: number;
  capoOverride?: number;
  scrollSpeed?: number;
  instrumentView?: 'guitar' | 'ukulele';
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
  favoriteTabIds: string[];
  recentlyPlayedIds: string[];
  songPreferences: Record<string, SongPracticePreference>;
  createdAt: string;
  updatedAt: string;
}

export type TabVisibility = 'private' | 'public';
export type TabStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'removed_dmca';

export interface TabSummary {
  id: string;
  slug: string;
  title: string;
  artist: string;
  album?: string;
  releaseYear?: number;
  category?: string;
  categories: SongCategory[];
  instrument: 'guitar' | 'ukulele';
  tuning: string;
  capo: number;
  bpm?: number;
  key?: string;
  timeSignature?: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  isFingerstyle: boolean;
  chordsUsed: string[];
  updatedAt: string;
}

export interface CloudTab extends TabSummary {
  content: string;
  strummingPattern?: string;
  lrclibId?: number;
  authorUid: string;
  authorName: string;
  visibility: TabVisibility;
  status: TabStatus;
  rejectionReason?: string;
  favoritesCount: number;
  viewsCount: number;
  createdAt: string;
}

export interface TabRevision {
  id: string;
  tabId: string;
  songTitle: string;
  contributorUid: string;
  contributorName: string;
  changeSummary: string;
  proposedContent: string;
  status: 'pending' | 'applied' | 'rejected';
  createdAt: string;
  reviewedByUid?: string;
  reviewedAt?: string;
}

export interface CatalogIndexDoc {
  lastUpdated: string;
  totalCount: number;
  items: Record<string, TabSummary>;
  categoryCounts?: Partial<Record<SongCategory, number>>;
}
