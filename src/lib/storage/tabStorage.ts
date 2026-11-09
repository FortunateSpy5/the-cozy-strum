import type { UserTab, UserPreferences, Setlist } from '../types';

const STORAGE_KEYS = {
  TABS: 'cozy_strum_custom_tabs',
  PREFS: 'cozy_strum_prefs',
  SETLISTS: 'cozy_strum_setlists'
} as const;

export const DEFAULT_PREFS: UserPreferences = {
  theme: 'parchment',
  defaultInstrument: 'guitar',
  fontSize: 'base',
  autoScrollSpeed: 2.0,
  columnMode: 'single',
  dockPosition: 'bottom',
  metronomeVolume: 0.8
};

function safeGetItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeSetItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to save to localStorage (${key}):`, err);
  }
}

export function getUserTabs(): UserTab[] {
  return safeGetItem<UserTab[]>(STORAGE_KEYS.TABS, []);
}

export function saveUserTab(tab: UserTab): void {
  const tabs = getUserTabs();
  const existingIndex = tabs.findIndex((t) => t.id === tab.id || t.slug === tab.slug);
  if (existingIndex >= 0) {
    tabs[existingIndex] = tab;
  } else {
    tabs.unshift(tab);
  }
  safeSetItem(STORAGE_KEYS.TABS, tabs);
}

export function deleteUserTab(id: string): void {
  const tabs = getUserTabs().filter((t) => t.id !== id);
  safeSetItem(STORAGE_KEYS.TABS, tabs);
}

export function getUserTabBySlug(slug: string): UserTab | null {
  const tabs = getUserTabs();
  return tabs.find((t) => t.slug === slug) ?? null;
}

export function getUserPrefs(): UserPreferences {
  return { ...DEFAULT_PREFS, ...safeGetItem<Partial<UserPreferences>>(STORAGE_KEYS.PREFS, {}) };
}

export function saveUserPrefs(partial: Partial<UserPreferences>): void {
  const current = getUserPrefs();
  safeSetItem(STORAGE_KEYS.PREFS, { ...current, ...partial });
}

export function getSetlists(): Setlist[] {
  return safeGetItem<Setlist[]>(STORAGE_KEYS.SETLISTS, []);
}

export function saveSetlist(setlist: Setlist): void {
  const lists = getSetlists();
  const idx = lists.findIndex((s) => s.id === setlist.id);
  if (idx >= 0) {
    lists[idx] = setlist;
  } else {
    lists.push(setlist);
  }
  safeSetItem(STORAGE_KEYS.SETLISTS, lists);
}
