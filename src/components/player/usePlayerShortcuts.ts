import { useEffect } from 'react';

export interface PlayerShortcutsOptions {
  onToggleScroll: () => void;
  onAdjustSpeed: (delta: number) => void;
  onTranspose: (delta: number) => void;
  onResetTranspose: () => void;
  onToggleColumns: () => void;
  onToggleInstrument: () => void;
  onToggleMetronome: () => void;
  onToggleShortcuts: () => void;
  onCloseModals: () => void;
  hasActiveModal: boolean;
}

export function usePlayerShortcuts(options: PlayerShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.tagName === 'SELECT' ||
          el.isContentEditable ||
          el.closest('input, textarea, select, [contenteditable="true"]'))
      ) {
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (options.hasActiveModal) {
        if (e.key === 'Escape') {
          e.preventDefault();
          options.onCloseModals();
        }
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (el && el.tagName === 'BUTTON') el.blur();
        options.onToggleScroll();
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        options.onAdjustSpeed(0.5);
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        options.onAdjustSpeed(-0.5);
      } else if (e.code === 'BracketLeft' || e.key === '[') {
        e.preventDefault();
        options.onTranspose(-1);
      } else if (e.code === 'BracketRight' || e.key === ']') {
        e.preventDefault();
        options.onTranspose(1);
      } else if (e.code === 'Digit0' || e.code === 'Numpad0' || e.key === '0') {
        e.preventDefault();
        options.onResetTranspose();
      } else if (e.code === 'KeyC' || e.key.toLowerCase() === 'c') {
        e.preventDefault();
        options.onToggleColumns();
      } else if (e.code === 'KeyI' || e.key.toLowerCase() === 'i') {
        e.preventDefault();
        options.onToggleInstrument();
      } else if (e.code === 'KeyM' || e.key.toLowerCase() === 'm') {
        e.preventDefault();
        options.onToggleMetronome();
      } else if (e.key === '?' || (e.code === 'Slash' && e.shiftKey)) {
        e.preventDefault();
        options.onToggleShortcuts();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        options.onCloseModals();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options]);
}
