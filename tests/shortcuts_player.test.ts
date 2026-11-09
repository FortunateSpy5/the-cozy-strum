import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Player Shortcuts & Keyboard Navigation Logic', () => {
  // Test fixture simulating keyboard events and shortcut handling
  function createShortcutDispatcher(options: {
    onToggleScroll?: () => void;
    onAdjustSpeed?: (delta: number) => void;
    onTranspose?: (delta: number) => void;
    onResetTranspose?: () => void;
    onToggleColumns?: () => void;
    onToggleInstrument?: () => void;
    onToggleMetronome?: () => void;
    onToggleShortcuts?: () => void;
    onCloseModals?: () => void;
    hasActiveModal?: boolean;
  }) {
    const opts = {
      onToggleScroll: options.onToggleScroll ?? (() => {}),
      onAdjustSpeed: options.onAdjustSpeed ?? (() => {}),
      onTranspose: options.onTranspose ?? (() => {}),
      onResetTranspose: options.onResetTranspose ?? (() => {}),
      onToggleColumns: options.onToggleColumns ?? (() => {}),
      onToggleInstrument: options.onToggleInstrument ?? (() => {}),
      onToggleMetronome: options.onToggleMetronome ?? (() => {}),
      onToggleShortcuts: options.onToggleShortcuts ?? (() => {}),
      onCloseModals: options.onCloseModals ?? (() => {}),
      hasActiveModal: options.hasActiveModal ?? false
    };

    return function dispatchKey(e: {
      code?: string;
      key: string;
      ctrlKey?: boolean;
      metaKey?: boolean;
      altKey?: boolean;
      shiftKey?: boolean;
      repeat?: boolean;
      target?: {
        tagName?: string;
        isContentEditable?: boolean;
        closest?: (sel: string) => unknown;
      } | null;
      preventDefault?: () => void;
    }) {
      const el = e.target as { tagName?: string; isContentEditable?: boolean; closest?: (sel: string) => unknown } | null;
      if (
        el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.tagName === 'SELECT' ||
          el.isContentEditable ||
          Boolean(el.closest?.('input, textarea, select, [contenteditable="true"], [contenteditable=""]')))
      ) {
        return 'ignored_input';
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return 'ignored_modifier';

      if (opts.hasActiveModal) {
        if (e.key === 'Escape') {
          e.preventDefault?.();
          opts.onCloseModals();
          return 'closed_modal';
        }
        return 'modal_blocked';
      }

      if ((e.code === 'Space' || e.key === ' ') && !e.shiftKey) {
        e.preventDefault?.();
        if (e.repeat) return 'ignored_repeat';
        opts.onToggleScroll();
        return 'toggled_scroll';
      } else if (e.code === 'ArrowUp' || e.key === 'ArrowUp') {
        e.preventDefault?.();
        opts.onAdjustSpeed(0.5);
        return 'adjusted_speed_up';
      } else if (e.code === 'ArrowDown' || e.key === 'ArrowDown') {
        e.preventDefault?.();
        opts.onAdjustSpeed(-0.5);
        return 'adjusted_speed_down';
      } else if (e.key === '[' || (!e.shiftKey && e.code === 'BracketLeft')) {
        e.preventDefault?.();
        opts.onTranspose(-1);
        return 'transposed_down';
      } else if (e.key === ']' || (!e.shiftKey && e.code === 'BracketRight')) {
        e.preventDefault?.();
        opts.onTranspose(1);
        return 'transposed_up';
      } else if (e.key === '0' || (!e.shiftKey && (e.code === 'Digit0' || e.code === 'Numpad0'))) {
        e.preventDefault?.();
        opts.onResetTranspose();
        return 'reset_transpose';
      } else if (e.code === 'KeyC' || e.key.toLowerCase() === 'c') {
        e.preventDefault?.();
        if (e.repeat) return 'ignored_repeat';
        opts.onToggleColumns();
        return 'toggled_columns';
      } else if (e.code === 'KeyI' || e.key.toLowerCase() === 'i') {
        e.preventDefault?.();
        if (e.repeat) return 'ignored_repeat';
        opts.onToggleInstrument();
        return 'toggled_instrument';
      } else if (e.code === 'KeyM' || e.key.toLowerCase() === 'm') {
        e.preventDefault?.();
        if (e.repeat) return 'ignored_repeat';
        opts.onToggleMetronome();
        return 'toggled_metronome';
      } else if (e.key === '?' || (e.code === 'Slash' && e.shiftKey)) {
        e.preventDefault?.();
        if (e.repeat) return 'ignored_repeat';
        opts.onToggleShortcuts();
        return 'toggled_shortcuts';
      } else if (e.key === 'Escape') {
        e.preventDefault?.();
        opts.onCloseModals();
        return 'closed_modals';
      }

      return 'unhandled';
    };
  }

  it('ignores shortcuts when typing in input, textarea, select, or contenteditable', () => {
    let scrolled = false;
    const dispatch = createShortcutDispatcher({ onToggleScroll: () => { scrolled = true; } });

    assert.equal(dispatch({ key: ' ', code: 'Space', target: { tagName: 'INPUT' } }), 'ignored_input');
    assert.equal(dispatch({ key: ' ', code: 'Space', target: { tagName: 'TEXTAREA' } }), 'ignored_input');
    assert.equal(dispatch({ key: ' ', code: 'Space', target: { tagName: 'SELECT' } }), 'ignored_input');
    assert.equal(dispatch({ key: ' ', code: 'Space', target: { isContentEditable: true } }), 'ignored_input');
    assert.equal(
      dispatch({
        key: ' ',
        code: 'Space',
        target: { tagName: 'SPAN', closest: (sel: string) => sel.includes('contenteditable') ? {} : null }
      }),
      'ignored_input'
    );
    assert.equal(scrolled, false);
  });

  it('ignores shortcuts when Ctrl, Meta (Cmd), or Alt modifiers are active', () => {
    let speedChanged = false;
    let transposed = false;
    const dispatch = createShortcutDispatcher({
      onAdjustSpeed: () => { speedChanged = true; },
      onTranspose: () => { transposed = true; }
    });

    assert.equal(dispatch({ key: 'ArrowUp', code: 'ArrowUp', ctrlKey: true }), 'ignored_modifier');
    assert.equal(dispatch({ key: 'ArrowUp', code: 'ArrowUp', metaKey: true }), 'ignored_modifier');
    assert.equal(dispatch({ key: 'ArrowUp', code: 'ArrowUp', altKey: true }), 'ignored_modifier');
    assert.equal(dispatch({ key: '[', code: 'BracketLeft', ctrlKey: true }), 'ignored_modifier');
    assert.equal(speedChanged, false);
    assert.equal(transposed, false);
  });

  it('prevents Shift+{, Shift+}, Shift+) from accidentally triggering transpose or reset', () => {
    let transposed = 0;
    let resetCount = 0;
    const dispatch = createShortcutDispatcher({
      onTranspose: (d) => { transposed += d; },
      onResetTranspose: () => { resetCount++; }
    });

    // On US keyboards: Shift + [ gives key '{' with code 'BracketLeft'
    const curlyOpen = dispatch({ key: '{', code: 'BracketLeft', shiftKey: true });
    assert.equal(curlyOpen, 'unhandled', 'Typing { should NOT trigger transpose');

    // Shift + ] gives key '}' with code 'BracketRight'
    const curlyClose = dispatch({ key: '}', code: 'BracketRight', shiftKey: true });
    assert.equal(curlyClose, 'unhandled', 'Typing } should NOT trigger transpose');

    // Shift + 0 gives key ')' with code 'Digit0'
    const parenClose = dispatch({ key: ')', code: 'Digit0', shiftKey: true });
    assert.equal(parenClose, 'unhandled', 'Typing ) should NOT reset transpose');

    assert.equal(transposed, 0);
    assert.equal(resetCount, 0);

    // Standard '[' and ']' without shift work
    assert.equal(dispatch({ key: '[', code: 'BracketLeft' }), 'transposed_down');
    assert.equal(dispatch({ key: ']', code: 'BracketRight' }), 'transposed_up');
    assert.equal(dispatch({ key: '0', code: 'Digit0' }), 'reset_transpose');
    assert.equal(transposed, 0);
    assert.equal(resetCount, 1);
  });

  it('allows "?" shortcut with Shift key active', () => {
    let shortcutsOpened = false;
    const dispatch = createShortcutDispatcher({ onToggleShortcuts: () => { shortcutsOpened = true; } });

    assert.equal(dispatch({ key: '?', code: 'Slash', shiftKey: true }), 'toggled_shortcuts');
    assert.equal(shortcutsOpened, true);
  });

  it('ignores Space bar key repeat to prevent auto-scroll stutter', () => {
    let scrollCount = 0;
    const dispatch = createShortcutDispatcher({ onToggleScroll: () => { scrollCount++; } });

    assert.equal(dispatch({ key: ' ', code: 'Space', repeat: false }), 'toggled_scroll');
    assert.equal(dispatch({ key: ' ', code: 'Space', repeat: true }), 'ignored_repeat');
    assert.equal(dispatch({ key: ' ', code: 'Space', repeat: true }), 'ignored_repeat');
    assert.equal(scrollCount, 1);
  });

  it('blocks player shortcuts when modal is active, but processes Escape to close', () => {
    let closedModal = false;
    let scrollToggled = false;
    const dispatch = createShortcutDispatcher({
      hasActiveModal: true,
      onCloseModals: () => { closedModal = true; },
      onToggleScroll: () => { scrollToggled = true; }
    });

    assert.equal(dispatch({ key: ' ', code: 'Space' }), 'modal_blocked');
    assert.equal(dispatch({ key: 'ArrowUp', code: 'ArrowUp' }), 'modal_blocked');
    assert.equal(dispatch({ key: 'm', code: 'KeyM' }), 'modal_blocked');
    assert.equal(scrollToggled, false);

    assert.equal(dispatch({ key: 'Escape' }), 'closed_modal');
    assert.equal(closedModal, true);
  });

  it('clamps scroll speed within [0.5, 10.0]', () => {
    let speed = 2.0;
    const adjustSpeed = (delta: number) => {
      speed = Math.max(0.5, Math.min(10.0, speed + delta));
    };

    // Decrease below min
    for (let i = 0; i < 10; i++) adjustSpeed(-0.5);
    assert.equal(speed, 0.5, 'Speed must clamp at minimum 0.5x');

    // Increase above max
    for (let i = 0; i < 30; i++) adjustSpeed(0.5);
    assert.equal(speed, 10.0, 'Speed must clamp at maximum 10.0x');
  });

  it('clamps transposition within [-11, +11]', () => {
    let semitones = 0;
    const transpose = (delta: number) => {
      semitones = Math.max(-11, Math.min(11, semitones + delta));
    };

    for (let i = 0; i < 20; i++) transpose(-1);
    assert.equal(semitones, -11, 'Transposition must clamp at -11 semitones');

    for (let i = 0; i < 30; i++) transpose(1);
    assert.equal(semitones, 11, 'Transposition must clamp at +11 semitones');
  });
});
