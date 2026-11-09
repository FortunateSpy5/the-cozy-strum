import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { SongMetadata, Instrument } from '../../lib/types';
import { parseSongText } from '../../lib/parser/songParser';
import { transposeChord } from '../../lib/music/transpose';
import { SongHeader } from './SongHeader';
import { ChordStrip } from './ChordStrip';
import { TabRenderer } from './TabRenderer';
import { StickyPracticeDock } from './StickyPracticeDock';
import { MetronomeModal } from './MetronomeModal';

interface TabPlayerIslandProps {
  metadata: SongMetadata;
  rawTabContent: string;
}

export const TabPlayerIsland: React.FC<TabPlayerIslandProps> = ({
  metadata,
  rawTabContent
}) => {
  const [semitones, setSemitones] = useState(0);
  const [instrument, setInstrument] = useState<Instrument>(metadata.instrument);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [columnMode, setColumnMode] = useState<'single' | 'two-column' | 'three-column'>('single');
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(2.0);
  const [activeChord, setActiveChord] = useState<string | null>(null);
  const [isMetronomeOpen, setIsMetronomeOpen] = useState(false);

  // Parse raw tab text into AST
  const ast = React.useMemo(() => parseSongText(rawTabContent), [rawTabContent]);

  // Current key calculation
  const currentKey = React.useMemo(() => {
    return metadata.key ? transposeChord(metadata.key, semitones) : undefined;
  }, [metadata.key, semitones]);

  // RequestAnimationFrame Auto-Scroller
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const isUserScrollingRef = useRef(false);
  const userScrollTimeoutRef = useRef<number | null>(null);
  const scrollSpeedRef = useRef(scrollSpeed);
  scrollSpeedRef.current = scrollSpeed;

  const scrollStep = useCallback((timestamp: number) => {
    if (lastTimeRef.current === null) {
      lastTimeRef.current = timestamp;
    }
    const delta = Math.min(timestamp - lastTimeRef.current, 100);
    lastTimeRef.current = timestamp;

    if (!isUserScrollingRef.current) {
      // Base rate: scrollSpeed pixels per tick at 60fps
      const pixelShift = (scrollSpeedRef.current * 0.75 * delta) / 16.67;
      window.scrollBy({ top: pixelShift, behavior: 'instant' as ScrollBehavior });
    }

    animationFrameRef.current = requestAnimationFrame(scrollStep);
  }, []);

  useEffect(() => {
    if (isScrolling) {
      lastTimeRef.current = null;
      animationFrameRef.current = requestAnimationFrame(scrollStep);
    } else if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isScrolling, scrollStep]);

  // Smart manual wheel & touch pause
  useEffect(() => {
    const handleWheel = () => {
      if (!isScrolling) return;
      isUserScrollingRef.current = true;
      if (userScrollTimeoutRef.current !== null) {
        window.clearTimeout(userScrollTimeoutRef.current);
      }
      userScrollTimeoutRef.current = window.setTimeout(() => {
        isUserScrollingRef.current = false;
        userScrollTimeoutRef.current = null;
      }, 1500);
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchmove', handleWheel, { passive: true });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchmove', handleWheel);
      if (userScrollTimeoutRef.current !== null) {
        window.clearTimeout(userScrollTimeoutRef.current);
        userScrollTimeoutRef.current = null;
      }
      isUserScrollingRef.current = false;
    };
  }, [isScrolling]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.tagName === 'SELECT' ||
          el.isContentEditable ||
          el.closest('input, textarea, select, [contenteditable="true"]'))
      ) {
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (isMetronomeOpen) {
        if (e.key === 'Escape') setIsMetronomeOpen(false);
        return;
      }

      if (e.code === 'Space') { e.preventDefault(); setIsScrolling((p) => !p); }
      else if (e.key === '[') setSemitones((p) => Math.max(-11, p - 1));
      else if (e.key === ']') setSemitones((p) => Math.min(11, p + 1));
      else if (e.key === '0') setSemitones(0);
      else if (e.key.toLowerCase() === 'c') setColumnMode((p) => p === 'single' ? 'two-column' : 'single');
      else if (e.key.toLowerCase() === 'i') setInstrument((p) => p === 'guitar' ? 'ukulele' : 'guitar');
      else if (e.key.toLowerCase() === 'm') setIsMetronomeOpen(true);
      else if (e.key === 'ArrowUp') { e.preventDefault(); setScrollSpeed((p) => Math.min(10.0, p + 0.5)); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setScrollSpeed((p) => Math.max(0.5, p - 0.5)); }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMetronomeOpen]);

  return (
    <div className="tab-player-container relative min-h-screen">
      <SongHeader
        metadata={metadata}
        currentKey={currentKey}
        transposedSemitones={semitones}
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
      />

      {isMetronomeOpen && (
        <MetronomeModal
          initialBpm={metadata.bpm ?? 100}
          strummingPattern={metadata.strummingPattern}
          onClose={() => setIsMetronomeOpen(false)}
        />
      )}
    </div>
  );
};
