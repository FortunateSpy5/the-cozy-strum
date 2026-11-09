import React from 'react';
import { Sun, SunDim } from 'lucide-react';

interface ShortcutLegendBarProps {
  isWakeLockActive: boolean;
  isWakeLockSupported: boolean;
  onToggleWakeLock: () => void;
  onOpenShortcutsModal: () => void;
}

export const ShortcutLegendBar: React.FC<ShortcutLegendBarProps> = ({
  isWakeLockActive,
  isWakeLockSupported,
  onToggleWakeLock,
  onOpenShortcutsModal
}) => {
  return (
    <div
      role="region"
      aria-label="Practice keyboard shortcuts quick reference"
      className="hidden md:flex items-center justify-between gap-3 px-4 py-1.5 rounded-full bg-surface/85 backdrop-blur-md border border-warm/60 shadow-xs text-[11px] font-mono text-walnut mb-2 max-w-3xl mx-auto transition-all"
    >
      {/* Keyboard Shortcuts */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-canvas border border-warm text-espresso font-bold text-[10px] shadow-2xs">Space</kbd>
          <span>Play/Pause</span>
        </span>
        <span className="text-warm" aria-hidden="true">•</span>
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 rounded bg-canvas border border-warm text-espresso font-bold text-[10px] shadow-2xs">[</kbd>
          <kbd className="px-1 py-0.5 rounded bg-canvas border border-warm text-espresso font-bold text-[10px] shadow-2xs">]</kbd>
          <span>Transpose -1/+1</span>
        </span>
        <span className="text-warm" aria-hidden="true">•</span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-canvas border border-warm text-espresso font-bold text-[10px] shadow-2xs">S</kbd>
          <span>Stage View</span>
        </span>
      </div>

      {/* Right Controls: Wake Lock & Full Shortcuts Modal */}
      <div className="flex items-center gap-2">
        {isWakeLockSupported && (
          <button
            onClick={onToggleWakeLock}
            type="button"
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-terracotta ${
              isWakeLockActive
                ? 'text-amber-700 dark:text-amber-300 bg-amber-500/15 font-semibold'
                : 'text-walnut/70 hover:text-espresso bg-canvas border border-warm/50'
            }`}
            title={isWakeLockActive ? 'Screen Wake Lock: Active (Prevents screen sleep)' : 'Screen Wake Lock: Inactive'}
            aria-pressed={isWakeLockActive}
          >
            {isWakeLockActive ? <Sun className="w-3 h-3 text-amber-600 animate-spin-slow" aria-hidden="true" /> : <SunDim className="w-3 h-3" aria-hidden="true" />}
            <span>{isWakeLockActive ? 'Screen Awake' : 'Screen Sleep OK'}</span>
          </button>
        )}

        <button
          onClick={onOpenShortcutsModal}
          type="button"
          className="hover:text-terracotta underline underline-offset-2 transition-colors cursor-pointer text-[10px]"
          title="Open full list of keyboard shortcuts (?)"
        >
          All Shortcuts (?)
        </button>
      </div>
    </div>
  );
};
