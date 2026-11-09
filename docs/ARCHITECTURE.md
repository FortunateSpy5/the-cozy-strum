# The Cozy Strum — System Architecture & Data Flow

This document details the complete static architecture, data structures, and deployment pipelines for **The Cozy Strum**.

---

## 1. High-Level System Architecture

```mermaid
flowchart TD
    subgraph BuildTime ["Static Build Phase (Astro 5 & SSG)"]
        GitFiles["Git Markdown Tabs<br/>(src/content/tabs/*.md)"]
        ZodValidator["Content Collections<br/>Strict Zod Schema"]
        AstroPages["Astro Static Generator<br/>(output: 'static')"]
        PreRendered["Pre-rendered HTML/CSS<br/>(/dist/index.html, /dist/tabs/*)"]
        
        GitFiles --> ZodValidator
        ZodValidator --> AstroPages
        AstroPages --> PreRendered
    end

    subgraph ClientRuntime ["Client Runtime (Browser Islands)"]
        LocalStorage["Browser localStorage<br/>- Custom Tabs<br/>- Saved Setlists<br/>- Transposition State<br/>- UI Preferences"]
        
        PlayerIsland["TabPlayerIsland.tsx<br/>(client:load)"]
        ImporterIsland["TabImporterIsland.tsx<br/>(client:load)"]
        LibraryIsland["LibraryGrid.tsx<br/>(client:load)"]
        
        LocalStorage <--> LibraryIsland
        LocalStorage <--> PlayerIsland
        LocalStorage <--> ImporterIsland
    end

    subgraph AudioEngine ["Web Audio & Animation"]
        WebAudio["Web Audio API<br/>Synthetic Click Metronome"]
        AutoScroller["requestAnimationFrame<br/>Variable Speed Scroller"]
        
        PlayerIsland --> WebAudio
        PlayerIsland --> AutoScroller
    end

    PreRendered --> ClientRuntime
```

---

## 2. Content Collection Schema (`src/content/config.ts`)

Astro Content Collections enforce strict schema validation at build time via Zod:

```typescript
import { defineCollection, z } from 'astro:content';

export const tabsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().min(1),
    artist: z.string().min(1),
    instrument: z.enum(['guitar', 'ukulele']).default('guitar'),
    tuning: z.string().default('Standard (E A D G B e)'),
    capo: z.number().int().min(0).max(12).default(0),
    bpm: z.number().int().min(30).max(300).optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
    strummingPattern: z.string().optional(), // e.g. "D - D U - U D U"
    tags: z.array(z.string()).default([]),
    isFingerstyle: z.boolean().default(false),
    key: z.string().optional(), // e.g. "G", "Am"
    createdAt: z.string().or(z.date()).transform((val) => new Date(val).toISOString())
  })
});

export const collections = {
  tabs: tabsCollection
};
```

---

## 3. Browser `localStorage` Schema

To enable instant importing without database dependencies, client state is stored across three typed keys:

### 3.1 `cozy_strum_custom_tabs`
Array of user-imported tabs from the Quick Paste Studio:
```typescript
export interface UserTab {
  id: string;               // e.g. "custom-hotel-california-1712345678"
  slug: string;             // URL-friendly slug
  title: string;
  artist: string;
  instrument: 'guitar' | 'ukulele';
  tuning: string;
  capo: number;
  bpm?: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  strummingPattern?: string;
  tags: string[];
  isFingerstyle: boolean;
  content: string;          // Raw markdown tab body
  createdAt: string;        // ISO timestamp
  isCustom: true;
}
```

### 3.2 `cozy_strum_setlists`
Curated collections of songs for practice sessions:
```typescript
export interface Setlist {
  id: string;
  name: string;
  description?: string;
  songSlugs: string[];      // References to either built-in or custom tab slugs
  updatedAt: string;
}
```

### 3.3 `cozy_strum_prefs`
Global UI and player settings:
```typescript
export interface UserPreferences {
  theme: 'parchment' | 'campfire';
  defaultInstrument: 'guitar' | 'ukulele';
  fontSize: 'sm' | 'base' | 'lg' | 'xl';
  autoScrollSpeed: number;  // 0.5 to 10.0
  columnMode: 'single' | 'two-column' | 'three-column';
  dockPosition: 'bottom' | 'top';
  metronomeVolume: number;  // 0.0 to 1.0
}
```

---

## 4. Netlify Deployment Architecture

The site builds into a pure static `/dist` directory with zero runtime Node server:

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "microphone=(), camera=(), geolocation=(), screen-wake-lock=(self)"

[[headers]]
  for = "/_astro/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.woff2"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[redirects]]
  from = "/custom"
  to = "/player"
  status = 301
  force = false
```

---

## 5. Unified Layout Geometry & 60fps Compositor Stabilization

### 5.1 Standardized Width Alignment (`max-w-6xl`)
To eliminate visual dissonance from disparate container breakpoints, all core interface tiers align strictly to the Header navbar geometry:
- **Navbar**: `max-w-6xl mx-auto px-4 sm:px-6`
- **Main Viewport & Song Header**: `max-w-6xl mx-auto px-4 sm:px-6`
- **Tab Sheet & Section Lines**: `w-full` within `max-w-6xl`
- **Shortcut Legend Bar**: `max-w-6xl mx-auto px-4 sm:px-6`
- **Sticky Practice Dock**: `max-w-6xl mx-auto px-4 sm:px-6`

### 5.2 Scroll Jitter Elimination (Frosted Glass Removal)
Applying CSS `backdrop-filter: blur(...)` to fixed floating elements during continuous requestAnimationFrame scrolling forces Chromium/Gecko/WebKit to continuously re-rasterize and re-blur moving font glyphs, causing GPU compositor pipeline stalls and visible frame jitter.
- Replaced semi-transparent blurred surfaces with solid, opaque `bg-surface` (`#F3ECE1` light / `#1E1916` dark).
- Enforced isolated GPU compositor layers via `transform-gpu` and `will-change: transform`.
- Guaranteed a continuous 60fps/120fps auto-scroll experience with zero dropped frames.

---

## 6. Backup & Restore Architecture (`src/lib/storage/`)

### 6.1 JSON Serialization & Security
- `exportAllTabsAsJson()`: Serializes all browser-stored `UserTab` entries with ISO metadata and client origin markers.
- `restoreTabsFromJson()`: Validates input JSON with defensive schema enforcement, deep key validation, and protection against `__proto__` prototype pollution.

### 6.2 Zero-Dependency Pure JS ZIP Engine (`src/lib/storage/zipEngine.ts`)
- Implements standard PKZIP 2.0 format (`PK\x03\x04` local headers, `PK\x01\x02` central directory headers, and `PK\x05\x06` End of Central Directory).
- Computes standard IEEE 802.3 CRC-32 checksums with a precomputed polynomial table.
- Converts stored browser tabs directly into `.md` files with valid Zod frontmatter, packaged into a `.zip` archive ready to extract into `src/content/tabs/`.
