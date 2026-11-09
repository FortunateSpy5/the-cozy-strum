# The Cozy Strum — Architecture & Phased Implementation Plan (v2.0)
**Target Stack:** Astro 5 (Static Shell on Netlify) + React 19 Islands + Tailwind CSS + Firebase v11 (Auth & Cloud Firestore) + LRCLIB Open-Source Lyrics API + Near-Zero Read Multi-Layer Cache + Local Audio-to-Chord Pipeline

---

## 1. System Overview & Core Pillars

1. **100% Database-Backed Catalog (Zero-Markdown Architecture):** Every song lives in Firestore (`tabs/{tabId}`) with a unique document ID. Eliminating static Git Markdown collections (`src/content/tabs/`) unifies the data model: every song can be played, searched, edited, or moderated/takedown-processed in real time without rebuilding or redeploying the static site.
2. **Near-Zero Firestore Read Optimization:**
   - **The "Catalog Index Document" Pattern (`meta/catalog_index`):** Instead of querying hundreds of individual documents on homepage load (which burns $N$ reads per visitor), maintain a single summary document `meta/catalog_index` containing a lightweight map of public approved songs. Loading the library costs **1 single read** (or **0 reads** via `localStorage` TTL).
   - **Heavy Payload Separation:** The full ASCII tab and lyric strings (`content`) reside exclusively in `tabs/{tabId}` and are only downloaded on demand when opening a song (`/tab?id=...`).
   - **Cache-First Doc Fetch (`getDocFromCache` First):** When opening a tab, the client checks IndexedDB first. If the cached version's `updatedAt` matches the catalog index, Firestore is never queried (**0 server reads**).
   - **`localStorage` TTL (15 Minutes):** The parsed catalog index is cached in `localStorage` (`cozy_strum_catalog_cache`) with a 15-minute TTL plus a manual "Refresh" button.
