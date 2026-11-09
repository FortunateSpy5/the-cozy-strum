import type { UserTab, Setlist, UserPreferences } from '../types';
import {
  getUserTabs,
  saveUserTab,
  getSetlists,
  saveSetlist,
  getUserPrefs,
  saveUserPrefs
} from './tabStorage';
import { generateMarkdownWithFrontmatter } from './exportMd';
import { createZipUint8Array, downloadBlob, type ZipFileInput } from './zipExport';
import {
  type BackupPayload,
  parseBackupJson,
  sanitizeUserTab,
  sanitizeSetlist,
  sanitizePreferences,
  sanitizeZipSlug
} from './backupValidation';

export type { BackupPayload };
export { parseBackupJson };

export function createBackupJson(
  tabs: UserTab[],
  setlists: Setlist[] = [],
  preferences?: Partial<UserPreferences>
): string {
  const payload: BackupPayload = {
    app: 'the-cozy-strum',
    version: 1,
    exportedAt: new Date().toISOString(),
    totalTabs: tabs.length,
    tabs,
    setlists,
    preferences
  };
  return JSON.stringify(payload, null, 2);
}

export function exportAllTabsAsJson(): { count: number; filename: string } {
  const tabs = getUserTabs();
  const setlists = getSetlists();
  const prefs = getUserPrefs();
  const jsonContent = createBackupJson(tabs, setlists, prefs);
  const dateStr = new Date().toISOString().split('T')[0] ?? 'backup';
  const filename = `cozy-strum-backup-${dateStr}.json`;

  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  downloadBlob(filename, blob);

  return { count: tabs.length, filename };
}

export function exportAllTabsAsZip(): { count: number; filename: string } {
  const tabs = getUserTabs();
  const setlists = getSetlists();
  const prefs = getUserPrefs();
  const dateStr = new Date().toISOString().split('T')[0] ?? 'backup';
  const filename = `cozy-strum-tabs-${dateStr}.zip`;

  const files: ZipFileInput[] = [];

  // 1. Full JSON backup snapshot inside ZIP
  files.push({
    name: 'backup.json',
    content: createBackupJson(tabs, setlists, prefs)
  });

  // 2. Individual formatted Markdown files for each tab
  for (const tab of tabs) {
    const md = generateMarkdownWithFrontmatter(tab, tab.content);
    const safeSlug = sanitizeZipSlug(tab.slug || tab.title);
    files.push({
      name: `tabs/${safeSlug}.md`,
      content: md
    });
  }

  // 3. Helpful README
  files.push({
    name: 'README.txt',
    content: `The Cozy Strum - Tab Backup Archive
Exported: ${new Date().toLocaleString()}
Total Saved Tabs: ${tabs.length}

Contents:
- /tabs/*.md: Markdown files ready to drop into src/content/tabs/
- backup.json: Full database snapshot for 1-click restore in the Import Studio.
`
  });

  const zipBytes = createZipUint8Array(files);
  const blob = new Blob([zipBytes.buffer as ArrayBuffer], { type: 'application/zip' });
  downloadBlob(filename, blob);

  return { count: tabs.length, filename };
}

export function restoreTabsFromJson(jsonString: string): {
  success: boolean;
  count: number;
  error?: string;
} {
  try {
    const data = parseBackupJson(jsonString);
    let importedCount = 0;
    let quotaErrorEncountered = false;

    for (const rawTab of data.tabs) {
      const cleanTab = sanitizeUserTab(rawTab);
      if (cleanTab) {
        const saved = saveUserTab(cleanTab);
        if (saved) {
          importedCount++;
        } else {
          quotaErrorEncountered = true;
        }
      }
    }

    if (Array.isArray(data.setlists)) {
      for (const rawSetlist of data.setlists) {
        const cleanSetlist = sanitizeSetlist(rawSetlist);
        if (cleanSetlist) {
          saveSetlist(cleanSetlist);
        }
      }
    }

    if (data.preferences) {
      const cleanPrefs = sanitizePreferences(data.preferences);
      if (Object.keys(cleanPrefs).length > 0) {
        saveUserPrefs(cleanPrefs);
      }
    }

    if (quotaErrorEncountered && importedCount === 0) {
      return {
        success: false,
        count: 0,
        error: 'LocalStorage quota exceeded. Please free up browser storage space.'
      };
    }

    return { success: true, count: importedCount };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown parsing error';
    return { success: false, count: 0, error: msg };
  }
}
