import React from 'react';
import type { Instrument } from '../../lib/types';
import { transposeChord } from '../../lib/music/transpose';
import { getChordVoicing } from '../../lib/music/chordVoicings';
import { ChordDiagramSvg } from './ChordDiagramSvg';

interface ChordStripProps {
  uniqueChords: string[];
  semitones: number;
  instrument: Instrument;
  activeChord?: string | null;
  layout?: 'row' | 'grid';
}

export const ChordStrip: React.FC<ChordStripProps> = ({
  uniqueChords,
  semitones,
  instrument,
  activeChord,
  layout = 'row',
}) => {
  if (uniqueChords.length === 0) return null;

  const isGrid = layout === 'grid';

  return (
    <section aria-labelledby="chord-strip-title" className="my-3 sm:my-5 p-3.5 sm:p-4 rounded-2xl bg-surface border border-warm shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <h3 id="chord-strip-title" className="text-xs font-mono uppercase tracking-wider text-walnut font-bold">
          Song Chords ({instrument === 'guitar' ? '6-String Guitar' : '4-String Ukulele'})
        </h3>
        <span className="text-[11px] text-walnut font-mono">
          {uniqueChords.length} chords
        </span>
      </div>

      {/* Chord diagrams list: horizontal scroll strip OR compact grid in sidebar */}
      <div
        tabIndex={0}
        role="region"
        aria-label="Chord diagrams list. Use horizontal arrow keys to scroll."
        className={
          isGrid
            ? 'grid grid-cols-3 gap-2 overflow-y-auto max-h-[380px] p-1 scrollbar-thin rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta'
            : 'flex items-center gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-thin focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta rounded-xl'
        }
      >
        {uniqueChords.map((rawChord) => {
          const transposedName = transposeChord(rawChord, semitones);
          const voicing = getChordVoicing(transposedName, instrument);
          const isHighlighted = activeChord === transposedName || activeChord === rawChord;

          return (
            <div
              key={`${rawChord}-${transposedName}-${instrument}`}
              className={`p-2 rounded-xl transition-[transform,border-color,background-color] motion-reduce:transition-none flex flex-col items-center shrink-0 ${
                isHighlighted
                  ? 'bg-canvas border-2 border-terracotta scale-105 motion-reduce:scale-100 shadow-md'
                  : 'bg-canvas/50 border border-warm/80 hover:border-terracotta/60'
              }`}
            >
              <ChordDiagramSvg voicing={voicing} size={80} />
            </div>
          );
        })}
      </div>
    </section>
  );
};
