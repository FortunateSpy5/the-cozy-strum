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
}

export const ChordStrip: React.FC<ChordStripProps> = ({
  uniqueChords,
  semitones,
  instrument,
  activeChord
}) => {
  if (uniqueChords.length === 0) return null;

  return (
    <section aria-labelledby="chord-strip-title" className="my-5 p-4 rounded-2xl bg-surface border border-warm shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <h3 id="chord-strip-title" className="text-xs font-mono uppercase tracking-wider text-walnut font-bold">
          Song Chords ({instrument === 'guitar' ? '6-String Guitar' : '4-String Ukulele'})
        </h3>
        <span className="text-[11px] text-walnut font-mono">
          {uniqueChords.length} chords used
        </span>
      </div>

      {/* Horizontal scroll strip */}
      <div
        tabIndex={0}
        role="region"
        aria-label="Chord diagrams list. Use horizontal arrow keys to scroll."
        className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-thin focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta rounded-xl"
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
