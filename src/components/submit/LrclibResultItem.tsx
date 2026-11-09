import React from 'react';
import type { LrclibTrack } from '../../lib/lyrics/lrclibService';

interface LrclibResultItemProps {
  track: LrclibTrack;
  isSelected: boolean;
  onSelect: (track: LrclibTrack) => void;
}

export const LrclibResultItem = React.memo(function LrclibResultItem({
  track,
  isSelected,
  onSelect,
}: LrclibResultItemProps): React.JSX.Element {
  const hasLyrics = Boolean(track.plainLyrics);
  const trackName = track.name || track.trackName;

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      aria-label={`Select ${trackName} by ${track.artistName}`}
      onClick={() => onSelect(track)}
      className={`w-full text-left p-3 rounded-xl border min-h-[44px] transition-all text-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta ${
        isSelected
          ? 'bg-canvas border-terracotta shadow-xs'
          : 'bg-surface border-warm/60 hover:border-warm'
      }`}
    >
      <p className="font-semibold text-espresso truncate">{trackName}</p>
      <p className="text-xs text-walnut truncate">
        {track.artistName} {track.albumName ? `• ${track.albumName}` : ''}
      </p>
      <span
        className={`inline-block mt-1 text-xs font-mono px-2 py-0.5 rounded ${
          hasLyrics
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
            : 'bg-warm/30 text-walnut'
        }`}
      >
        {hasLyrics ? '✓ Lyrics Available' : 'Instrumental / No Lyrics'}
      </span>
    </button>
  );
});
