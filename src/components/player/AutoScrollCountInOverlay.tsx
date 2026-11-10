import React from 'react';
import { Timer } from 'lucide-react';

interface AutoScrollCountInOverlayProps {
  secondsRemaining: number | null;
  onCancel: () => void;
}

export function AutoScrollCountInOverlay({
  secondsRemaining,
  onCancel,
}: AutoScrollCountInOverlayProps): React.JSX.Element | null {
  if (secondsRemaining === null || secondsRemaining <= 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-espresso text-canvas border border-warm/40 shadow-2xl flex items-center gap-3 animate-in fade-in duration-200"
    >
      <Timer className="w-5 h-5 text-amber animate-spin-slow" aria-hidden="true" />
      <div className="flex items-center gap-2 text-sm font-mono font-bold">
        <span>Get ready:</span>
        <span className="text-xl text-amber font-serif">{secondsRemaining}</span>
      </div>
      <button
        type="button"
        onClick={onCancel}
        aria-label="Cancel auto-scroll countdown"
        className="ml-2 min-h-[44px] px-3 py-1.5 inline-flex items-center justify-center text-xs text-canvas font-medium hover:text-white underline underline-offset-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta rounded-lg transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}
