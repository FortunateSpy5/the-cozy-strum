# The Cozy Strum — Interaction & UX Design Specification

This specification defines the interactive components, player behaviors, keyboard shortcuts, and visual layouts for **The Cozy Strum**.

---

## 1. The Sticky Practice Control Dock

The Practice Dock is the musician's command cockpit during practice sessions. It is permanently fixed to either the bottom or top of the viewport with a frosted glass backdrop and high-contrast tactile buttons.

### 1.1 Variable-Speed Auto-Scroller
- **Physics**: Implemented using `window.requestAnimationFrame` with high-precision timestamp delta tracking.
  $$\Delta y = \text{speed} \times (\Delta t / 16.67) \times 0.75\text{ px}$$
- **Speed Granularity**: `0.5x` to `10.0x` (with `0.5x` steps).
- **Spacebar Toggle**: Pressing the `Space` key instantly pauses or resumes the scroller (unless focused inside a text input).
- **Smart Manual Pause**: If the user scrolls with their mouse wheel or touch gesture while auto-scroll is active, auto-scroll pauses temporarily for 2 seconds and smoothly resumes without jitter.
- **Visual Feedback**: Subtle glowing indicator pulse when auto-scrolling is active.

### 1.2 Two-Column / Three-Column "Fit-to-Screen" Stage Mode
Musicians with wide desktop monitors, laptops, or tablets in landscape orientation prefer reading an entire song without scrolling.
- **Single Column**: Standard responsive mobile & reading flow (`max-w-3xl mx-auto`).
- **Two Columns**: CSS multi-column or CSS Grid layout (`columns-2 gap-8 break-inside-avoid`). Sections (`[Verse]`, `[Chorus]`) use `break-inside: avoid` so sections are never chopped across columns.
- **Three Columns**: Wide screens (`>= 1440px`) can display full 3-column stage mode for longer acoustic epics.

### 1.3 Transposition & Dynamic Capo Calculator
- **Step Controls**: `[-]` and `[+]` semitones relative to original key.
- **Pitch Readout**: e.g. `Original Key: G` $\rightarrow$ `Transposed: +2 (A)`.
- **Dynamic Capo Helper**: When a player wants to play open chord shapes with a Capo:
  - Button: "Capo Recommendation": Recommends easiest key (e.g. "Capo 3: Play in D shapes").
  - Live recalculation of all chord diagrams in the Pinned Chord Strip.

### 1.4 Instrument Switcher (Guitar $\leftrightarrow$ Ukulele)
- 1-click toggle switches the active chord voicing dictionary between 6-string Guitar (`E A D G B e`) and 4-string Ukulele (`G C E A`).
- The entire Pinned Chord Strip and inline chord hover popovers immediately switch diagrams.

### 1.5 Typography Scaling (`A-` / `A+`)
- Dynamic scaling across 4 discrete levels: `Small (13px)`, `Medium (15px)`, `Large (18px)`, `Extra Large (22px)`.
- Adjusts chords, lyrics, and ASCII tab characters proportionately while preserving monospace character ratios.

### 1.6 Web Audio Click Metronome & Strumming Pattern Visualizer
- **Metronome Engine**: Pure `AudioContext` oscillator generating high-pitch pip (`880Hz`, 20ms click) on beat 1 and standard tick (`440Hz`, 15ms click) on sub-beats.
- **BPM Slider & Tap Tempo**: `40` to `240` BPM.
- **Strumming Pattern Visualizer**:
  - Displays rhythm arrows: `D` (Downstroke $\downarrow$), `U` (Upstroke $\uparrow$), `-` (Rest/Miss $\cdot$).
  - Animated bouncing dot pulsing in sync with the Web Audio metronome clock.

---

## 2. Keyboard Shortcuts Cheat Sheet

| Key | Action |
|---|---|
| `Space` | Toggle Auto-Scroll Play / Pause |
| `↑` / `↓` | Increase / Decrease Auto-Scroll Speed |
| `[` / `]` | Transpose Down / Up 1 Semitone |
| `0` | Reset Transposition to Original Key |
| `M` | Toggle Metronome On / Off |
| `C` | Toggle 1-Column $\leftrightarrow$ 2-Column Stage Mode |
| `I` | Toggle Guitar $\leftrightarrow$ Ukulele Voicings |
| `Esc` | Close any active modal or popover |

---

## 3. The Pinned Song Chords Strip

Located directly underneath the Song Header:
- Extracts every distinct chord token from the parsed song.
- Displays a horizontal scrollable carousel of mini SVG chord diagrams.
- Clicking any chord expands an enlarged chord box with alternative voicings (e.g., barre vs open vs capo).
- Clicking or hovering an inline chord within the song lyrics instantly spotlights that chord in the strip.
