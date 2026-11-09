# The Cozy Strum — Interaction & UX Design Specification

This specification defines the interactive components, player behaviors, keyboard shortcuts, and visual layouts for **The Cozy Strum**.

---

## 1. The Sticky Practice Control Dock

The Practice Dock is the musician's command cockpit during practice sessions. It is permanently fixed to the bottom of the viewport with unified `max-w-6xl mx-auto px-4 sm:px-6` geometry matching the navbar, a solid opaque `bg-surface` background that prevents GPU scroll jitter, and high-contrast tactile buttons.

### 1.1 Variable-Speed Auto-Scroller
- **Physics**: Implemented using `window.requestAnimationFrame` with high-precision timestamp delta tracking and a subpixel accumulator (`subPixelAccumulatorRef`) preventing fractional pixel truncate-to-zero freezes at low speeds (`0.5x`).
- **Speed Granularity**: `0.5x` to `10.0x` (with `0.5x` steps). Calibrated base tempo: $\approx 14\text{ px/sec}$ at $1.0\text{x}$.
- **Spacebar Toggle**: Pressing the `Space` key instantly pauses or resumes the scroller (unless focused inside a text input or textarea).
- **Smart Pause & Bottom Boundary**: Auto-scroll automatically halts upon reaching the bottom of the document and handles user manual touch/wheel interrupts without stutter.

### 1.2 Unified Width & Two-Column "Fit-to-Screen" Stage Mode
- **Unified Width**: In single-column mode, all song content, chord lines, lyric staves, and section header dividers expand to full width (`w-full`) inside `max-w-6xl mx-auto px-4 sm:px-6`, visually locking to the navbar edges.
- **Stage Mode (`S` / `C`)**: Two-column layout (`md:columns-2 gap-8 break-inside-avoid w-full`) or three-column (`lg:columns-3`). Sections (`[Verse]`, `[Chorus]`) use `break-inside: avoid` so sections are never chopped across columns. Stage mode controls are desktop-only (`hidden md:flex`) to avoid squishing lyrics on mobile screens.

### 1.3 Mobile Practice Dock Optimization
On mobile touch devices (<768px):
- Single-row sleek touch dock (`overflow-x-auto scrollbar-none flex-nowrap items-center justify-between`) eliminating awkward multi-row wrapping.
- Desktop-only controls (`Stage Mode`, physical `Keyboard Shortcuts`) are hidden to preserve screen real estate.
- Steppers are calibrated to compact touch-friendly dimensions (`min-h-[44px] min-w-[34px]`) satisfying WCAG 2.1 AA tap target requirements without screen clutter.

### 1.4 Transposition & Capo Calculation
- **Step Controls**: `[-]` and `[+]` semitones relative to original key (`-11` to `+11`).
- **Pitch Readout**: e.g. `Key: G (+2)` with 1-click `[0]` reset button.
- **Dynamic Voicings**: Live recalculation of all chord diagrams in the Pinned Chord Strip and inline click inspector.

### 1.5 Instrument Switcher (Guitar $\leftrightarrow$ Ukulele)
- 1-click toggle switches the active chord voicing dictionary between 6-string Guitar (`E A D G B e`) and 4-string Ukulele (`G C E A`).
- The entire Pinned Chord Strip and inline chord hover/click popovers immediately switch diagrams.

### 1.6 Typography Scaling (`A-` / `A+`)
- Dynamic scaling across 4 discrete levels: `Small (13px)`, `Medium (15px)`, `Large (18px)`, `Extra Large (22px)`.
- Adjusts chords, lyrics, and ASCII tab characters proportionately while preserving monospace character ratios.

### 1.7 Web Audio Click Metronome & Strumming Pattern Visualizer
- **Metronome Engine**: Pure `AudioContext` oscillator generating high-pitch pip (`880Hz`, 20ms click) on beat 1 and standard tick (`440Hz`, 15ms click) on sub-beats.
- **BPM Range**: `40` to `240` BPM with stepper buttons and slider.
- **Strumming Rhythm**: Displays downstroke `D`, upstroke `U`, and rests with high-contrast badge indicators.

---

## 2. Keyboard Shortcuts Cheat Sheet

| Key | Action | Context |
|---|---|---|
| `Space` | Toggle Auto-Scroll Play / Pause | Tab Player |
| `↑` / `↓` | Increase / Decrease Auto-Scroll Speed ($\pm0.5\text{x}$) | Tab Player |
| `[` / `]` | Transpose Down / Up 1 Semitone | Tab Player |
| `0` | Reset Transposition to Original Key | Tab Player |
| `S` or `C` | Toggle Multi-Column Stage Mode | Tab Player (Desktop) |
| `I` | Switch Instrument (Guitar $\leftrightarrow$ Ukulele) | Tab Player |
| `M` | Open / Close Metronome Modal | Tab Player |
| `?` | Show Keyboard Shortcuts Modal | Global |
| `Esc` | Close any active modal / overlay | Global |

---

## 3. Screen Wake Lock Integration

When viewing a song tab or running the auto-scroller, **The Cozy Strum** requests a screen wake lock (`navigator.wakeLock.request('screen')`) via [`useWakeLock.ts`](file:///c:/Users/msoum/OneDrive/Documents/GitHub/the-cozy-strum/src/components/player/useWakeLock.ts).
- Musicians can practice uninterrupted without the device dimming or locking while both hands are on their guitar or ukulele.
- Includes a manual toggle button in the [`ShortcutLegendBar`](file:///c:/Users/msoum/OneDrive/Documents/GitHub/the-cozy-strum/src/components/player/ShortcutLegendBar.tsx) to switch between "Screen Awake" and "Screen Sleep OK".
- Automatically re-acquires the lock on document visibility change when returning to the tab.

---

## 4. The Pinned Song Chords Strip

Located directly underneath the Song Header:
- Extracts every distinct chord token from the parsed song.
- Displays a horizontal scrollable carousel of mini SVG chord diagrams.
- Clicking any chord expands an enlarged chord box with alternative voicings (e.g., barre vs open vs capo).
- Clicking or hovering an inline chord within the song lyrics instantly spotlights that chord in the strip.
