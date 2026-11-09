import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { useModalA11y } from '../common/useModalA11y';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'Space', desc: 'Toggle Auto-Scroll (Play / Pause)' },
  { key: '↑ / ↓', desc: 'Adjust Scroll Speed (±0.5x)' },
  { key: '[ / ]', desc: 'Transpose Key (Down / Up 1 semitone)' },
  { key: '0', desc: 'Reset Transposition to Original Key' },
  { key: 'C', desc: 'Toggle Multi-Column Stage Mode' },
  { key: 'I', desc: 'Switch Instrument (Guitar ↔ Ukulele)' },
  { key: 'M', desc: 'Open / Close Metronome' },
  { key: '?', desc: 'Show Keyboard Shortcuts' },
  { key: 'Esc', desc: 'Close any active modal / overlay' },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  const dialogRef = useModalA11y({ isOpen, onClose });

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
      ref={dialogRef}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-md p-6 rounded-3xl bg-surface border border-warm shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-warm/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-terracotta/10 text-terracotta">
              <Keyboard className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="shortcuts-modal-title" className="font-serif text-lg sm:text-xl font-bold text-espresso">
                Practice Keyboard Shortcuts
              </h2>
              <p className="text-xs text-walnut">Keep hands on your strings while practicing.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-canvas text-walnut hover:text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
            aria-label="Close shortcuts modal"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <ul role="list" className="space-y-2 py-1">
          {SHORTCUTS.map((item) => (
            <li
              key={item.key}
              className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-canvas text-xs transition-colors"
            >
              <span className="text-walnut font-medium">{item.desc}</span>
              <kbd className="px-2 py-1 rounded-md bg-canvas border border-warm font-mono font-bold text-[11px] text-espresso shadow-2xs">
                {item.key}
              </kbd>
            </li>
          ))}
        </ul>

        <div className="border-t border-warm/60 pt-3 flex justify-end">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 min-h-[44px] rounded-xl bg-canvas border border-warm text-xs font-semibold text-espresso hover:border-terracotta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
          >
            Got it (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
