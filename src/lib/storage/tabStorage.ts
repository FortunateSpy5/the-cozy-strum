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
  autoScrollSpeed: 1.0,
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

function safeSetItem<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') return true;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`Failed to save to localStorage (${key}):`, err);
    return false;
  }
}

export function getUserTabs(): UserTab[] {
  const tabs = safeGetItem<UserTab[]>(STORAGE_KEYS.TABS, []);
  return Array.isArray(tabs) ? tabs : [];
}

export function saveUserTab(tab: UserTab): boolean {
  const tabs = getUserTabs();
  const existingIndex = tabs.findIndex(
    (t) => t.id === tab.id || (Boolean(tab.slug) && t.slug === tab.slug)
  );
  if (existingIndex >= 0) {
    tabs[existingIndex] = tab;
  } else {
    tabs.unshift(tab);
  }
  return safeSetItem(STORAGE_KEYS.TABS, tabs);
}

export function deleteUserTab(id: string): boolean {
  const tabs = getUserTabs().filter((t) => t.id !== id);
  return safeSetItem(STORAGE_KEYS.TABS, tabs);
}

export function getUserTabBySlug(slug: string): UserTab | null {
  if (!slug) return null;
  const tabs = getUserTabs();
  return tabs.find((t) => t.slug === slug) ?? null;
}

export function getUserPrefs(): UserPreferences {
  const saved = safeGetItem<Partial<UserPreferences>>(STORAGE_KEYS.PREFS, {});
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) {
    return { ...DEFAULT_PREFS };
  }
  return { ...DEFAULT_PREFS, ...saved };
}

export function saveUserPrefs(partial: Partial<UserPreferences>): boolean {
  const current = getUserPrefs();
  const safeEntries = Object.entries(partial).filter(
    ([key]) => key !== '__proto__' && key !== 'constructor' && key !== 'prototype'
  );
  const cleanPartial = Object.fromEntries(safeEntries) as Partial<UserPreferences>;
  return safeSetItem(STORAGE_KEYS.PREFS, { ...current, ...cleanPartial });
}

export function getSetlists(): Setlist[] {
  const lists = safeGetItem<Setlist[]>(STORAGE_KEYS.SETLISTS, []);
  return Array.isArray(lists) ? lists : [];
}

export function saveSetlist(setlist: Setlist): boolean {
  const lists = getSetlists();
  const idx = lists.findIndex((s) => s.id === setlist.id);
  if (idx >= 0) {
    lists[idx] = setlist;
  } else {
    lists.push(setlist);
  }
  return safeSetItem(STORAGE_KEYS.SETLISTS, lists);
}
