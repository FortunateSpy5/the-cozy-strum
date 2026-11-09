# AGENTS.md: The Cozy Strum Agent Constitution

Welcome to **The Cozy Strum** codebase. This document establishes the architectural principles, code standards, and agent guidelines for developing and maintaining this project.

## 1. Project Mission & Cozy Ecosystem Alignment

**The Cozy Strum** is a personal, ad-free, 100% static guitar and ukulele chord & ASCII tablature sanctuary inspired by `tabs.ultimate-guitar.com`. It is part of the "Cozy" web suite:
- **The Cozy Skillet**: [FortunateSpy5/the-cozy-skillet](https://github.com/FortunateSpy5/the-cozy-skillet) — distraction-free culinary recipe collection.
- **The Cozy Cart**: [FortunateSpy5/the-cozy-cart](https://github.com/FortunateSpy5/the-cozy-cart) — intentional grocery planning and mindful pantry tracking.
- **The Cozy Strum**: [FortunateSpy5/the-cozy-strum](https://github.com/FortunateSpy5/the-cozy-strum) — warm, distraction-free practice environment for string players.

### Core Philosophy
1. **Zero Distraction Practice**: No paywalls, no popups, no auto-playing video ads, no subscription banners.
2. **Instant Static Performance**: 100% static pre-rendered HTML via Astro 5, hydrated only where interactivity is required.
3. **Parchment & Campfire Aesthetic**: Warm tones, editorial serif headers, clean sans-serif UI, and rock-solid monospace tab alignment.
4. **Git-Backed Core + LocalStorage Agility**: Built-in tabs live in Git Markdown collections; quick pastes live in `localStorage` with 1-click Markdown export.

---

## 2. Tech Stack & Directory Blueprint

| Layer | Technology |
|---|---|
| **Framework** | Astro 5.x (`output: 'static'`, Strict Mode) |
| **Interactive Islands** | React 19 (`@astrojs/react`) |
| **Styling** | Tailwind CSS v4 / v3 with CSS custom properties |
| **Icons** | `lucide-react` |
| **Typography** | `Fraunces` / `Playfair Display` (Headings), `Plus Jakarta Sans` / `Inter` (UI), `JetBrains Mono` (Tabs) |
| **Deployment** | Netlify Static Hosting (`netlify.toml`) |

### Directory Structure
```
the-cozy-strum/
├── .agents/
│   ├── config.json
│   └── skills/
│       ├── ascii-chord-tab-engine/SKILL.md
│       ├── fretboard-chord-diagrams/SKILL.md
│       └── cozy-strum-brand/SKILL.md
├── docs/
│   ├── ARCHITECTURE.md
│   └── DESIGN_SPEC.md
├── public/
│   └── favicon.svg
├── src/
│   ├── content/
│   │   ├── config.ts
│   │   └── tabs/                  # Markdown files with Zod frontmatter
│   ├── components/
│   │   ├── common/                # Header, Footer, ThemeToggle, Badge
│   │   ├── library/               # SongCard, SearchFilterBar, SetlistGrid
│   │   ├── player/                # TabViewer, ChordStrip, StickyPracticeDock, Metronome
│   │   └── import/                # SplitPreview, MetadataForm, ExportActions
│   ├── lib/
│   │   ├── music/                 # Pure music theory: chordParser, transpose, chordVoicings
│   │   ├── parser/                # ASCII tab parser, line classifier, tokenizers
│   │   └── storage/               # typed localStorage wrappers, setlists, exportMd
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── pages/
│   │   ├── index.astro            # Library & Setlist Dashboard
│   │   ├── import.astro           # Quick Paste Studio
│   │   └── tabs/[...slug].astro   # Interactive Song Player
│   └── styles/
│       └── global.css
├── AGENTS.md
├── astro.config.mjs
├── package.json
├── tsconfig.json
└── netlify.toml
```

---

## 3. Strict Coding Rules for Gemini Flash & AI Agents

### Rule 1: The 200-Line Modularity Limit
- **Every single source file MUST remain under 200 lines of code.**
- If a component or module grows past 180 lines, immediately decompose it into single-responsibility subcomponents or helper utilities.
- For example, `TabPlayerIsland.tsx` coordinates state, but delegates rendering to `SongHeader.tsx`, `ChordStrip.tsx`, `TabContent.tsx`, and `StickyPracticeDock.tsx`.

### Rule 2: Zero `any` & Strict Types
- Never use `any`, `unknown` without assertion, or `as unknown as T`.
- All data structures (ChordTokens, LineNodes, SectionBlocks, FretPositions, SongMetadata) must have explicit, exported TypeScript interfaces in `src/lib/`.

### Rule 3: Pure Music-Theory & Parser Isolation
- Keep all parsing and transposition logic in `src/lib/music/` and `src/lib/parser/` as pure, deterministic functions:
  ```ts
  // Pure function: deterministic input -> deterministic output
  export function transposeChord(chord: string, semitones: number): string;
  export function parseSongText(rawText: string): SongAst;
  ```
- Pure functions must never touch the DOM, window, or localStorage. This enables zero-regression unit testing.

### Rule 4: Strict Hydration Boundaries
- Keep Astro pages static. Only hydrate interactive components using `client:load` or `client:idle` when user state is involved:
  - `TabPlayerIsland`: `client:load` (Needs immediate playback controls, auto-scroll, transpose)
  - `TabImporterIsland`: `client:load` (Live split-screen parser)
  - `LibraryIsland`: `client:load` (Reads and merges browser `localStorage` tabs with build-time content)
- Keep Layouts, Header, Footer, and static markdown wrappers as pure `.astro` zero-JS components.

### Rule 5: Scope Boundaries
- Support **Chords over Lyrics**, **ChordPro** `[Am]`, and **ASCII Monospace Fingerpicking Tabs** (`e|---B|---G|---`).
- **DO NOT** import heavy binary Guitar Pro parsers (`.gp3`, `.gp5`, alphatab, soundfonts). All tablatures are pure text/ASCII and lightweight SVG chord diagrams.

### Rule 6: Monospace Tab Safety
- All ASCII tab blocks and chord lines must be rendered within `font-mono whitespace-pre` containers with `font-variant-ligatures: none` to guarantee absolute alignment between chords, lyrics, and fret numbers across all platforms.
