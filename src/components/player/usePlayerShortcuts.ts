import { useEffect, useRef } from 'react';

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
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.tagName === 'SELECT' ||
          el.isContentEditable ||
          Boolean(el.closest?.('input, textarea, select, [contenteditable="true"], [contenteditable=""]')))
      ) {
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const opts = optionsRef.current;

      if (opts.hasActiveModal) {
        if (e.key === 'Escape') {
          e.preventDefault();
          opts.onCloseModals();
        }
        return;
      }

      if ((e.code === 'Space' || e.key === ' ') && !e.shiftKey) {
        e.preventDefault();
        if (e.repeat) return;
        const btn = el?.closest?.('button');
        if (btn) btn.blur();
        opts.onToggleScroll();
      } else if (e.code === 'ArrowUp' || e.key === 'ArrowUp') {
        e.preventDefault();
        opts.onAdjustSpeed(0.5);
      } else if (e.code === 'ArrowDown' || e.key === 'ArrowDown') {
        e.preventDefault();
        opts.onAdjustSpeed(-0.5);
      } else if (e.key === '[' || (!e.shiftKey && e.code === 'BracketLeft')) {
        e.preventDefault();
        opts.onTranspose(-1);
      } else if (e.key === ']' || (!e.shiftKey && e.code === 'BracketRight')) {
        e.preventDefault();
        opts.onTranspose(1);
      } else if (e.key === '0' || (!e.shiftKey && (e.code === 'Digit0' || e.code === 'Numpad0'))) {
        e.preventDefault();
        opts.onResetTranspose();
      } else if (e.code === 'KeyC' || e.code === 'KeyS' || e.key.toLowerCase() === 'c' || e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (e.repeat) return;
        opts.onToggleColumns();
      } else if (e.code === 'KeyI' || e.key.toLowerCase() === 'i') {
        e.preventDefault();
        if (e.repeat) return;
        opts.onToggleInstrument();
      } else if (e.code === 'KeyM' || e.key.toLowerCase() === 'm') {
        e.preventDefault();
        if (e.repeat) return;
        opts.onToggleMetronome();
      } else if (e.key === '?' || (e.code === 'Slash' && e.shiftKey)) {
        e.preventDefault();
        if (e.repeat) return;
        opts.onToggleShortcuts();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        opts.onCloseModals();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}

