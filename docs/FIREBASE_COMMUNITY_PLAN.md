# The Cozy Strum — Architecture & Phased Implementation Plan (v2.0)
**Target Stack:** Astro 5 (Static Hybrid Shell) + React 19 Islands + Tailwind CSS + Firebase v11 (Auth & Cloud Firestore) + LRCLIB Open-Source Lyrics API

---

## 1. System Overview & Core Pillars

1. **Zero-Server Hybrid Architecture:** Keep Astro's static build (`output: 'static'`) for fast Netlify hosting and SEO on seed tabs, while hydrating dynamic user features, community submissions, and admin moderation via client-side Firebase v11 islands with IndexedDB offline persistence.
2. **Google Auth & Personal Practice Ecosystem:** 1-click Google Sign-In unlocking Favorites, Custom Setlists, Per-Song Practice Memory (remembering a user's preferred Capo, Transpose offset, and Auto-scroll speed per song), and Private Vault tabs.
3. **Community Song Submissions + LRCLIB Assist:** Logged-in users can submit Guitar/Ukulele chords & ASCII tabs. Built-in **LRCLIB API (`https://lrclib.net/api/get`)** integration lets users auto-fill plain or timestamped lyrics in one click before adding chords.
4. **Admin Moderation & DMCA Compliance Center (`/admin` & `/dmca`):** Role-based admin dashboard to review, approve, edit, or reject user-submitted tabs, and process DMCA copyright takedown requests with 1-click soft-deletion (`status: 'removed_dmca'`).
5. **Automated Audio + LRCLIB Sync Generator (`tools/chord-sync/`):** Local CLI utility that pairs **LRCLIB time-synced `.lrc` lyrics** with open-source audio chord detection (`chord-extractor` / `librosa`) to automatically align chords over lyrics without needing heavy speech-to-text models.

---

## 2. Cloud Firestore Data Model (`Schema Specification`)

### 2.1 `users/{uid}`
Stores user profile, role, Favorites, and per-song practice overrides.
```typescript
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'user' | 'admin'; // Default 'user'; 'admin' set manually in console for owner
  favoriteTabIds: string[]; // Array of tab IDs (supports both static slugs and Firestore IDs)
  recentlyPlayedIds: string[]; // Capped at last 20 played songs
  songPreferences: {
    [tabId: string]: {
      transpose: number;       // -11 to +11
      capoOverride?: number;   // Custom capo position
      scrollSpeed?: number;    // Preferred auto-scroll speed (1-10)
      instrumentView?: 'guitar' | 'ukulele';
    };
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 2.2 `tabs/{tabId}`

Stores all user-submitted and automated songs.

```typescript
interface CloudTab {
  id: string;
  slug: string;                // URL-friendly identifier
  title: string;
  artist: string;
  album?: string;
  instrument: 'guitar' | 'ukulele';
  tuning: string;              // e.g., "Standard (E A D G B E)", "G C E A"
  capo: number;                // 0 - 12
  bpm?: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  strummingPattern?: string;   // e.g., "D - D U - U D U"
  isFingerstyle: boolean;
  content: string;             // Raw ChordPro / Chords-over-Lyrics / ASCII Tab string
  chordsUsed: string[];        // Extracted unique chord names ["Am", "G", "C", "F"] for index badges
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
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 2.3 `setlists/{setlistId}`

Allows logged-in users to group songs into ordered folders/playlists (e.g., *"Campfire Acoustic"*, *"Ukulele Practice"*, *"Daily Warmup"*).

```typescript
interface Setlist {
  id: string;
  ownerUid: string;
  ownerName: string;
  title: string;
  description?: string;
  isPublic: boolean;
  tabIds: string[];            // Ordered array of tabIds/slugs for sequential "Gig Mode" playback
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 2.4 `dmca_requests/{requestId}`

Publicly writable collection for copyright/takedown notices, readable only by Admins.

```typescript
interface DmcaRequest {
  id: string;
  tabId: string;               // Target tab ID or URL slug
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
  createdAt: Timestamp;
  resolvedAt?: Timestamp;
}
```

---

## 3. Firestore Security Rules (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(uid) {
      return isSignedIn() && request.auth.uid == uid;
    }
    
    function isAdmin() {
      return isSignedIn() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Users: Read/Write own profile; prevent users from escalating their own role to 'admin'
    match /users/{uid} {
      allow read: if isOwner(uid) || isAdmin();
      allow create: if isOwner(uid) && request.resource.data.role == 'user';
      allow update: if (isOwner(uid) && request.resource.data.role == resource.data.role) || isAdmin();
    }

    // Tabs:
    // - Anyone can read 'public' + 'approved' tabs
    // - Authors can read/write their own 'private', 'draft', or 'pending_review' tabs
    // - Admins can read/write/moderate all tabs
    match /tabs/{tabId} {
      allow read: if (resource.data.visibility == 'public' && resource.data.status == 'approved')
                  || (isSignedIn() && resource.data.authorUid == request.auth.uid)
                  || isAdmin();
      allow create: if isSignedIn() 
                    && request.resource.data.authorUid == request.auth.uid
                    && request.resource.data.status in ['draft', 'pending_review'];
      allow update: if (isSignedIn() && resource.data.authorUid == request.auth.uid 
                        && request.resource.data.status in ['draft', 'pending_review'])
                    || isAdmin();
      allow delete: if (isSignedIn() && resource.data.authorUid == request.auth.uid) || isAdmin();
    }

    // Setlists: Public setlists readable by all; private only by owner
    match /setlists/{setlistId} {
      allow read: if resource.data.isPublic == true || isOwner(resource.data.ownerUid) || isAdmin();
      allow create: if isSignedIn() && request.resource.data.ownerUid == request.auth.uid;
      allow update, delete: if isOwner(resource.data.ownerUid) || isAdmin();
    }

    // DMCA Requests: Anyone can submit (create); only Admins can read or resolve
    match /dmca_requests/{requestId} {
      allow create: if request.resource.data.status == 'open'
                    && request.resource.data.statementOfGoodFaith == true;
      allow read, update, delete: if isAdmin();
    }
  }
}
```

---

## 4. Open-Source Lyrics + Chord Automation Architecture (`LRCLIB`)

Instead of scraping copyrighted lyrics websites or running heavy Whisper vocal transcription when lyrics already exist, we integrate **LRCLIB (`https://lrclib.net/api`)** in two ways:

### Workflow A: In-Browser "Auto-Fill Lyrics" in the Submission Studio (`/submit`)

1. User enters **Track Name** and **Artist Name** in the submission form and clicks **"Fetch Lyrics from LRCLIB"**.
2. Client calls `https://lrclib.net/api/search?track_name=${title}&artist_name=${artist}` (no API key needed, native CORS enabled).
3. User picks the matching track and pulls `plainLyrics` into the editor, automatically inserting blank chord lines above each lyric line so they can simply click or type chords (`Am`, `G`, `C`) at the right words.

### Workflow B: Local Automated Audio-to-Chord Aligner (`tools/chord-sync/`)

For full automation on your local machine:

1. **Fetch Time-Synced Lyrics (`syncedLyrics`) from LRCLIB:**
* Returns LRC lines with exact timestamps:
`[00:14.20] Wise men say only fools rush in`
`[00:21.50] But I can't help falling in love with you`

2. **Extract Timestamped Chords from Audio (`yt-dlp` + `chord-extractor` / `librosa`):**
* Extracts audio harmony timestamps:
`14.1s: C`, `16.4s: Em`, `18.8s: Am`, `21.4s: F`, `23.8s: C`, `26.1s: G`

3. **Deterministic Timestamp Merger:**
* Maps every chord falling between line $N$'s timestamp (`14.20s`) and line $N+1$'s timestamp (`21.50s`) proportionally across the character length of that lyric line.
* Uploads the resulting formatted Chord-over-Lyrics sheet directly to Firestore as a `private` or `pending_review` tab.

---

## 5. Phased Execution Roadmap (For Gemini Flash in Antigravity)

> **How to use with Antigravity:** Execute **one phase per prompt** so Gemini Flash keeps files under 200 lines, maintains strict TypeScript types, and verifies `npm run build` after each milestone.

### Phase 1: Firebase Foundation, Google Auth & User Profile Bar

* **Goal:** Set up Firebase v11 client SDK with offline persistence, Google Sign-In, and the user profile document.
* **Deliverables:**
* `src/lib/firebase/config.ts` (initializes Firebase app, Auth, and Firestore with `persistentLocalCache`).
* `src/lib/firebase/auth.ts` (`signInWithGoogle`, `logout`, `ensureUserProfileDoc`).
* `src/components/auth/UserMenuIsland.tsx` in the top navbar (shows "Sign in with Google" when logged out; shows avatar dropdown with *My Favorites*, *My Setlists*, *My Submissions*, and *Admin Panel* [if `role === 'admin'`] when logged in).
* `firestore.rules` in project root.

### Phase 2: Logged-In Practice Features (Favorites, Setlists & Per-Song Memory)

* **Goal:** Make signing in genuinely useful for daily guitar/ukulele practice.
* **Deliverables:**
* **Heart / Favorite Toggle (`FavoriteButton.tsx`)** on every song card and inside the Tab Player.
* **Per-Song Practice State Sync:** When a logged-in user changes Transpose (`-2`), Capo (`Fret 3`), or Auto-Scroll Speed on a song, automatically save it to `users/{uid}.songPreferences[tabId]` and restore it next time they open that song.
* **Setlists Manager (`/setlists` & "Add to Setlist" modal):** Create custom setlists (e.g., *"Sunday Jam"*), reorder tracks, and launch **"Setlist Stage Mode"** (Next/Previous Song buttons inside the player so you can play through a 5-song setlist without returning to the home screen).

### Phase 3: Community Song Submission Studio + LRCLIB Lyrics Fetcher (`/submit`)

* **Goal:** Upgrade `/import` into a full authenticated Song Submission & Creation Studio.
* **Deliverables:**
* Require Google Sign-In to publish to the cloud (keep a guest fallback for local preview).
* **LRCLIB Integration (`src/lib/music/lrclib.ts`):** Search modal inside the editor that queries `https://lrclib.net/api/search`, lets the user select a song, and populates the editor with clean lyrics spaced for chord insertion.
* **Visibility Toggle:**
* **Save to My Private Vault (`visibility: 'private'`)**: Immediately playable by the user across all devices; never shown publicly.
* **Submit to Community Library (`visibility: 'public'`, `status: 'pending_review'`)**: Enters the Admin moderation queue.
* **Dynamic Cloud Tab Player (`/tab?id=[firestoreId]`)**: Updates the player to seamlessly load both build-time static tabs and dynamic Firestore tabs, including a footer link: *"Report Copyright / DMCA Takedown for this tab"*.

### Phase 4: DMCA Takedown Portal & Admin Moderation Dashboard (`/dmca` & `/admin`)

* **Goal:** Full copyright compliance workflow and 1-click content moderation.
* **Deliverables:**
* **DMCA Takedown Page (`src/pages/dmca.astro` + `DmcaFormIsland.tsx`):**
* Auto-fills `tabId` and `songTitle` if clicked from a song page (`/dmca?tabId=xyz`).
* Collects claimant details, good-faith checkbox, and digital signature, writing directly to `dmca_requests`.
* **Admin Dashboard (`src/pages/admin.astro` + `AdminDashboardIsland.tsx`):**
* Protected route (redirects non-admins).
* **Tab 1 — Pending Submissions Queue:** Side-by-side preview of user-submitted chords/tabs with **Approve**, **Edit & Approve**, or **Reject (with note)** actions.
* **Tab 2 — DMCA Takedown Queue:** Lists open DMCA claims with a 1-click **"Execute Takedown & Archive"** button that atomically sets `tabs/{tabId}.status = 'removed_dmca'` and marks the DMCA ticket `approved_removed`.
* **Tab 3 — All Public Tabs Manager:** Quick search to unpublish, edit, or delete any live community tab.

### Phase 5: Local Audio + LRCLIB Automated Sync CLI (`tools/chord-sync/`)

* **Goal:** Python CLI tool to generate new chord+lyric sheets automatically from audio + LRCLIB.
* **Deliverables:**
* `tools/chord-sync/sync_generator.py`:
1. Queries `lrclib.net/api/get` for `syncedLyrics` (`.lrc` timestamps).
2. Runs `demucs` + `chord-extractor` / `librosa` on the audio file/URL to get beat-aligned chord timestamps + BPM.
3. Aligns chords over the exact words in each `.lrc` line and uploads directly to Firestore via `firebase-admin` (or exports a `.json` / `.md` file).

---

## 6. Implementation Notes & Bootstrapping

1. **Admin Bootstrapping:** In Phase 1, pass an environment variable `PUBLIC_SUPERADMIN_EMAIL` (set to your Google email) or a bootstrap check so the first time you log in with your Google account, your user document or Admin UI recognizes you immediately without needing manual Firestore console edits.
2. **Existing Static Seed Songs:** Keep existing Markdown songs in `src/content/tabs/` as build-time static tabs while layering Firestore tabs on top to ensure instant loads, zero hydration penalty on seed content, and rich catalog availability out of the box.
