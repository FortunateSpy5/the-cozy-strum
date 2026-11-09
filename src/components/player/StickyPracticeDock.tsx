import React from 'react';
import { Play, Pause, Columns2, Music, Guitar, Clock, Keyboard } from 'lucide-react';
import type { Instrument } from '../../lib/types';

interface StickyPracticeDockProps {
  isScrolling: boolean;
  scrollSpeed: number;
  semitones: number;
  columnMode: 'single' | 'two-column' | 'three-column';
  fontSize: 'sm' | 'base' | 'lg' | 'xl';
  instrument: Instrument;
  onToggleScroll: () => void;
  onChangeSpeed: (delta: number) => void;
  onTranspose: (delta: number) => void;
  onResetTranspose: () => void;
  onToggleColumns: () => void;
  onChangeFontSize: (larger: boolean) => void;
  onToggleInstrument: () => void;
  onOpenMetronome: () => void;
  onOpenShortcuts: () => void;
}

export const StickyPracticeDock: React.FC<StickyPracticeDockProps> = ({
  isScrolling,
  scrollSpeed,
  semitones,
  columnMode,
  fontSize,
  instrument,
  onToggleScroll,
  onChangeSpeed,
  onTranspose,
  onResetTranspose,
  onToggleColumns,
  onChangeFontSize,
  onToggleInstrument,
  onOpenMetronome,
  onOpenShortcuts
}) => {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-4xl" role="toolbar" aria-label="Practice tools dock">
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 sm:p-3 rounded-2xl bg-surface/90 dark:bg-surface/95 backdrop-blur-md border border-warm shadow-xl">
        {/* Left: Auto-Scroll Group */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onToggleScroll}
            type="button"
            className={`flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-xl text-xs font-semibold transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 ${
              isScrolling ? 'bg-amber-600 text-white animate-pulse' : 'bg-terracotta text-white hover:opacity-90'
            }`}
            title="Toggle Auto-Scroll (Space)"
            aria-label={isScrolling ? 'Pause auto-scroll (Shortcut: Space)' : 'Start auto-scroll (Shortcut: Space)'}
          >
            {isScrolling ? <Pause className="w-4 h-4 fill-white" aria-hidden="true" /> : <Play className="w-4 h-4 fill-white" aria-hidden="true" />}
            <span className="hidden sm:inline">{isScrolling ? 'Pause' : 'Auto-Scroll'}</span>
          </button>

          {/* Speed Adjust */}
          <div role="group" aria-label="Auto-scroll speed" className="inline-flex items-center rounded-xl bg-canvas border border-warm p-0.5 text-xs font-mono">
            <button
              onClick={() => onChangeSpeed(-0.5)}
              type="button"
              className="px-2 py-1 min-h-[40px] min-w-[36px] flex items-center justify-center hover:text-terracotta rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
              title="Slower speed (Down Arrow)"
              aria-label="Decrease scroll speed"
            >
              -
            </button>
            <span className="px-1.5 py-1 font-bold text-espresso min-w-[36px] text-center" aria-label={`Current speed ${scrollSpeed.toFixed(1)}x`}>
              {scrollSpeed.toFixed(1)}x
            </span>
            <button
              onClick={() => onChangeSpeed(0.5)}
              type="button"
              className="px-2 py-1 min-h-[40px] min-w-[36px] flex items-center justify-center hover:text-terracotta rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
              title="Faster speed (Up Arrow)"
              aria-label="Increase scroll speed"
            >
              +
            </button>
          </div>
        </div>

        {/* Center: Transpose Controls */}
        <div role="group" aria-label="Transpose controls" className="flex items-center gap-1">
          <span className="text-[11px] font-mono uppercase text-walnut hidden md:inline mr-1" aria-hidden="true">
            Transpose:
          </span>
          <div className="inline-flex items-center rounded-xl bg-canvas border border-warm p-0.5 text-xs font-mono">
            <button
              onClick={() => onTranspose(-1)}
              type="button"
              className="px-2.5 py-1 min-h-[40px] min-w-[36px] flex items-center justify-center hover:text-terracotta rounded font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
              title="Transpose Down 1 Semitone ([)"
              aria-label="Transpose down 1 semitone"
            >
              -
            </button>
            <button
              onClick={onResetTranspose}
              type="button"
              className="px-2 py-1 min-h-[40px] min-w-[36px] flex items-center justify-center font-bold text-espresso hover:text-terracotta text-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
              title="Reset transposition (0)"
              aria-label={`Reset transposition, currently ${semitones === 0 ? 'original key' : semitones > 0 ? `+${semitones}` : semitones}`}
            >
              {semitones === 0 ? '0' : semitones > 0 ? `+${semitones}` : semitones}
            </button>
            <button
              onClick={() => onTranspose(1)}
              type="button"
              className="px-2.5 py-1 min-h-[40px] min-w-[36px] flex items-center justify-center hover:text-terracotta rounded font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
              title="Transpose Up 1 Semitone (])"
              aria-label="Transpose up 1 semitone"
            >
              +
            </button>
          </div>
        </div>

        {/* Right: Instrument, Stage Columns, Font Size, Metronome & Shortcuts */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            onClick={onToggleInstrument}
            type="button"
            className="p-2 min-h-[44px] min-w-[44px] rounded-xl bg-canvas border border-warm hover:border-terracotta text-xs font-mono text-espresso flex items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2"
            title={`Active: ${instrument}. Click to switch (I)`}
            aria-label={`Instrument: ${instrument}. Click to switch to ${instrument === 'guitar' ? 'ukulele' : 'guitar'}`}
          >
            {instrument === 'guitar' ? <Guitar className="w-4 h-4" aria-hidden="true" /> : <Music className="w-4 h-4" aria-hidden="true" />}
            <span className="hidden lg:inline capitalize">{instrument}</span>
          </button>

          <button
            onClick={onToggleColumns}
            type="button"
            className={`p-2 min-h-[44px] min-w-[44px] rounded-xl bg-canvas border border-warm hover:border-terracotta text-xs flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 ${
              columnMode !== 'single' ? 'text-terracotta border-terracotta' : 'text-espresso'
            }`}
            title="Toggle Fit-to-Screen Stage Mode (C)"
            aria-label="Toggle fit-to-screen multi-column stage mode"
            aria-pressed={columnMode !== 'single'}
          >
            <Columns2 className="w-4 h-4" aria-hidden="true" />
          </button>

          <div role="group" aria-label="Font size controls" className="inline-flex items-center rounded-xl bg-canvas border border-warm p-0.5 text-xs font-mono">
            <button
              onClick={() => onChangeFontSize(false)}
              type="button"
              className="px-2 py-1 min-h-[40px] min-w-[36px] flex items-center justify-center hover:text-terracotta text-[10px] rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
              title="Decrease font size"
              aria-label="Decrease font size"
            >
              A-
            </button>
            <span className="px-1 py-0.5 text-[10px] text-walnut uppercase hidden sm:inline" aria-label={`Font size ${fontSize}`}>
              {fontSize}
            </span>
            <button
              onClick={() => onChangeFontSize(true)}
              type="button"
              className="px-2 py-1 min-h-[40px] min-w-[36px] flex items-center justify-center hover:text-terracotta text-xs font-bold rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
              title="Increase font size"
              aria-label="Increase font size"
            >
              A+
            </button>
          </div>

          <button
            onClick={onOpenMetronome}
            type="button"
            className="p-2 min-h-[44px] min-w-[44px] rounded-xl bg-canvas border border-warm hover:border-terracotta text-espresso flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2"
            title="Open Metronome (M)"
            aria-label="Open metronome modal"
          >
            <Clock className="w-4 h-4" aria-hidden="true" />
          </button>

          <button
            onClick={onOpenShortcuts}
            type="button"
            className="p-2 min-h-[44px] min-w-[44px] rounded-xl bg-canvas border border-warm hover:border-terracotta text-espresso flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2"
            title="Keyboard Shortcuts (?)"
            aria-label="Open keyboard shortcuts guide"
          >
            <Keyboard className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
