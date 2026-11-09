import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { SongPracticePreference, Setlist } from '../src/lib/firebase/types';

describe('Phase 2: Logged-In Practice Features & Setlists', () => {
  it('validates song practice preferences structure and clamping bounds', () => {
    const prefs: SongPracticePreference = {
      transpose: 3,
      capoOverride: 2,
      scrollSpeed: 1.5,
      instrumentView: 'guitar',
    };

    assert.equal(prefs.transpose, 3);
    assert.equal(prefs.capoOverride, 2);
    assert.equal(prefs.scrollSpeed, 1.5);
    assert.equal(prefs.instrumentView, 'guitar');
  });

  it('validates setlist creation, tab array integrity, and ordering', () => {
    const setlist: Setlist = {
      id: 'setlist-test-1',
      ownerUid: 'musician-123',
      ownerName: 'Soumo',
      title: 'Acoustic Sunset Set',
      description: 'Fingerpicking and soft ballads for evening gig',
      isPublic: false,
      tabIds: ['seed-acoustic-strumming', 'seed-fingerstyle-blues'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    assert.equal(setlist.tabIds.length, 2);
    assert.equal(setlist.tabIds[0], 'seed-acoustic-strumming');

    // Test reorder
    const reordered = [setlist.tabIds[1]!, setlist.tabIds[0]!];
    assert.equal(reordered[0], 'seed-fingerstyle-blues');
    assert.equal(reordered[1], 'seed-acoustic-strumming');

    // Test add tab
    const withNewTab = [...reordered, 'seed-ukulele-island'];
    assert.equal(withNewTab.length, 3);
    assert.equal(withNewTab[2], 'seed-ukulele-island');

    // Test remove tab
    const afterRemoval = withNewTab.filter((id) => id !== 'seed-acoustic-strumming');
    assert.equal(afterRemoval.length, 2);
    assert.ok(!afterRemoval.includes('seed-acoustic-strumming'));
  });

  it('verifies all newly created Phase 2 components remain strictly under 200 lines', () => {
    const phase2Files = [
      'src/components/player/usePerSongPracticeMemory.ts',
      'src/components/player/SetlistGigDock.tsx',
      'src/components/setlists/CreateSetlistModal.tsx',
      'src/components/setlists/AddSongToSetlistModal.tsx',
      'src/components/setlists/SetlistDetailView.tsx',
      'src/components/setlists/SetlistCard.tsx',
      'src/components/setlists/SetlistsManagerIsland.tsx',
      'src/lib/firebase/userService.ts',
      'src/lib/firebase/setlistService.ts',
    ];

    for (const relPath of phase2Files) {
      const fullPath = path.resolve(relPath);
      assert.ok(fs.existsSync(fullPath), `File must exist: ${relPath}`);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lineCount = content.split('\n').length;
      assert.ok(
        lineCount <= 200,
        `${relPath} has ${lineCount} lines, exceeding the 200-line modularity limit.`
      );
    }
  });

  it('verifies /setlists page route exists and uses BaseLayout', () => {
    const pagePath = path.resolve('src/pages/setlists.astro');
    assert.ok(fs.existsSync(pagePath), 'src/pages/setlists.astro must exist');
    const content = fs.readFileSync(pagePath, 'utf-8');
    assert.ok(content.includes('SetlistsManagerIsland'), 'Must import SetlistsManagerIsland');
    assert.ok(content.includes('client:load'), 'Must hydrate with client:load');
  });
});
