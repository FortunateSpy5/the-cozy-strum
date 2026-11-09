import type { UserTab, Setlist, UserPreferences, Instrument, Difficulty } from '../types';

export interface BackupPayload {
  app: 'the-cozy-strum';
  version: number;
  exportedAt: string;
  totalTabs: number;
  tabs: UserTab[];
  setlists?: Setlist[];
  preferences?: Partial<UserPreferences>;
}

export const MAX_JSON_PAYLOAD_BYTES = 10 * 1024 * 1024; // 10MB limit

const VALID_THEMES = new Set(['parchment', 'campfire']);
const VALID_INSTRUMENTS = new Set(['guitar', 'ukulele']);
const VALID_FONT_SIZES = new Set(['sm', 'base', 'lg', 'xl']);
const VALID_COLUMN_MODES = new Set(['single', 'two-column', 'three-column']);
const VALID_DOCK_POSITIONS = new Set(['bottom', 'top']);

function hasDangerousKey(obj: Record<string, unknown>): boolean {
  return (
    Object.prototype.hasOwnProperty.call(obj, '__proto__') ||
    Object.prototype.hasOwnProperty.call(obj, 'constructor') ||
    Object.prototype.hasOwnProperty.call(obj, 'prototype')
  );
}

export function sanitizeZipSlug(slug: string): string {
  const clean = slug
    .replace(/[\\/]/g, '-')
    .replace(/\.\.+/g, '-')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/^-+|-+$/g, '');
  return clean || 'tab';
}

export function parseBackupJson(jsonString: string): BackupPayload {
  if (typeof jsonString !== 'string' || !jsonString.trim()) {
    throw new Error('Invalid JSON: Payload is empty.');
  }
  if (jsonString.length > MAX_JSON_PAYLOAD_BYTES) {
    throw new Error('Payload too large: Backup JSON exceeds maximum allowed size (10MB).');
  }

  const parsed = JSON.parse(jsonString) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Invalid JSON: Root must be an object.');
  }

  const obj = parsed as Record<string, unknown>;
  if (!Array.isArray(obj.tabs)) {
    throw new Error('Invalid backup: Missing "tabs" array.');
  }

  return {
    app: 'the-cozy-strum',
    version: typeof obj.version === 'number' ? obj.version : 1,
    exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : new Date().toISOString(),
    totalTabs: obj.tabs.length,
    tabs: obj.tabs as UserTab[],
    setlists: Array.isArray(obj.setlists) ? (obj.setlists as Setlist[]) : undefined,
    preferences:
      obj.preferences && typeof obj.preferences === 'object' && !Array.isArray(obj.preferences)
        ? (obj.preferences as Partial<UserPreferences>)
        : undefined
  };
}

