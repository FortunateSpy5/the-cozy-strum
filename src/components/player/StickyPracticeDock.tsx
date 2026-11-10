import React from 'react';
import { Play, Pause, Columns2, Music, Guitar, Clock, Keyboard } from 'lucide-react';
import type { Instrument } from '../../lib/types';

interface StickyPracticeDockProps {
  isScrolling: boolean; scrollSpeed: number; semitones: number;
  columnMode: 'single' | 'two-column' | 'three-column';
  fontSize: 'sm' | 'base' | 'lg' | 'xl';
  instrument: Instrument;
  onToggleScroll: () => void; onResetTranspose: () => void;
  onToggleColumns: () => void; onToggleInstrument: () => void;
  onOpenMetronome: () => void; onOpenShortcuts: () => void;
  onChangeSpeed: (delta: number) => void;
  onTranspose: (delta: number) => void;
  onChangeFontSize: (larger: boolean) => void;
}

const STEP_BTN = 'px-1.5 sm:px-2.5 py-1.5 min-h-[44px] min-w-[40px] sm:min-w-[44px] flex items-center justify-center hover:text-terracotta rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta font-bold';
const DOCK_ICON_BTN = 'p-2 min-h-[44px] min-w-[40px] sm:min-w-[44px] rounded-xl bg-canvas border border-warm hover:border-terracotta text-espresso flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2';

export const StickyPracticeDock: React.FC<StickyPracticeDockProps> = ({
  isScrolling, scrollSpeed, semitones, columnMode, fontSize, instrument,
  onToggleScroll, onChangeSpeed, onTranspose, onResetTranspose,
  onToggleColumns, onChangeFontSize, onToggleInstrument, onOpenMetronome, onOpenShortcuts
}) => {
  return (
    <div className="fixed bottom-3 sm:bottom-4 left-0 right-0 z-40 max-w-6xl mx-auto px-4 sm:px-6 pointer-events-none" role="toolbar" aria-label="Practice tools dock">
      <div className="pointer-events-auto flex items-center justify-between gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-2xl bg-surface border border-warm shadow-xl overflow-x-auto scrollbar-none transition-colors">
        {/* Left: Auto-Scroll Group */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            onClick={onToggleScroll}
            type="button"
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-2 min-h-[44px] rounded-xl text-xs font-semibold transition-[background-color,opacity] shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 ${
              isScrolling ? 'bg-amber-600 text-white animate-pulse motion-reduce:animate-none' : 'bg-terracotta text-white hover:opacity-90'
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
              className={STEP_BTN}
              title="Slower speed (Down Arrow)"
              aria-label="Decrease scroll speed"
            >
              -
            </button>
            <span className="px-1 font-bold text-espresso min-w-[34px] sm:min-w-[40px] text-center" aria-label={`Current speed ${scrollSpeed.toFixed(1)}x`}>
              {scrollSpeed.toFixed(1)}x
            </span>
            <button
              onClick={() => onChangeSpeed(0.5)}
              type="button"
              className={STEP_BTN}
              title="Faster speed (Up Arrow)"
              aria-label="Increase scroll speed"
            >
              +
            </button>
          </div>
        </div>

        {/* Center: Transpose Controls */}
        <div role="group" aria-label="Transpose controls" className="flex items-center gap-1 shrink-0">
          <span className="text-[11px] font-mono uppercase text-walnut hidden md:inline mr-1" aria-hidden="true">
            Transpose:
          </span>
          <div className="inline-flex items-center rounded-xl bg-canvas border border-warm p-0.5 text-xs font-mono">
            <button
              onClick={() => onTranspose(-1)}
              type="button"
              className={STEP_BTN}
              title="Transpose Down 1 Semitone ([)"
              aria-label="Transpose down 1 semitone"
            >
              -
            </button>
            <button
              onClick={onResetTranspose}
              type="button"
              className="px-1.5 sm:px-2.5 py-1.5 min-h-[44px] min-w-[34px] sm:min-w-[40px] flex items-center justify-center font-bold text-espresso hover:text-terracotta text-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
              title="Reset transposition (0)"
              aria-label={`Reset transposition, currently ${semitones === 0 ? 'original key' : semitones > 0 ? `+${semitones}` : semitones}`}
            >
              {semitones === 0 ? '0' : semitones > 0 ? `+${semitones}` : semitones}
            </button>
            <button
              onClick={() => onTranspose(1)}
              type="button"
              className={STEP_BTN}
              title="Transpose Up 1 Semitone (])"
              aria-label="Transpose up 1 semitone"
            >
              +
            </button>
          </div>
        </div>

        {/* Right: Instrument, Stage Columns, Font Size, Metronome & Shortcuts */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            onClick={onToggleInstrument}
            type="button"
            className={`${DOCK_ICON_BTN} font-mono text-xs gap-1`}
            title={`Active: ${instrument}. Click to switch (I)`}
            aria-label={`Instrument: ${instrument}. Click to switch to ${instrument === 'guitar' ? 'ukulele' : 'guitar'}`}
          >
            {instrument === 'guitar' ? <Guitar className="w-4 h-4" aria-hidden="true" /> : <Music className="w-4 h-4" aria-hidden="true" />}
            <span className="hidden lg:inline capitalize">{instrument}</span>
          </button>

          <button
            onClick={onToggleColumns}
            type="button"
            className={`hidden md:flex p-2 min-h-[44px] min-w-[44px] rounded-xl bg-canvas border border-warm hover:border-terracotta text-xs items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 ${
              columnMode !== 'single' ? 'text-terracotta border-terracotta' : 'text-espresso'
            }`}
            title={columnMode === 'two-column' ? 'Switch to Standard Stacked View (C)' : 'Switch to Side-by-Side Chords View (C)'}
            aria-label={columnMode === 'two-column' ? 'Switch to Standard Stacked View' : 'Switch to Side-by-Side Chords View'}
            aria-pressed={columnMode !== 'single'}
          >
            <Columns2 className="w-4 h-4" aria-hidden="true" />
          </button>

          <div role="group" aria-label="Font size controls" className="hidden sm:inline-flex items-center rounded-xl bg-canvas border border-warm p-0.5 text-xs font-mono">
            <button
              onClick={() => onChangeFontSize(false)}
              type="button"
              className={`${STEP_BTN} text-[10px]`}
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
              className={`${STEP_BTN} text-xs font-bold`}
              title="Increase font size"
              aria-label="Increase font size"
            >
              A+
            </button>
          </div>

          <button
            onClick={onOpenMetronome}
            type="button"
            className={DOCK_ICON_BTN}
            title="Open Metronome (M)"
            aria-label="Open metronome modal"
          >
            <Clock className="w-4 h-4" aria-hidden="true" />
          </button>

          <button
            onClick={onOpenShortcuts}
            type="button"
            className={`hidden md:flex ${DOCK_ICON_BTN}`}
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
