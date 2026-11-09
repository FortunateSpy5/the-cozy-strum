import React, { useState, useMemo } from 'react';
import type { SongMetadata, Instrument } from '../../lib/types';
import { parseSongText } from '../../lib/parser/songParser';
import { transposeChord } from '../../lib/music/transpose';
import { SongHeader } from './SongHeader';
import { ChordStrip } from './ChordStrip';
import { TabRenderer } from './TabRenderer';
import { StickyPracticeDock } from './StickyPracticeDock';
import { MetronomeModal } from './MetronomeModal';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { ShortcutLegendBar } from './ShortcutLegendBar';
import { useAutoScroller } from './useAutoScroller';
import { usePlayerShortcuts } from './usePlayerShortcuts';
import { useWakeLock } from './useWakeLock';
import { usePerSongPracticeMemory } from './usePerSongPracticeMemory';
import { SetlistGigDock } from './SetlistGigDock';

interface TabPlayerIslandProps {
  metadata: SongMetadata;
  rawTabContent: string;
}

export const TabPlayerIsland: React.FC<TabPlayerIslandProps> = ({ metadata, rawTabContent }) => {
  const [semitones, setSemitones] = useState(0);
  const [instrument, setInstrument] = useState<Instrument>(metadata.instrument);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [columnMode, setColumnMode] = useState<'single' | 'two-column' | 'three-column'>('single');
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1.0);
  const [activeChord, setActiveChord] = useState<string | null>(null);
  const [isMetronomeOpen, setIsMetronomeOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const tabId = metadata.slug ?? '';

  const { isFavorited, isSavingPrefs, toggleFavorite } = usePerSongPracticeMemory({
    tabId,
    currentSemitones: semitones,
    currentSpeed: scrollSpeed,
    currentInstrument: instrument,
    onRestorePreferences: (prefs) => {
      if (typeof prefs.transpose === 'number') setSemitones(prefs.transpose);
      if (typeof prefs.scrollSpeed === 'number') setScrollSpeed(prefs.scrollSpeed);
      if (prefs.instrumentView) setInstrument(prefs.instrumentView);
    },
  });

  const ast = useMemo(() => parseSongText(rawTabContent), [rawTabContent]);
  const currentKey = useMemo(() => {
    return metadata.key ? transposeChord(metadata.key, semitones) : undefined;
  }, [metadata.key, semitones]);

  // RequestAnimationFrame Auto-Scroller hook with bottom detection
  useAutoScroller(isScrolling, scrollSpeed, () => setIsScrolling(false));

  // Screen Wake Lock hook: keeps phone/laptop display awake during practice
  const { isSupported: isWakeSupported, isActive: isWakeActive, toggleWakeLock } = useWakeLock(true);

  // Global Keyboard Shortcuts hook
  usePlayerShortcuts({
    onToggleScroll: () => setIsScrolling((prev) => !prev),
    onAdjustSpeed: (delta) => setScrollSpeed((prev) => Math.max(0.5, Math.min(10.0, prev + delta))),
    onTranspose: (delta) => setSemitones((prev) => Math.max(-11, Math.min(11, prev + delta))),
    onResetTranspose: () => setSemitones(0),
    onToggleColumns: () => setColumnMode((prev) => (prev === 'single' ? 'two-column' : 'single')),
    onToggleInstrument: () => setInstrument((prev) => (prev === 'guitar' ? 'ukulele' : 'guitar')),
    onToggleMetronome: () => setIsMetronomeOpen((prev) => !prev),
    onToggleShortcuts: () => setIsShortcutsOpen((prev) => !prev),
    onCloseModals: () => {
      setIsMetronomeOpen(false);
      setIsShortcutsOpen(false);
    },
    hasActiveModal: isMetronomeOpen || isShortcutsOpen
  });

  return (
    <div className="tab-player-container relative min-h-screen">
      <SetlistGigDock currentTabId={tabId} />
      <SongHeader
        metadata={metadata}
        currentKey={currentKey}
        transposedSemitones={semitones}
        rawTabContent={rawTabContent}
        isFavorited={isFavorited}
        isSavingPrefs={isSavingPrefs}
        onToggleFavorite={toggleFavorite}
      />

      <ChordStrip
        uniqueChords={ast.uniqueChords}
        semitones={semitones}
        instrument={instrument}
        activeChord={activeChord}
      />

      <TabRenderer
        lines={ast.lines}
        semitones={semitones}
        fontSize={fontSize}
        columnMode={columnMode}
        onChordClick={(chord) => setActiveChord(chord)}
      />

      {/* Floating subtle keyboard shortcut reference & wake lock */}
      <div className="fixed bottom-20 left-0 right-0 z-30 max-w-6xl mx-auto px-4 sm:px-6 pointer-events-none">
        <div className="pointer-events-auto">
          <ShortcutLegendBar
            isWakeLockActive={isWakeActive}
            isWakeLockSupported={isWakeSupported}
            onToggleWakeLock={toggleWakeLock}
            onOpenShortcutsModal={() => setIsShortcutsOpen(true)}
          />
        </div>
      </div>

      <StickyPracticeDock
        isScrolling={isScrolling}
        scrollSpeed={scrollSpeed}
        semitones={semitones}
        columnMode={columnMode}
        fontSize={fontSize}
        instrument={instrument}
        onToggleScroll={() => setIsScrolling((prev) => !prev)}
        onChangeSpeed={(delta) => setScrollSpeed((prev) => Math.max(0.5, Math.min(10, prev + delta)))}
        onTranspose={(delta) => setSemitones((prev) => Math.max(-11, Math.min(11, prev + delta)))}
        onResetTranspose={() => setSemitones(0)}
        onToggleColumns={() => setColumnMode((prev) => (prev === 'single' ? 'two-column' : 'single'))}
        onChangeFontSize={(larger) => {
          const sizes: ('sm' | 'base' | 'lg' | 'xl')[] = ['sm', 'base', 'lg', 'xl'];
          const idx = sizes.indexOf(fontSize);
          setFontSize(sizes[larger ? Math.min(sizes.length - 1, idx + 1) : Math.max(0, idx - 1)] ?? 'base');
        }}
        onToggleInstrument={() => setInstrument((prev) => (prev === 'guitar' ? 'ukulele' : 'guitar'))}
        onOpenMetronome={() => setIsMetronomeOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {isMetronomeOpen && (
        <MetronomeModal
          initialBpm={metadata.bpm ?? 100}
          strummingPattern={metadata.strummingPattern}
          onClose={() => setIsMetronomeOpen(false)}
        />
      )}

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
};