3. **Clean Predefined Multi-Category Taxonomy (Zero `&` Clutter):** Songs are assigned to one or more predefined, industry-standard categories without compound ampersand strings (e.g., `['Acoustic', 'Folk']`, `['Bollywood', 'Soundtrack']`, `['Classic Rock', 'Fingerstyle']`).
4. **Google Auth & Personal Practice Ecosystem:** 1-click Google Sign-In unlocking Favorites, Custom Setlists, Per-Song Practice Memory (remembering a user's preferred Capo, Transpose offset, and Auto-scroll speed per song debounced by 2500ms), and Private Vault tabs.
5. **Community Song Submissions + LRCLIB Assist:** Logged-in users can submit Guitar/Ukulele chords & ASCII tabs. Built-in **LRCLIB API (`https://lrclib.net/api/get`)** integration lets users auto-fill plain or timestamped lyrics in one click before adding chords.
6. **Admin Moderation & DMCA Compliance Center (`/admin` & `/dmca`):** Role-based admin dashboard to review, approve, edit, or reject user-submitted tabs, and process DMCA copyright takedown requests with 1-click soft-deletion (`status: 'removed_dmca'`), updating `meta/catalog_index` atomically.
7. **Automated Audio + LRCLIB Sync Generator (`tools/chord-sync/`):** Local Python CLI tool running on your personal machine that pairs **LRCLIB time-synced `.lrc` lyrics** with open-source audio chord detection (`chord-extractor` / `librosa` / `demucs`) to automatically align chords over lyrics without heavy speech-to-text models.

---

## 2. Category & Genre Taxonomy Design

### 2.1 The Ampersand Problem vs. Modern Multi-Tagging
Legacy music catalogs (ID3v1 tags, early iTunes, basic CMS dropdowns) allowed only **one single genre** per track. To accommodate hybrid styles, catalogers mashed genres together using ampersands: `Acoustic & Folk`, `Blues & Soul`, `Reggae & Island`, `Pop & Ballad`.

In modern web design (Spotify, Apple Music, Ultimate Guitar, Discogs), this creates serious problems:
1. **Visual Clutter:** Compound badges like `[Fingerstyle & Instrumental]` or `[Rabindra Sangeet & Bengali]` look clumsy and cause ugly line-wrapping on mobile cards.
2. **Taxonomic Inaccuracy:** "Blues" is musically and harmonically distinct from "Soul". "Reggae" is distinct from Hawaiian/Polynesian "Island" music.
3. **Filter Fragmentation:** Searching or filtering for "Folk" requires messy substring splitting instead of clean set membership checks.
4. **Multi-Tagging Redundancy:** Because The Cozy Strum supports multiple categories per song (`categories: SongCategory[]`), compound strings are completely obsolete. If a song is acoustic folk, it simply gets `['Acoustic', 'Folk']`.

### 2.2 Predefined Master Categories (25 Clean Terms)
To maintain high data quality and predictable filtering, categories are **strictly predefined** while allowing **multiple categories per song**:

```typescript
export const SONG_CATEGORIES = [
  'Acoustic',
  'Folk',
  'Singer-Songwriter',
  'Classic Rock',
  'Rock',
  'Indie',
  'Alternative',
  'Pop',
  'Ballad',
  'Campfire',
  'Fingerstyle',
  'Bollywood',
  'Hindi Indie',
  'Bengali Modern',
  'Rabindrasangeet',
  'Soundtrack',
  'Country',
  'Americana',
  'Blues',
  'Soul',
  'R&B',
  'Jazz',
  'Bossa Nova',
  'Reggae',
  'World',
] as const;

export type SongCategory = typeof SONG_CATEGORIES[number];
```

### 2.3 User Catalog Mapping (`docs/SAVED_SONGS.md`)
The 25 categories directly cover the user's 231 saved Ultimate Guitar songs across all 9 batches:
- **Rabindranath Tagore:** `['Rabindrasangeet', 'Acoustic']`
- **Anjan Dutt, Taalpatar Shepai, Chandrabindoo:** `['Bengali Modern', 'Folk', 'Indie']`
- **Bengali Cinema Soundtracks (Hemlock Society, Baishe Srabon, Autograph):** `['Soundtrack', 'Bengali Modern', 'Acoustic']`
- **Hindi Indie (Anuv Jain, Prateek Kuhad, The Local Train, Justh):** `['Hindi Indie', 'Acoustic', 'Singer-Songwriter']`
- **Bollywood Classics (Barfi, Jab We Met, Yeh Jawaani Hai Deewani, Piku):** `['Bollywood', 'Soundtrack', 'Ballad']`
- **The Beatles Anthology & 60s/70s Classics:** `['Classic Rock', 'Rock', 'Acoustic', 'Fingerstyle']`
- **Acoustic Storytellers (Ed Sheeran, Jason Mraz, James Arthur, Damien Jurado):** `['Singer-Songwriter', 'Pop', 'Acoustic']`
- **Modern Indie & Alternative (Vance Joy, Coldplay, Green Day, Kodaline, Lumineers):** `['Indie', 'Alternative', 'Rock', 'Campfire']`
- **Modern Ballads & Global Hits (Lewis Capaldi, Pink Sweat$, Wacci):** `['Pop', 'Ballad', 'Soul', 'World', 'Soundtrack']`
- **Country & Roots (Johnny Cash, Willie Nelson, Patsy Cline):** `['Country', 'Americana', 'Folk']`

---

## 3. Cloud Firestore Data Model & Ideated Architecture

### 3.1 `meta/catalog_index` (The 1-Read Catalog Pattern)
Single lightweight document summarizing all approved public songs for instant search, filtering, and grouping.
```typescript
interface TabSummary {
  id: string;
  slug: string;
  title: string;
  artist: string;
  album?: string;
  releaseYear?: number;
  category?: string;
  categories: SongCategory[];
  instrument: 'guitar' | 'ukulele';
  tuning: string;
  capo: number;
  bpm?: number;
  key?: string;
  timeSignature?: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  isFingerstyle: boolean;
  chordsUsed: string[];
  updatedAt: string;
}

interface CatalogIndexDoc {
  lastUpdated: string;
  totalCount: number;
  items: Record<string, TabSummary>; // Keyed by tabId
  categoryCounts?: Partial<Record<SongCategory, number>>; // Pre-computed genre counters
  decadeCounts?: Record<string, number>;                  // e.g. "1960s": 14, "2010s": 42
}
```

### 3.2 `tabs/{tabId}`
Stores all approved, draft, and private songs with full text/ASCII payload.
```typescript
interface CloudTab extends TabSummary {
  content: string;             // Raw ChordPro / Chords-over-Lyrics / ASCII Tab string
  strummingPattern?: string;   // e.g., "D - D U - U D U"
  lrclibId?: number;           // Optional reference ID from lrclib.net
  
  // Ownership & Visibility
  authorUid: string;
  authorName: string;
  visibility: 'private' | 'public'; 
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'removed_dmca';
  rejectionReason?: string;
  
  // Metrics
  favoritesCount: number;
  viewsCount: number;
  createdAt: string;
}
```

### 3.3 `users/{uid}`
Stores user profile, role, Favorites, and per-song practice overrides.
```typescript
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'user' | 'admin';
  favoriteTabIds: string[];
  recentlyPlayedIds: string[]; // Capped at last 20 played songs
  songPreferences: {
    [tabId: string]: {
      transpose: number;       // -11 to +11
      capoOverride?: number;   // Custom capo position
      scrollSpeed?: number;    // Preferred auto-scroll speed (0.5 - 10)
      instrumentView?: 'guitar' | 'ukulele';
    };
  };
  createdAt: string;
  updatedAt: string;
}
```

### 3.4 `tab_revisions/{tabId}/revisions/{revId}` (Ideated Structure: Revision History & Rollbacks)
Enables community contribution, diff viewing, and 1-click admin rollback if a user edit introduces formatting errors:
```typescript
interface TabRevision {
  id: string;
  tabId: string;
  songTitle: string;
  contributorUid: string;
  contributorName: string;
  changeSummary: string;       // e.g. "Corrected Chorus chords to Cadd9 and fixed verse 2 alignment"
  proposedContent: string;
  status: 'pending' | 'applied' | 'rejected';
  createdAt: string;
  reviewedByUid?: string;
  reviewedAt?: string;
}
```

### 3.5 `users/{uid}/practice_logs/{logId}` (Ideated Structure: Personal Practice Journal)
Allows musicians to log practice streaks without bloating the core user profile document:
```typescript
interface PracticeSessionLog {
  id: string;
  tabId: string;
  songTitle: string;
  artist: string;
  instrument: 'guitar' | 'ukulele';
  durationMinutes: number;
  bpmPracticed?: number;
  capoUsed: number;
  date: string; // ISO Date YYYY-MM-DD
}
```

### 3.6 `tab_reports/{reportId}` (Ideated Structure: Tab Feedback & Quality Flagging)
Separate from DMCA legal claims, this gives musicians a way to flag inaccurate chords, lyrics, or mobile rendering bugs:
```typescript
interface TabReport {
  id: string;
  tabId: string;
  songTitle: string;
  reporterUid?: string;
  reason: 'wrong_chords' | 'misaligned_tab' | 'incorrect_lyrics' | 'formatting_issue' | 'other';
  description: string;
  status: 'open' | 'investigating' | 'resolved';
  createdAt: string;
}
```

### 3.7 `setlists/{setlistId}`
Allows logged-in users to group songs into ordered setlists.
```typescript
interface Setlist {
  id: string;
  ownerUid: string;
  ownerName: string;
  title: string;
  description?: string;
  isPublic: boolean;
  tabIds: string[];
  createdAt: string;
  updatedAt: string;
}
```

### 3.8 `dmca_requests/{requestId}`
Publicly writable collection for copyright takedown notices, readable only by Admins.
```typescript
interface DmcaRequest {
  id: string;
  tabId: string;
  songTitle: string;
  artistName: string;
  claimantName: string;
  claimantEmail: string;
  companyOrRightsholder: string;
  infringingUrl: string;
  statementOfGoodFaith: boolean;
  digitalSignature: string;
  status: 'open' | 'approved_removed' | 'dismissed';
  adminNotes?: string;
  resolvedByUid?: string;
  createdAt: string;
  resolvedAt?: string;
}
```

---

## 4. Open-Source Lyrics + Audio Chord Automation Architecture (`LRCLIB`)

We integrate **LRCLIB (`https://lrclib.net/api`)** across two separate environments:

### Workflow A: In-Browser "Auto-Fill Lyrics" in the Submission Studio (`/submit`)
*Runs entirely in the user's browser without backend servers:*
1. User enters **Track Name** and **Artist Name** in the submission form and clicks **"Fetch Lyrics from LRCLIB"**.
2. Client calls `https://lrclib.net/api/search?track_name=${title}&artist_name=${artist}` (no API key needed, native CORS enabled).
3. User picks the matching track and pulls `plainLyrics` into the editor, automatically inserting blank chord lines above each lyric line so they can simply click or type chords (`Am`, `G`, `C`) at the right words.

### Workflow B: Local Automated Audio-to-Chord Aligner (`tools/chord-sync/`)
*Runs on your local PC (not hosted on the web):*
1. **Fetch Time-Synced Lyrics (`syncedLyrics`) from LRCLIB:**
   * Returns LRC lines with exact millisecond timestamps:
     `[00:14.20] Wise men say only fools rush in`
     `[00:21.50] But I can't help falling in love with you`
2. **Extract Timestamped Chords from Audio (`yt-dlp` + `chord-extractor` / `librosa` / `demucs`):**
   * Isolates harmony stems and extracts audio chord timestamps:
     `14.1s: C`, `16.4s: Em`, `18.8s: Am`, `21.4s: F`, `23.8s: C`, `26.1s: G`
3. **Deterministic Timestamp Merger (`sync_generator.py`):**
   * Maps every chord falling between line $N$'s timestamp (`14.20s`) and line $N+1$'s timestamp (`21.50s`) proportionally across the character length of that lyric line.
   * Uploads the resulting formatted Chord-over-Lyrics sheet directly to Firestore as a `private` or `pending_review` tab via `firebase-admin`, or outputs a clean JSON file ready to import.

---

## 5. Multi-Layer Client Caching Strategy (Near-Zero Reads)

| Layer | Strategy | Read Impact |
|---|---|---|
| **1. `localStorage` Catalog TTL** | Cache `meta/catalog_index` in `localStorage` (`cozy_strum_catalog_cache`) with a 15-minute TTL. | **0 reads** on page refreshes within the TTL window. |
| **2. Catalog Index Doc** | If cache is expired or missing, fetch `meta/catalog_index`. | **1 read** fetches the entire directory of hundreds of songs. |
| **3. `getDocFromCache` First** | When opening `/tab?id={tabId}`, query IndexedDB first. If cached `updatedAt` matches catalog index timestamp, skip network. | **0 reads** for repeat song practice. |
| **4. Debounced Writes** | Player overrides (capo, transpose) debounce Firestore write to `users/{uid}` by 2500ms. | Prevents write thrashing during rapid key adjustments. |

---

## 6. Phased Execution Roadmap

### Phase 1: Firebase Foundation, Google Auth & User Profile Bar *(Completed)*
- Client SDK initialization with multi-tab offline cache.
- Google Auth popup, auto-profile creation, and superadmin bootstrap.
- Modular `UserMenuIsland` in header with sign-in and avatar dropdown.
- Base `firestore.rules` and test suite.

### Phase 1.5: 100% Database Catalog & Read-Optimization Refactor *(Completed)*
- Removed static Markdown content collection (`src/content/tabs/`, `src/content/config.ts`).
- Created deterministic seed catalog in `src/lib/firebase/seedTabs.ts` with clean `categories` and `releaseYear`.
- Built read-optimized data service `src/lib/firebase/tabsService.ts` (`getCatalogIndex`, `getTabById`, `seedInitialTabs`).
- Added `/tab.astro` dynamic player route and Netlify rewrite `/tabs/* -> /tab?id=:splat 200`.
- Updated `LibraryIsland` and `LibraryFilterBar` with multi-category dropdown and 1-click sample seeder.

### Phase 2: Logged-In Practice Features (Favorites, Setlists & Per-Song Memory) *(Completed)*
- Heart / Favorite toggle on songs writing to `users/{uid}.favoriteTabIds` with real-time library grid filtering (`Favorites (N)`).
- Debounced (2500ms) sync of Transpose, Capo, and Auto-Scroll speed to `users/{uid}.songPreferences[tabId]`.
- Setlists manager (`/setlists`) for creating, ordering, and managing gig sets.
- Full-screen "Stage Mode / Gig Mode" dock with previous/next sequential performance navigation.

### Phase 3: Community Song Submission Studio + LRCLIB Lyrics Fetcher (`/submit`) *(Next Milestone)*
- Full submission studio with LRCLIB search modal (`https://lrclib.net/api/search`).
- Auto-insert blank chord lines above lyrics for 1-click chord positioning.
- Multi-category tag selector from predefined `SONG_CATEGORIES`.
- Private vault vs. Community submission (`status: 'pending_review'`).

### Phase 4: DMCA Takedown Portal & Admin Moderation Dashboard (`/dmca` & `/admin`)
- DMCA form island writing directly to `dmca_requests`.
- Protected Admin Dashboard: Submissions queue (Approve/Reject), DMCA queue (1-click Soft-Deletion `status: 'removed_dmca'`), and All Tabs manager.

### Phase 5: Local Audio + LRCLIB Automated Sync CLI (`tools/chord-sync/`)
- Local Python CLI tool (`tools/chord-sync/sync_generator.py`) running on PC.
- Uses `lrclib.net` synced lyrics and `librosa`/`chord-extractor` harmony detection.
