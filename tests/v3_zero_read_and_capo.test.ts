import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { recommendCapo, isBarreChord, countBarreChords } from '../src/lib/music/capoOptimizer';
import { filterSongDirectory, difficultyLabel } from '../src/lib/firebase/songDirectoryService';
import type { CompactSongEntry, SongDirectoryDoc } from '../src/lib/firebase/types';
import rawFallbackDirectory from '../src/lib/firebase/songDirectoryFallback.json';

describe('v3.1 Zero-Read Architecture & Smart Capo Optimizer', () => {
  it('identifies barre chords vs open shapes accurately', () => {
    assert.strictEqual(isBarreChord('C'), false);
    assert.strictEqual(isBarreChord('G'), false);
    assert.strictEqual(isBarreChord('Em'), false);
    assert.strictEqual(isBarreChord('Am'), false);
    assert.strictEqual(isBarreChord('D'), false);

    assert.strictEqual(isBarreChord('F'), true);
    assert.strictEqual(isBarreChord('F#m'), true);
    assert.strictEqual(isBarreChord('Bb'), true);
    assert.strictEqual(isBarreChord('Bbm'), true);
    assert.strictEqual(isBarreChord('G#m'), true);
    assert.strictEqual(isBarreChord('C#m'), true);
    assert.strictEqual(isBarreChord('Gm'), true);
  });

  it('calculates total barre chords count for a progression', () => {
    const chords = ['Bb', 'F', 'Gm', 'Eb']; // 4 barre chords
    assert.strictEqual(countBarreChords(chords), 4);
  });

  it('recommends optimal capo fret to replace difficult barre shapes with open shapes', () => {
    // Bb, F, Gm, Eb with Capo 3 -> G, D, Em, C (0 barres!)
    const rec = recommendCapo(['Bb', 'F', 'Gm', 'Eb']);
    assert.ok(rec, 'Must produce a recommendation');
    assert.strictEqual(rec.recommendedCapo, 3);
    assert.strictEqual(rec.optimizedBarreCount, 0);
    assert.strictEqual(rec.simplifiedChords.join(' '), 'G D Em C');
    assert.ok(rec.reason.includes('Capo 3'));
  });

  it('returns null if song already uses 0 barre shapes', () => {
    const rec = recommendCapo(['C', 'G', 'Am', 'Em'], 0);
    assert.strictEqual(rec, null);
  });

  it('filters compact song directory by search query, instrument, and fingerstyle', () => {
    const mockSongs: CompactSongEntry[] = [
      { i: '1', t: 'Wonderwall', a: 'Oasis', ins: 'g', d: 1, u: 1700000000 },
      { i: '2', t: 'Riptide', a: 'Vance Joy', ins: 'u', d: 1, u: 1700000000 },
      { i: '3', t: 'Dust in the Wind', a: 'Kansas', ins: 'g', d: 2, f: 1, u: 1700000000 },
    ];

    const searchOasis = filterSongDirectory(mockSongs, 'oasis', 'all', false);
    assert.strictEqual(searchOasis.length, 1);
    assert.strictEqual(searchOasis[0]?.t, 'Wonderwall');

    const ukeOnly = filterSongDirectory(mockSongs, '', 'ukulele', false);
    assert.strictEqual(ukeOnly.length, 1);
    assert.strictEqual(ukeOnly[0]?.t, 'Riptide');

    const fingerstyleOnly = filterSongDirectory(mockSongs, '', 'all', true);
    assert.strictEqual(fingerstyleOnly.length, 1);
    assert.strictEqual(fingerstyleOnly[0]?.t, 'Dust in the Wind');
  });

  it('validates difficulty label formatter', () => {
    assert.strictEqual(difficultyLabel(1), 'Beginner');
    assert.strictEqual(difficultyLabel(2), 'Intermediate');
    assert.strictEqual(difficultyLabel(3), 'Advanced');
  });

  it('verifies fallback directory contains valid compact entries without heavy lyrics', () => {
    const directory = rawFallbackDirectory as SongDirectoryDoc;
    assert.ok(directory.songs.length >= 240, 'Must have at least 240 songs');
    for (const song of directory.songs) {
      assert.ok(song.i, 'Must have ID');
      assert.ok(song.t, 'Must have title');
      assert.ok(song.a, 'Must have artist');
      assert.ok(song.ins === 'g' || song.ins === 'u', 'Instrument must be g or u');
      assert.ok(song.d === 1 || song.d === 2 || song.d === 3, 'Difficulty must be 1, 2, or 3');
      assert.strictEqual((song as unknown as { content?: string }).content, undefined, 'Must NOT contain heavy content');
    }
  });

  it('verifies all newly created v3.1 files are strictly under 200 lines', () => {
    const newFiles = [
      'docs/ZERO_READ_UX_PLAN.md',
      'src/components/explore/ExploreDirectoryIsland.tsx',
      'src/components/explore/ExploreFilterBar.tsx',
      'src/components/home/PracticeDeskIsland.tsx',
      'src/components/home/PracticeSearchInput.tsx',
      'src/components/home/RecentSongsGrid.tsx',
      'src/components/home/PracticeHubCards.tsx',
      'src/components/player/SectionJumpBar.tsx',
      'src/components/player/SmartCapoBanner.tsx',
      'src/components/player/AutoScrollCountInOverlay.tsx',
      'src/components/player/useAutoScrollCountIn.ts',
      'src/lib/music/capoOptimizer.ts',
      'src/lib/firebase/songDirectoryService.ts',
      'src/lib/storage/recentSongsStorage.ts',
      'src/pages/explore.astro',
      'src/components/common/Footer.astro',
    ];

    for (const relPath of newFiles) {
      const fullPath = path.resolve(relPath);
      assert.ok(fs.existsSync(fullPath), `File must exist: ${relPath}`);
      if (relPath.endsWith('.ts') || relPath.endsWith('.tsx') || relPath.endsWith('.astro')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lineCount = content.split('\n').length;
        assert.ok(lineCount <= 200, `File ${relPath} has ${lineCount} lines (must be <= 200)`);
      }
    }
  });
});
