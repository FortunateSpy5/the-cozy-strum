import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Accessibility & UX Verification', () => {
  it('verifies all files in src/components and src/layouts are strictly under 200 lines', () => {
    function getFiles(dir: string): string[] {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const full = path.join(dir, file);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          results = results.concat(getFiles(full));
        } else {
          results.push(full);
        }
      }
      return results;
    }

    const componentFiles = getFiles(path.resolve('src/components'));
    const layoutFiles = getFiles(path.resolve('src/layouts'));
    const allFiles = [...componentFiles, ...layoutFiles];

    for (const filePath of allFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lineCount = content.split('\n').length;
      assert.ok(
        lineCount <= 200,
        `File ${path.basename(filePath)} has ${lineCount} lines, which exceeds the strict 200-line modularity limit!`
      );
    }
  });

  it('verifies BaseLayout includes a skip link', () => {
    const layout = fs.readFileSync(path.resolve('src/layouts/BaseLayout.astro'), 'utf-8');
    assert.ok(layout.includes('Skip to main content'), 'BaseLayout must include skip to main content link');
    assert.ok(layout.includes('id="main-content"'), 'Main tag must have id="main-content"');
  });

  it('verifies SongCard does not nest buttons inside an anchor tag', () => {
    const songCard = fs.readFileSync(path.resolve('src/components/library/SongCard.tsx'), 'utf-8');
    assert.ok(songCard.includes('<article'), 'SongCard should use semantic <article> container');
    assert.ok(!songCard.includes('<a\n      href={tabUrl}\n      className="group'), 'SongCard outer container must not be an <a>');
    assert.ok(songCard.includes('aria-label='), 'SongCard buttons must have aria-label');
  });

  it('verifies MetronomeModal dialog semantics and keyboard accessibility', () => {
    const metronome = fs.readFileSync(path.resolve('src/components/player/MetronomeModal.tsx'), 'utf-8');
    assert.ok(metronome.includes('role="dialog"'), 'Metronome must have role="dialog"');
    assert.ok(metronome.includes('aria-modal="true"'), 'Metronome must have aria-modal="true"');
    assert.ok(metronome.includes('role="status"'), 'Beat indicator must have role="status"');
    assert.ok(metronome.includes('Escape'), 'Metronome must listen for Escape key');
  });

  it('verifies StickyPracticeDock has toolbar role and min-h/min-w 44px tap targets', () => {
    const dock = fs.readFileSync(path.resolve('src/components/player/StickyPracticeDock.tsx'), 'utf-8');
    assert.ok(dock.includes('role="toolbar"'), 'Dock must have role="toolbar"');
    assert.ok(dock.includes('min-h-[44px]'), 'Buttons must support 44px minimum tap targets');
    assert.ok(dock.includes('focus-visible:ring-2'), 'Buttons must have visible focus rings');
  });

  it('verifies ChordDiagramSvg provides descriptive accessible text for screen readers', () => {
    const chordSvg = fs.readFileSync(path.resolve('src/components/player/ChordDiagramSvg.tsx'), 'utf-8');
    assert.ok(chordSvg.includes('role="img"'), 'Chord diagram SVG must have role="img"');
    assert.ok(chordSvg.includes('<desc>'), 'Chord diagram SVG must have <desc> tag');
  });

  it('verifies TabPlayer shortcuts ignore typing and modifier keys', () => {
    const shortcutsFile = fs.existsSync(path.resolve('src/components/player/usePlayerShortcuts.ts'))
      ? fs.readFileSync(path.resolve('src/components/player/usePlayerShortcuts.ts'), 'utf-8')
      : fs.readFileSync(path.resolve('src/components/player/TabPlayerIsland.tsx'), 'utf-8');

    assert.ok(
      shortcutsFile.includes("target.tagName === 'INPUT'") || shortcutsFile.includes("el.tagName === 'INPUT'"),
      'Must ignore INPUT tags'
    );
    assert.ok(shortcutsFile.includes('isContentEditable'), 'Must ignore contenteditable');
    assert.ok(shortcutsFile.includes('ctrlKey'), 'Must ignore shortcuts when ctrlKey or metaKey is pressed');
  });
});
