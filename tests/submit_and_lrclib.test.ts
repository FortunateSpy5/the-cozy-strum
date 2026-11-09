import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { formatLyricsForChords } from '../src/lib/lyrics/lrclibService';
import { SONG_CATEGORIES } from '../src/lib/types';
import { parseSongText } from '../src/lib/parser/songParser';

describe('Phase 3: Community Submission Studio & LRCLIB Lyrics Fetcher', () => {
  it('formats raw plain lyrics by inserting blank chord lines above lyrics and preserving section markers', () => {
    const rawLyrics = `[Verse 1]
Wise men say
Only fools rush in
[Chorus]
Can't help falling in love with you`;

    const formatted = formatLyricsForChords(rawLyrics);
    const lines = formatted.split('\n');

    // Section header should not have extra blank line immediately after it if handled properly
    assert.ok(lines.includes('[Verse 1]'));
    assert.ok(lines.includes('[Chorus]'));

    // Check that there is a blank line before "Wise men say"
    const wiseMenIndex = lines.indexOf('Wise men say');
    assert.ok(wiseMenIndex > 0);
    assert.equal(lines[wiseMenIndex - 1], '', 'Must have a blank line above lyric line for chords');

    const onlyFoolsIndex = lines.indexOf('Only fools rush in');
    assert.ok(onlyFoolsIndex > 0);
    assert.equal(lines[onlyFoolsIndex - 1], '', 'Must have a blank line above lyric line for chords');
  });

  it('validates song parser extracts unique chords from formatted submission lyrics', () => {
    const sample = `[Verse 1]
C        G       Am
Wise men say
F    C     G
Only fools rush in`;

    const ast = parseSongText(sample);
    assert.ok(ast.uniqueChords.includes('C'));
    assert.ok(ast.uniqueChords.includes('G'));
    assert.ok(ast.uniqueChords.includes('Am'));
    assert.ok(ast.uniqueChords.includes('F'));
    assert.equal(ast.uniqueChords.length, 4);
  });

  it('validates clean predefined SONG_CATEGORIES contains no compound ampersand names', () => {
    assert.equal(SONG_CATEGORIES.length, 25);
    for (const cat of SONG_CATEGORIES) {
      if (cat !== 'R&B') {
        assert.ok(!cat.includes('&'), `Category "${cat}" must not contain compound '&'`);
      }
    }
  });

  it('verifies all Phase 3 components and services remain strictly under 200 lines', () => {
    const phase3Files = [
      'src/lib/lyrics/lrclibService.ts',
      'src/lib/firebase/submitService.ts',
      'src/components/submit/CategorySelector.tsx',
      'src/components/submit/VisibilitySelector.tsx',
      'src/components/submit/MusicalTuningFields.tsx',
      'src/components/submit/SubmissionMetadataFields.tsx',
      'src/components/submit/SubmissionAuthGuard.tsx',
      'src/components/submit/SubmissionSuccessView.tsx',
      'src/components/submit/LrclibResultItem.tsx',
      'src/components/submit/LrclibSearchForm.tsx',
      'src/components/submit/LrclibSearchModal.tsx',
      'src/components/submit/SongSubmissionIsland.tsx',
      'src/pages/submit.astro',
      'src/pages/dmca.astro',
    ];

    for (const relPath of phase3Files) {
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

  it('verifies /submit and /dmca pages exist with proper layout integration', () => {
    const submitPath = path.resolve('src/pages/submit.astro');
    assert.ok(fs.existsSync(submitPath), 'src/pages/submit.astro must exist');
    const submitContent = fs.readFileSync(submitPath, 'utf-8');
    assert.ok(submitContent.includes('SongSubmissionIsland'), 'Must import SongSubmissionIsland');
    assert.ok(submitContent.includes('client:load'), 'Must hydrate with client:load');

    const dmcaPath = path.resolve('src/pages/dmca.astro');
    assert.ok(fs.existsSync(dmcaPath), 'src/pages/dmca.astro must exist');
    const dmcaContent = fs.readFileSync(dmcaPath, 'utf-8');
    assert.ok(dmcaContent.includes('BaseLayout'), 'Must use BaseLayout');
    assert.ok(dmcaContent.includes('dmca-mailto-link'), 'Must have DMCA mailto link');
  });
});
