import { doc, setDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { getFirebaseDb } from './config';
import type { CloudTab, TabStatus, TabVisibility } from './types';
import type { SongCategory, Difficulty, Instrument } from '../types';
import { parseSongText } from '../parser/songParser';
import { saveUserTab } from '../storage/tabStorage';

export interface TabSubmissionInput {
  title: string;
  artist: string;
  album?: string;
  releaseYear?: number;
  categories: SongCategory[];
  instrument: Instrument;
  tuning: string;
  capo: number;
  bpm?: number;
  key?: string;
  timeSignature?: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  isFingerstyle: boolean;
  strummingPattern?: string;
  content: string;
  visibility: TabVisibility;
  lrclibId?: number;
}

export function generateTabSlug(title: string): string {
  const clean = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return clean || 'untitled-tab';
}

export async function submitTab(
  user: User,
  input: TabSubmissionInput
): Promise<{ id: string; slug: string; status: TabStatus }> {
  const title = input.title.trim().slice(0, 200);
  const artist = input.artist.trim().slice(0, 200);
  const content = input.content.slice(0, 65536);

  if (!title || !artist) {
    throw new Error('Both Song Title and Artist are required.');
  }
  if (!content.trim()) {
    throw new Error('Tab content must not be empty.');
  }

  const db = getFirebaseDb();
  const slug = generateTabSlug(title);
  const id = `tab-${Date.now()}-${slug.slice(0, 24)}`;
  const now = new Date().toISOString();

  const ast = parseSongText(content);
  const chordsUsed = ast.uniqueChords;
  const status: TabStatus = input.visibility === 'private' ? 'draft' : 'pending_review';

  const capo = Math.max(0, Math.min(12, Number.isFinite(input.capo) ? Math.floor(input.capo) : 0));
  const bpm = input.bpm && Number.isFinite(input.bpm) ? Math.max(30, Math.min(300, Math.floor(input.bpm))) : undefined;
  const releaseYear = input.releaseYear && Number.isFinite(input.releaseYear) && input.releaseYear >= 1900 && input.releaseYear <= 2099
    ? Math.floor(input.releaseYear)
    : undefined;

  const cloudTab: CloudTab = {
    id,
    slug,
    title,
    artist,
    categories: input.categories.slice(0, 8),
    instrument: input.instrument,
    tuning: input.tuning,
    capo,
    difficulty: input.difficulty,
    isFingerstyle: input.isFingerstyle,
    content,
    chordsUsed,
    authorUid: user.uid,
    authorName: user.displayName || user.email?.split('@')[0] || 'Musician',
    visibility: input.visibility,
    status,
    favoritesCount: 0,
    viewsCount: 0,
    createdAt: now,
    updatedAt: now,
    ...(input.album?.trim() ? { album: input.album.trim() } : {}),
    ...(releaseYear ? { releaseYear } : {}),
    ...(bpm ? { bpm } : {}),
    ...(input.key?.trim() ? { key: input.key.trim() } : {}),
    ...(input.timeSignature?.trim() ? { timeSignature: input.timeSignature.trim() } : {}),
    ...(input.strummingPattern?.trim() ? { strummingPattern: input.strummingPattern.trim() } : {}),
    ...(input.lrclibId ? { lrclibId: input.lrclibId } : {}),
  };

  if (db) {
    const tabRef = doc(db, 'tabs', id);
    await setDoc(tabRef, cloudTab);
    return { id, slug, status };
  }

  // Offline / Demo fallback: store locally
  saveUserTab({
    id,
    slug,
    title: cloudTab.title,
    artist: cloudTab.artist,
    instrument: cloudTab.instrument,
    tuning: cloudTab.tuning,
    capo: cloudTab.capo,
    bpm: cloudTab.bpm,
    difficulty: cloudTab.difficulty.toLowerCase() as Difficulty,
    tags: [cloudTab.instrument, ...cloudTab.categories],
    isFingerstyle: cloudTab.isFingerstyle,
    createdAt: cloudTab.createdAt,
    content: cloudTab.content,
    isCustom: true,
  });

  return { id, slug, status };
}
