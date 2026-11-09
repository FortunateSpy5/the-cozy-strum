# 🎸 The Cozy Strum

> **A personal, ad-free, 100% static guitar & ukulele chord and ASCII tablature sanctuary.**  
> Inspired by `tabs.ultimate-guitar.com`, built for distraction-free practice.

Part of the **Cozy Web Suite**:
- 🍳 [**The Cozy Skillet**](https://github.com/FortunateSpy5/the-cozy-skillet) — Distraction-free culinary recipe collection.
- 🛒 [**The Cozy Cart**](https://github.com/FortunateSpy5/the-cozy-cart) — Intentional grocery planning & mindful pantry tracking.
- 🎸 [**The Cozy Strum**](https://github.com/FortunateSpy5/the-cozy-strum) — Warm acoustic sanctuary for string players.

---

## ✨ Features

- **Zero Distractions**: No subscription banners, no popups, no auto-playing video ads, no telemetry.
- **100% Static Pre-rendering**: Powered by Astro 5 with static output (`output: 'static'`) deployed on Netlify with 33+ pre-rendered seed songs directly in static HTML.
- **Dynamic SVG Chord Diagrams**: Instant fretboard diagrams for 6-string Guitar (`E A D G B e`) and 4-string Ukulele (`G C E A`), complete with finger numbers, nut indicators, barre arcs, and muted/open string markers.
- **Deterministic Transposition & Capo Calculator**: Shift chords across all 12 chromatic semitones (`-11` to `+11`) with smart enharmonic spelling and slash chord support (`D/F#`).
- **Screen Wake Lock Integration**: Automatically requests screen wake lock during practice so phone and laptop screens never dim mid-song.
- **Unified Width & 60fps Scroll Engine**:
  - Consistent `max-w-6xl mx-auto px-4 sm:px-6` geometry aligned to the header navbar across the entire song player.
  - Solid opaque `bg-surface` practice dock and header, completely eliminating frosted glass GPU compositor stalls and scroll jitter.
- **Sticky Practice Dock**:
  - **Calibrated Auto-Scroller**: Smooth `requestAnimationFrame` scroller (`0.5x` to `10.0x`, ~14 px/s at 1.0x) with subpixel accumulation preventing fractional freeze, `Space` toggle, and smart pause on manual wheel scroll.
  - **Fit-to-Screen Stage Mode (`S` / `C`)**: Multi-column layout with section break protection to read full songs without scrolling on desktop/tablets.
  - **Web Audio Click Metronome (`M`)**: High-precision synthetic click engine (40–240 BPM), volume control, and animated strumming rhythm visualizer (`D - D U - U D U`).
  - **Instrument Toggle (`I`)**: Instantly switch between Guitar and Ukulele voicings.
  - **Font Sizing (`A-` / `A+`)**: Proportional monospace scaling.
  - **Mobile Touch Optimization**: Compact single-row dock avoiding awkward multi-row wrapping on small phone screens.
- **Parchment & Campfire Aesthetic**: Warm Latte Light Mode (`#FAF6F0`) and eye-friendly Campfire Dark Mode (`#14110F`) with instant local persistence.
- **Quick Paste Studio (`/import`)**:
  - Live split-screen parser: paste raw text from Ultimate Guitar on the left, see formatted chord badges and scroll-safe ASCII tab staves on the right.
  - **Save to Browser**: Instant `localStorage` persistence routing to dedicated `/player?slug=...` static player without 404s.
  - **Backup & Restore (JSON / ZIP)**: 1-click export of lightweight JSON backups or full PKZIP archives of Markdown files for direct Git repository ingestion.
  - **Download `.md`**: Exports clean Astro Content Collection Markdown with validated YAML frontmatter.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **SSG Framework** | [Astro 5.x](https://astro.build/) (`output: 'static'`, Strict Mode) |
| **Interactive Islands** | [React 19](https://react.dev/) (`@astrojs/react`) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) with CSS Custom Properties |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Audio Engine** | Web Audio API (`AudioContext`, synthetic oscillators) |
| **Screen Wake Lock** | Screen Wake Lock API (`navigator.wakeLock`) |
| **Archive Engine** | Custom zero-dependency pure JS PKZIP & CRC-32 generator |
| **Test Runner** | Node.js built-in test runner (`tsx --test`) |
| **Deployment** | Netlify Static Hosting (`netlify.toml`) |

---

## 📐 Modularity & Code Quality Rules

The codebase follows the strict guidelines set in [`AGENTS.md`](./AGENTS.md):
- **The 200-Line Limit**: Every single source file in `src/` is strictly under 200 lines of code (highest file is 192 lines).
- **Zero `any` & Strict Types**: Fully typed with strict TypeScript and Astro check.
- **Pure Music-Theory Isolation**: Transposition, chord parsing, and voicing lookups in `src/lib/` are pure, deterministic functions with 100% automated test coverage.
- **Comprehensive Test Suite**: 65+ automated unit, music theory, accessibility, and Web Interface Guidelines tests across 11 suites.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
# Open http://localhost:4321
```

### 3. Run Automated Tests
```bash
npm test
# Executes all unit, music theory, and a11y tests
```

### 4. Build for Production
```bash
npm run build
# Runs astro check (0 errors) and pre-renders static HTML to /dist
```

### 5. Preview Static Build
```bash
npm run preview
```

---

## ⌨️ Keyboard Shortcuts Cheat Sheet

| Key | Action |
|---|---|
| `Space` | Toggle Auto-Scroll Play / Pause |
| `↑` / `↓` | Increase / Decrease Auto-Scroll Speed |
| `[` / `]` | Transpose Down / Up 1 Semitone |
| `0` | Reset Transposition to Original Key |
| `M` | Open / Close Metronome |
| `C` | Toggle Single-Column $\leftrightarrow$ Two-Column Stage Mode |
| `I` | Toggle Guitar $\leftrightarrow$ Ukulele Voicings |
| `Esc` | Close any active modal (Metronome) |

---

## 📄 License

MIT © [The Cozy Suite](https://github.com/FortunateSpy5)
