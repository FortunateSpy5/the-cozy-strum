# The Cozy Strum — Zero-Read Caching, Split Directory & UX Plan (v3.1)
**Primary Goal:** Keep Firestore usage near zero (well below the Spark Free Tier) by separating lightweight song names from heavy tab content, eliminating automatic homepage database queries, and moving the full song directory to `/explore`.

---

## 1. Database & Bandwidth Optimization Architecture

### 1.1 Three-Tier Data Separation (Never Fetch Unneeded Data)
1. **Homepage (`/`) — Zero-Read Landing Sanctuary:**
   - Visiting `/` triggers **0 Firestore queries** on mount.
   - Displays:
     - **Hero & Instant Search Input** (only loads `meta/song_directory` when the user actually clicks/types into the search box).
     - **"Jump Back In" (Recently Played):** Read 100% from `localStorage` (`cozy_strum_recent_songs`).
     - **"Featured / Pinned Starter Songs":** 3 hardcoded/bundled lightweight cards so new visitors can test the player without triggering a collection scan.
     - **CTA Button:** `"Browse Full Song Directory (/explore) →"`.

2. **Ultra-Light Song Name Index (`meta/song_directory`):**
   - Replaces heavy catalog queries. Stores ONLY compact tuples for search and directory listing:
     ```typescript
     // Stored in a single document: meta/song_directory
     interface CompactSongEntry {
       i: string; // tabId
       t: string; // Song Title
       a: string; // Artist Name
       ins: 'g' | 'u'; // 'g' = guitar, 'u' = ukulele
       d: 1 | 2 | 3;   // 1 = Beginner, 2 = Intermediate, 3 = Advanced
       f?: 1;          // 1 = Fingerstyle
       u: number;      // updatedAt epoch seconds
     }
     interface SongDirectoryDoc {
       version: number;
       lastUpdated: number;
       songs: CompactSongEntry[];
     }
     ```
   - By using short keys and excluding `content`, `chordsUsed`, `strummingPattern`, and `tuning`, **1,000 songs take less than 65 KB** and cost **1 single Firestore document read**.

3. **Aggressive Client Caching (`24-Hour TTL` + `IndexedDB`):**
   - **`localStorage` Directory Cache (`cozy_strum_dir_v1`):**
     - Cached for **24 hours (`86,400,000 ms`)**.
     - Even if a user visits `/explore` 50 times a day or searches 100 times, it reads from `localStorage` in memory (**0 Firestore reads**).
     - Includes a manual `"↻ Sync New Songs"` button if they explicitly want to check for newly approved community songs before the 24h TTL expires.
   - **Immutable Tab Content Cache (`getDocFromCache` First):**
     - When opening `/tab?id={tabId}`, always call `getDocFromCache(doc(db, 'tabs', tabId))` first.
     - Only call `getDocFromServer` if the song is not yet in IndexedDB cache (or if its `u` timestamp in `meta/song_directory` is newer than the cached version).

---

## 2. Page Structure & Navigation Updates

### 2.1 Homepage (`/`) — Personal Practice Desk
- **No Full Catalog Dump:** Remove the full song grid from `/`.
- **Sections on `/`:**
  1. **Search Bar (Lazy-Loaded):** Focusing the input reads `cozy_strum_dir_v1` from `localStorage` (or fetches `meta/song_directory` once if not cached) and shows instant autocomplete dropdown results (`Song Name — Artist`).
  2. **Continue Practicing (`localStorage`):** Shows the last 6 songs the user actually opened on this device (0 DB reads).
  3. **My Favorites & Setlists Quick-Access:** Reads from cached user profile if signed in.
  4. **Explore Directory Banner:** Clean link to `/explore` for browsing all songs.

### 2.2 Dedicated Directory Page (`/explore`) — Lightweight Name-Only Browser
- New page `src/pages/explore.astro` + `ExploreDirectoryIsland.tsx`:
  - Loads the compact `meta/song_directory` (from 24h `localStorage` cache first; 1 read on cache miss).
  - Displays a clean, high-density **Alphabetical / Filterable Song Directory** showing **Song Title**, **Artist**, and **Instrument badge** (Guitar / Ukulele) with client-side pagination (25 songs per page) so DOM rendering stays instantaneous.
  - Clicking any song row navigates to `/tab?id={tabId}`, which is the **only** moment the full chord/tab document is fetched.

---

## 3. Player & Submission UX Improvements

### 3.1 Ergonomic Tab Player (`/tab?id=...`)
- **Zero-CLS Skeleton Loader:** Smooth parchment skeleton while IndexedDB/Firestore loads the single song document.
- **Smart Capo / "Simplify Chords" Recommender (`src/lib/music/capoOptimizer.ts`):** Suggests 1-click Capo + Transpose settings when a song contains difficult barre chords (`F`, `Bm`, `Bb`, `F#m`).
- **Auto-Scroll 3-Second Count-In & Section Jump Pills:** Clickable `[Intro]`, `[Verse]`, `[Chorus]` jump pills and a `3-2-1` count-in delay so you can put both hands on your guitar before scrolling starts.
- **Web Audio Chord Strum & Left-Handed Toggle:** Click any SVG chord diagram to hear it strummed via Web Audio API, or mirror diagrams for left-handed players.

### 3.2 Frictionless Song Submission Studio (`/submit`)
- **LRCLIB Auto-Lyrics + Visual "Click-Word-to-Place-Chord" Mode:** Fetch plain lyrics from `lrclib.net`, pick a chord from a palette, and click directly on any lyric word to snap the chord above it without typing manual spaces.
- **Admin Approval Syncs `meta/song_directory`:** When an Admin approves a song in `/admin` (or removes one via DMCA), a Firestore `writeBatch` updates both `tabs/{tabId}` and the compact `meta/song_directory` doc simultaneously.