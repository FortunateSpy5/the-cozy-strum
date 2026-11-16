import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Instrument } from '../../lib/types';
import { transposeChord } from '../../lib/music/transpose';
import { getChordVoicings } from '../../lib/music/chordVoicings';
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
  const [variationIndices, setVariationIndices] = useState<Record<string, number>>({});

  if (uniqueChords.length === 0) return null;

  const isGrid = layout === 'grid';

  const cycleVariation = (chordName: string, delta: number, total: number) => {
    if (total <= 1) return;
    setVariationIndices((prev) => {
      const current = prev[chordName] ?? 0;
      const next = (current + delta + total) % total;
      return { ...prev, [chordName]: next };
    });
  };

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
          const voicings = getChordVoicings(transposedName, instrument);
          const totalVars = voicings.length;
          const varIndex = Math.min((variationIndices[transposedName] ?? 0), totalVars - 1);
          const voicing = voicings[varIndex] ?? voicings[0]!;
          const isHighlighted = activeChord === transposedName || activeChord === rawChord;

          return (
            <div
              key={`${rawChord}-${transposedName}-${instrument}`}
              onClick={() => totalVars > 1 && cycleVariation(transposedName, 1, totalVars)}
              title={totalVars > 1 ? `${voicing.variationLabel || `Variation ${varIndex + 1} of ${totalVars}`}. Click to cycle.` : undefined}
              className={`p-2 rounded-xl transition-[transform,border-color,background-color] motion-reduce:transition-none flex flex-col items-center shrink-0 ${
                totalVars > 1 ? 'cursor-pointer' : ''
              } ${
                isHighlighted
                  ? 'bg-canvas border-2 border-terracotta scale-105 motion-reduce:scale-100 shadow-md ring-1 ring-terracotta/20'
                  : 'bg-canvas/50 border border-warm/80 hover:border-terracotta/60'
              }`}
            >
              <ChordDiagramSvg voicing={voicing} size={80} />

              {totalVars > 1 && (
                <div
                  className="flex items-center justify-between w-full mt-1.5 pt-1 border-t border-warm/40 px-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => cycleVariation(transposedName, -1, totalVars)}
                    aria-label={`Previous variation for ${transposedName}`}
                    className="p-1 rounded text-walnut hover:text-espresso dark:hover:text-cream hover:bg-warm/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-terracotta transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>

                  <span
                    className="text-[10px] font-mono font-medium text-walnut dark:text-cream/70 select-none px-1"
                    title={voicing.variationLabel || `Variation ${varIndex + 1} of ${totalVars}`}
                  >
                    {varIndex + 1}/{totalVars}
                  </span>

                  <button
                    type="button"
                    onClick={() => cycleVariation(transposedName, 1, totalVars)}
                    aria-label={`Next variation for ${transposedName}`}
                    className="p-1 rounded text-walnut hover:text-espresso dark:hover:text-cream hover:bg-warm/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-terracotta transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
