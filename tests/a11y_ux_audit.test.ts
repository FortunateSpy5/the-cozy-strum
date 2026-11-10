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
    assert.ok(metronome.includes('aria-labelledby='), 'Metronome must have aria-labelledby');
    assert.ok(metronome.includes('min-w-[44px] min-h-[44px]'), 'Metronome close button must be 44px tap target');
    assert.ok(metronome.includes('useModalA11y'), 'Metronome must use modal focus trap/return');
  });

  it('verifies BackupRestoreModal dialog semantics, 44px tap targets, and focus trap', () => {
    const modal = fs.readFileSync(path.resolve('src/components/import/BackupRestoreModal.tsx'), 'utf-8');
    assert.ok(modal.includes('role="dialog"'), 'Must have role="dialog"');
    assert.ok(modal.includes('aria-modal="true"'), 'Must have aria-modal="true"');
    assert.ok(modal.includes('aria-labelledby="backup-modal-title"'), 'Must have aria-labelledby');
    assert.ok(modal.includes('aria-label="Close modal"'), 'Close button must have aria-label');
    assert.ok(modal.includes('min-w-[44px] min-h-[44px]'), 'Close button must have min 44px tap target');
    assert.ok(modal.includes('role="status"'), 'Feedback message must have role="status"');
    assert.ok(modal.includes('aria-live="polite"'), 'Feedback message must have aria-live="polite"');
    assert.ok(modal.includes('useModalA11y'), 'Must use modal a11y focus trap and escape handler');
  });

  it('verifies KeyboardShortcutsModal dialog semantics, 44px tap targets, and focus trap', () => {
    const modal = fs.readFileSync(path.resolve('src/components/player/KeyboardShortcutsModal.tsx'), 'utf-8');
    assert.ok(modal.includes('role="dialog"'), 'Must have role="dialog"');
    assert.ok(modal.includes('aria-modal="true"'), 'Must have aria-modal="true"');
    assert.ok(modal.includes('aria-labelledby="shortcuts-modal-title"'), 'Must have aria-labelledby');
    assert.ok(modal.includes('aria-label="Close shortcuts modal"'), 'Close button must have aria-label');
    assert.ok(modal.includes('min-w-[44px] min-h-[44px]'), 'Close button must have min 44px tap target');
    assert.ok(modal.includes('min-h-[44px]'), 'Got it button must have min 44px tap target');
    assert.ok(!modal.includes('min-h-[40px]'), 'No 40px buttons should remain');
    assert.ok(modal.includes('useModalA11y'), 'Must use modal a11y focus trap and escape handler');
  });

  it('verifies StickyPracticeDock has toolbar role and all buttons meet 44px tap targets', () => {
    const dock = fs.readFileSync(path.resolve('src/components/player/StickyPracticeDock.tsx'), 'utf-8');
    assert.ok(dock.includes('role="toolbar"'), 'Dock must have role="toolbar"');
    assert.ok(dock.includes('min-h-[44px]'), 'Buttons must support 44px minimum tap targets');
    assert.ok(!dock.includes('min-h-[40px]'), 'Sub-44px buttons must not exist in dock');
    assert.ok(dock.includes('focus-visible:ring-2'), 'Buttons must have visible focus rings');
  });

  it('verifies TabImporter live feedback meets WCAG AA contrast', () => {
    const importer = fs.readFileSync(path.resolve('src/components/import/TabImporterIsland.tsx'), 'utf-8');
    assert.ok(importer.includes('text-emerald-700'), 'Must use emerald-700 for high-contrast on parchment');
    assert.ok(!importer.includes('text-emerald-600'), 'Must not use low-contrast emerald-600');
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

  it('verifies index.astro hydrates PracticeDeskIsland and explore.astro hydrates ExploreDirectoryIsland', () => {
    const indexAstro = fs.readFileSync(path.resolve('src/pages/index.astro'), 'utf-8');
    assert.ok(indexAstro.includes('PracticeDeskIsland'), 'index.astro must render PracticeDeskIsland');
    assert.ok(indexAstro.includes('client:load'), 'PracticeDeskIsland must use client:load');
    assert.ok(!indexAstro.includes('client:only'), 'PracticeDeskIsland must NEVER use client:only');

    const exploreAstro = fs.readFileSync(path.resolve('src/pages/explore.astro'), 'utf-8');
    assert.ok(exploreAstro.includes('ExploreDirectoryIsland'), 'explore.astro must render ExploreDirectoryIsland');
    assert.ok(exploreAstro.includes('client:load'), 'ExploreDirectoryIsland must use client:load');
  });

  it('verifies SongHeader provides Copy Raw Tab and Edit in Quick Paste', () => {
    const header = fs.readFileSync(path.resolve('src/components/player/SongHeader.tsx'), 'utf-8');
    assert.ok(header.includes('Copy Tab / Share'), 'Must provide Copy Tab / Share');
    assert.ok(header.includes('/import?edit='), 'Must provide Edit in Quick Paste link');
  });

  it('verifies custom tab routing to /player?slug= prevents 404s', () => {
    assert.ok(fs.existsSync(path.resolve('src/pages/player.astro')), 'src/pages/player.astro must exist');
    const songCard = fs.readFileSync(path.resolve('src/components/library/SongCard.tsx'), 'utf-8');
    assert.ok(songCard.includes('/player?slug='), 'SongCard must route custom tabs to /player?slug=');
  });

  it('verifies Web Interface Guidelines compliance across layout, css, and modals', () => {
    const layout = fs.readFileSync(path.resolve('src/layouts/BaseLayout.astro'), 'utf-8');
    assert.ok(layout.includes('name="theme-color"'), 'BaseLayout must include theme-color meta tag');
    assert.ok(layout.includes('scroll-mt-6'), 'BaseLayout main tag must have scroll-mt-6');

    const css = fs.readFileSync(path.resolve('src/styles/global.css'), 'utf-8');
    assert.ok(css.includes('color-scheme: light;'), 'global.css :root must specify color-scheme: light');
    assert.ok(css.includes('color-scheme: dark;'), 'global.css html.dark must specify color-scheme: dark');
    assert.ok(css.includes('prefers-reduced-motion: reduce'), 'global.css must have prefers-reduced-motion rules');
    assert.ok(css.includes('touch-action: manipulation;'), 'global.css must have touch-action: manipulation');

    const modals = [
      fs.readFileSync(path.resolve('src/components/import/BackupRestoreModal.tsx'), 'utf-8'),
      fs.readFileSync(path.resolve('src/components/player/MetronomeModal.tsx'), 'utf-8'),
      fs.readFileSync(path.resolve('src/components/player/KeyboardShortcutsModal.tsx'), 'utf-8'),
      fs.readFileSync(path.resolve('src/components/setlists/CreateSetlistModal.tsx'), 'utf-8'),
      fs.readFileSync(path.resolve('src/components/setlists/AddSongToSetlistModal.tsx'), 'utf-8'),
    ];
    for (const m of modals) {
      assert.ok(m.includes('[overscroll-behavior:contain]'), 'Modal must declare overscroll-behavior: contain');
      assert.ok(m.includes('useModalA11y'), 'Modal must use useModalA11y for WCAG focus trap and escape handling');
    }

    const form = fs.readFileSync(path.resolve('src/components/import/MetadataForm.tsx'), 'utf-8');
    assert.ok(form.includes('min-h-[44px]'), 'MetadataForm inputs must have 44px min height');
    assert.ok(!form.includes('min-h-[40px]'), 'MetadataForm must not have 40px inputs');
    assert.ok(form.includes('autoComplete="off"'), 'MetadataForm inputs must have autoComplete="off"');
    assert.ok(form.includes('name="title"'), 'MetadataForm inputs must have name attribute');

    const renderer = fs.readFileSync(path.resolve('src/components/player/TabRenderer.tsx'), 'utf-8');
    assert.ok(renderer.includes('<button\n                        type="button"'), 'TabRenderer must use native button for chords');
    assert.ok(!renderer.includes('role="button"'), 'TabRenderer must not use span role="button"');

    const footer = fs.readFileSync(path.resolve('src/components/common/Footer.astro'), 'utf-8');
    assert.ok(footer.includes('Astro 5 & React'), 'Footer should use & instead of +');
    assert.ok(!footer.includes('min-h-[36px]'), 'Footer links must not have 36px min-height');
  });

  it('verifies unified max-w-6xl width, solid non-jitter surfaces, and mobile dock optimization', () => {
    const tabRenderer = fs.readFileSync(path.resolve('src/components/player/TabRenderer.tsx'), 'utf-8');
    assert.ok(!tabRenderer.includes('max-w-3xl'), 'TabRenderer should not constrain width to max-w-3xl');
    assert.ok(tabRenderer.includes("return 'w-full'"), 'TabRenderer single-column layout must be w-full');

    const header = fs.readFileSync(path.resolve('src/components/common/Header.astro'), 'utf-8');
    assert.ok(!header.includes('backdrop-blur'), 'Header must not use backdrop-blur to avoid scroll jitter');

    const dock = fs.readFileSync(path.resolve('src/components/player/StickyPracticeDock.tsx'), 'utf-8');
    assert.ok(!dock.includes('backdrop-blur'), 'StickyPracticeDock must not use backdrop-blur to avoid scroll jitter');
    assert.ok(dock.includes('max-w-6xl'), 'StickyPracticeDock must match navbar max-w-6xl');
    assert.ok(dock.includes('hidden md:flex'), 'StickyPracticeDock must hide desktop-only controls on mobile');

    const shortcutBar = fs.readFileSync(path.resolve('src/components/player/ShortcutLegendBar.tsx'), 'utf-8');
    assert.ok(!shortcutBar.includes('backdrop-blur'), 'ShortcutLegendBar must not use backdrop-blur');
    assert.ok(shortcutBar.includes('max-w-6xl'), 'ShortcutLegendBar must match navbar max-w-6xl');

    const css = fs.readFileSync(path.resolve('src/styles/global.css'), 'utf-8');
    assert.ok(css.includes('overflow-x: hidden;'), 'global.css must prevent horizontal viewport overflow');
  });

  it('verifies SetlistCard and Setlist modals keyboard accessibility and 40px+ tap targets', () => {
    const card = fs.readFileSync(path.resolve('src/components/setlists/SetlistCard.tsx'), 'utf-8');
    assert.ok(card.includes('role="button"'), 'SetlistCard must declare role="button"');
    assert.ok(card.includes('tabIndex={0}'), 'SetlistCard must have tabIndex={0} for keyboard focus');
    assert.ok(card.includes("e.key === 'Enter'"), 'SetlistCard must support Enter key selection');
    assert.ok(card.includes('focus-visible:ring-2'), 'SetlistCard must have visible focus rings');

    const addModal = fs.readFileSync(path.resolve('src/components/setlists/AddSongToSetlistModal.tsx'), 'utf-8');
    assert.ok(addModal.includes('aria-label='), 'AddSongToSetlistModal input must have aria-label');

    const songCard = fs.readFileSync(path.resolve('src/components/library/SongCard.tsx'), 'utf-8');
    assert.ok(songCard.includes('min-h-[40px]'), 'SongCard favorite button must meet 40px minimum target');
    assert.ok(!songCard.includes('min-h-[36px]'), 'SongCard must not use 36px buttons');
  });

  it('verifies Phase 3 accessibility compliance across submit, dmca, and modal components', () => {
    // 1. dmca.astro does not contain nested <main>
    const dmca = fs.readFileSync(path.resolve('src/pages/dmca.astro'), 'utf-8');
    assert.ok(!dmca.includes('<main'), 'dmca.astro must not nest a <main> tag inside BaseLayout');
    assert.ok(dmca.includes('min-h-[44px]'), 'dmca.astro links must have min 44px touch targets');
    assert.ok(dmca.includes('<ol'), 'dmca.astro must use semantic <ol> for numbered takedown items');

    // 2. SongHeader DMCA link meets touch target and contrast rules
    const header = fs.readFileSync(path.resolve('src/components/player/SongHeader.tsx'), 'utf-8');
    assert.ok(header.includes('/dmca?tabId='), 'SongHeader must have DMCA link');
    assert.ok(!header.includes('text-walnut/70'), 'DMCA link must not use low-contrast text-walnut/70');
    assert.ok(header.includes('focus-visible:ring-2'), 'DMCA link must have focus ring');

    // 3. UserDropdownContent 44px touch targets and role="menu"
    const dropdown = fs.readFileSync(path.resolve('src/components/auth/UserDropdownContent.tsx'), 'utf-8');
    assert.ok(dropdown.includes('role="menu"'), 'UserDropdownContent must declare role="menu"');
    assert.ok(dropdown.includes('min-h-[44px]'), 'UserDropdownContent items must meet 44px min-height');
    assert.ok(dropdown.includes('focus-visible:ring-2'), 'UserDropdownContent items must have focus rings');

    // 4. LrclibSearchModal 44px touch targets and modal a11y
    const lrclib = fs.readFileSync(path.resolve('src/components/submit/LrclibSearchModal.tsx'), 'utf-8');
    assert.ok(lrclib.includes('useModalA11y'), 'LrclibSearchModal must use useModalA11y');
    assert.ok(lrclib.includes('[overscroll-behavior:contain]'), 'LrclibSearchModal must contain overscroll');
    assert.ok(!lrclib.includes('min-h-[40px]'), 'LrclibSearchModal must not retain 40px touch targets');
    assert.ok(lrclib.includes('min-h-[44px]'), 'LrclibSearchModal must use 44px touch targets');

    // 5. CategorySelector & VisibilitySelector group semantics and aria attributes
    const catSel = fs.readFileSync(path.resolve('src/components/submit/CategorySelector.tsx'), 'utf-8');
    assert.ok(catSel.includes('role="group"'), 'CategorySelector must declare role="group"');
    assert.ok(catSel.includes('aria-pressed='), 'CategorySelector must use aria-pressed');

    const visSel = fs.readFileSync(path.resolve('src/components/submit/VisibilitySelector.tsx'), 'utf-8');
    assert.ok(visSel.includes('role="radiogroup"'), 'VisibilitySelector must declare role="radiogroup"');
  });
});
