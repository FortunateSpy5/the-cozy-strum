import React, { useMemo } from 'react';
import { Sparkles, RotateCcw } from 'lucide-react';
import { recommendCapo } from '../../lib/music/capoOptimizer';

interface SmartCapoBannerProps {
  uniqueChords: string[];
  baseCapo: number;
  currentSemitones: number;
  onApplyCapo: (newCapo: number, semitones: number) => void;
  onReset: () => void;
  compact?: boolean;
}

export function SmartCapoBanner({
  uniqueChords,
  baseCapo,
  currentSemitones,
  onApplyCapo,
  onReset,
  compact = false,
}: SmartCapoBannerProps): React.JSX.Element | null {
  const recommendation = useMemo(() => {
    return recommendCapo(uniqueChords, baseCapo);
  }, [uniqueChords, baseCapo]);

  if (!recommendation) return null;

  const isApplied = currentSemitones === -(recommendation.recommendedCapo - baseCapo);

  return (
    <div
      role="region"
      aria-label="Smart capo chord simplification suggestion"
      className={`mb-3 sm:mb-4 p-3 sm:p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex ${
        compact ? 'flex-col gap-2.5' : 'flex-col sm:flex-row items-start sm:items-center justify-between gap-3'
      } text-xs`}
    >
      <div className="flex items-center gap-2 text-espresso">
        <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
        <div>
          <span className="font-semibold text-espresso">Smart Open-Chord Tip: </span>
          <span className="text-walnut">{recommendation.reason}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
        <span className="sr-only" role="status" aria-live="polite">
          {isApplied ? `Capo ${recommendation.recommendedCapo} applied.` : 'Standard chords restored.'}
        </span>
        {isApplied ? (
          <button
            type="button"
            onClick={onReset}
            aria-label={`Reset chords to original key (Capo ${baseCapo})`}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-canvas border border-warm text-espresso font-semibold hover:border-terracotta inline-flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reset to Standard</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onApplyCapo(recommendation.recommendedCapo, -(recommendation.recommendedCapo - baseCapo))}
            aria-label={`Simplify chords with Capo ${recommendation.recommendedCapo}`}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-terracotta text-white font-semibold hover:opacity-90 inline-flex items-center gap-1.5 cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta text-xs transition-opacity"
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Simplify with Capo {recommendation.recommendedCapo}</span>
          </button>
        )}
      </div>
    </div>
  );
}