export function sanitizeUserTab(raw: unknown): UserTab | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  if (hasDangerousKey(obj)) return null;
  if (typeof obj.title !== 'string' || !obj.title.trim()) return null;
  if (typeof obj.content !== 'string' || !obj.content.trim()) return null;

  const rawSlug = typeof obj.slug === 'string' && obj.slug.trim()
    ? obj.slug.trim()
    : obj.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const slug = sanitizeZipSlug(rawSlug);

  const instrument: Instrument =
    typeof obj.instrument === 'string' && VALID_INSTRUMENTS.has(obj.instrument)
      ? (obj.instrument as Instrument)
      : 'guitar';

  const difficulty: Difficulty =
    obj.difficulty === 'beginner' || obj.difficulty === 'intermediate' || obj.difficulty === 'advanced'
      ? obj.difficulty
      : 'intermediate';

  const tags = Array.isArray(obj.tags)
    ? obj.tags.filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
    : [];

  const capo = typeof obj.capo === 'number' && Number.isFinite(obj.capo) && obj.capo >= 0 && obj.capo <= 24
    ? Math.floor(obj.capo)
    : 0;

  const bpm = typeof obj.bpm === 'number' && Number.isFinite(obj.bpm) && obj.bpm >= 30 && obj.bpm <= 320
    ? Math.floor(obj.bpm)
    : undefined;

  return {
    id: typeof obj.id === 'string' && obj.id.trim() ? obj.id.trim() : `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: obj.title.trim().slice(0, 150),
    artist: typeof obj.artist === 'string' && obj.artist.trim() ? obj.artist.trim().slice(0, 150) : 'Unknown Artist',
    instrument,
    tuning: typeof obj.tuning === 'string' && obj.tuning.trim() ? obj.tuning.trim().slice(0, 60) : 'Standard (E A D G B e)',
    capo,
    bpm,
    difficulty,
    strummingPattern: typeof obj.strummingPattern === 'string' && obj.strummingPattern.trim() ? obj.strummingPattern.trim().slice(0, 100) : undefined,
    tags,
    isFingerstyle: Boolean(obj.isFingerstyle),
    key: typeof obj.key === 'string' && obj.key.trim() ? obj.key.trim().slice(0, 10) : undefined,
    createdAt: typeof obj.createdAt === 'string' && obj.createdAt.trim() ? obj.createdAt.trim() : new Date().toISOString(),
    slug,
    content: obj.content.trim(),
    isCustom: true
  };
}

export function sanitizeSetlist(raw: unknown): Setlist | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  if (hasDangerousKey(obj)) return null;
  if (typeof obj.name !== 'string' || !obj.name.trim()) return null;
  const songSlugs = Array.isArray(obj.songSlugs)
    ? obj.songSlugs.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    : [];
  return {
    id: typeof obj.id === 'string' && obj.id.trim() ? obj.id.trim() : `setlist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: obj.name.trim().slice(0, 100),
    description: typeof obj.description === 'string' ? obj.description.trim().slice(0, 300) : undefined,
    songSlugs,
    updatedAt: typeof obj.updatedAt === 'string' && obj.updatedAt.trim() ? obj.updatedAt.trim() : new Date().toISOString()
  };
}

export function sanitizePreferences(raw: unknown): Partial<UserPreferences> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const obj = raw as Record<string, unknown>;
  if (hasDangerousKey(obj)) return {};
  const clean: Partial<UserPreferences> = {};

  if (typeof obj.theme === 'string' && VALID_THEMES.has(obj.theme)) {
    clean.theme = obj.theme as UserPreferences['theme'];
  }
  if (typeof obj.defaultInstrument === 'string' && VALID_INSTRUMENTS.has(obj.defaultInstrument)) {
    clean.defaultInstrument = obj.defaultInstrument as UserPreferences['defaultInstrument'];
  }
  if (typeof obj.fontSize === 'string' && VALID_FONT_SIZES.has(obj.fontSize)) {
    clean.fontSize = obj.fontSize as UserPreferences['fontSize'];
  }
  if (typeof obj.autoScrollSpeed === 'number' && Number.isFinite(obj.autoScrollSpeed) && obj.autoScrollSpeed >= 0.5 && obj.autoScrollSpeed <= 10.0) {
    clean.autoScrollSpeed = obj.autoScrollSpeed;
  }
  if (typeof obj.columnMode === 'string' && VALID_COLUMN_MODES.has(obj.columnMode)) {
    clean.columnMode = obj.columnMode as UserPreferences['columnMode'];
  }
  if (typeof obj.dockPosition === 'string' && VALID_DOCK_POSITIONS.has(obj.dockPosition)) {
    clean.dockPosition = obj.dockPosition as UserPreferences['dockPosition'];
  }
  if (typeof obj.metronomeVolume === 'number' && Number.isFinite(obj.metronomeVolume) && obj.metronomeVolume >= 0 && obj.metronomeVolume <= 1.0) {
    clean.metronomeVolume = obj.metronomeVolume;
  }
  return clean;
}
