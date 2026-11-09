import React from 'react';
import { Guitar, Music, Gauge, ArrowLeft } from 'lucide-react';
import type { SongMetadata } from '../../lib/types';

interface SongHeaderProps {
  metadata: SongMetadata;
  currentKey?: string;
  transposedSemitones: number;
}

export const SongHeader: React.FC<SongHeaderProps> = ({
  metadata,
  currentKey,
  transposedSemitones
}) => {
  const isGuitar = metadata.instrument === 'guitar';

  return (
    <div className="mb-6 space-y-3">
      {/* Back to Library */}
      <a
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-walnut hover:text-terracotta min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta rounded-md transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Back to Sanctuary</span>
      </a>

      {/* Main Title Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-espresso tracking-tight">
            {metadata.title}
          </h1>
          <p className="text-base sm:text-lg text-walnut font-medium mt-0.5">
            {metadata.artist}
          </p>
        </div>

        {/* Instrument & Key Badge */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              isGuitar
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
            }`}
          >
            {isGuitar ? <Guitar className="w-3.5 h-3.5" aria-hidden="true" /> : <Music className="w-3.5 h-3.5" aria-hidden="true" />}
            {isGuitar ? 'Guitar' : 'Ukulele'}
          </span>

          {currentKey && (
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-canvas border border-warm text-espresso">
              Key: {currentKey}
              {transposedSemitones !== 0 && (
                <span className="text-terracotta ml-1 font-bold">
                  ({transposedSemitones > 0 ? `+${transposedSemitones}` : transposedSemitones})
                </span>
              )}
            </span>
          )}

          <span className="px-2.5 py-1 rounded-full text-xs font-mono uppercase bg-canvas border border-warm text-walnut">
            {metadata.difficulty}
          </span>
        </div>
      </div>

      {/* Technical Spec Strip */}
      <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-walnut pt-1 border-t border-warm/60">
        <span className="px-2 py-0.5 rounded bg-surface border border-warm">
          Tuning: {metadata.tuning}
        </span>
        {metadata.capo > 0 && (
          <span className="px-2 py-0.5 rounded bg-surface border border-warm font-semibold text-terracotta">
            Capo: Fret {metadata.capo}
          </span>
        )}
        {metadata.bpm && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface border border-warm">
            <Gauge className="w-3 h-3" aria-hidden="true" />
            {metadata.bpm} BPM
          </span>
        )}
        {metadata.strummingPattern && (
          <span className="px-2 py-0.5 rounded bg-surface border border-warm">
            Strum: <strong className="text-espresso font-semibold">{metadata.strummingPattern}</strong>
          </span>
        )}
      </div>
    </div>
  );
};
