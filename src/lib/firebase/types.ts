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

export interface CloudTab {
  id: string;
  slug: string;
  title: string;
  artist: string;
  album?: string;
  instrument: 'guitar' | 'ukulele';
  tuning: string;
  capo: number;
  bpm?: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  strummingPattern?: string;
  isFingerstyle: boolean;
  content: string;
  chordsUsed: string[];
  lrclibId?: number;
  authorUid: string;
  authorName: string;
  visibility: TabVisibility;
  status: TabStatus;
  rejectionReason?: string;
  favoritesCount: number;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
}
