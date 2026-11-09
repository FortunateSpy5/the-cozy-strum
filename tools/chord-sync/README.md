# The Cozy Strum — Local Audio + LRCLIB Automated Chord Sync Pipeline

A standalone Python CLI tool that runs on your local computer to automatically generate chord-over-lyrics tablature for **The Cozy Strum** by pairing **LRCLIB millisecond-synced lyrics (`.lrc`)** with open-source audio harmony extraction and selective ASCII tablatures.

---

## 1. Why This Pipeline is Unique

### The Cozy Strum Approach
- **LRCLIB (`https://lrclib.net`)**: High-accuracy millisecond timestamps for each line of lyrics (`[00:14.20] Wise men say only fools rush in`). Multi-stage title normalization strips subtitles, soundtrack tags, and edition strings for 86%+ search accuracy.
- **Audio Harmony Detection (`chord-extractor` / `librosa`)**: Detects musical chroma and chord shifts with exact audio timestamps (`14.1s C`, `16.4s Em`, `18.8s Am`).
- **Selective Tab Architecture**: Pure chords-over-lyrics by default for strumming songs. Generates or fetches authentic ASCII tablature blocks only for fingerstyle and tab-based songs (like *Blackbird*, *Dust in the Wind*, *Here Comes the Sun*).

```mermaid
flowchart TD
    A["Song Title & Artist"] --> B["LRCLIB API\n(syncedLyrics)"]
    C["Local Audio File / Chords"] --> D["Audio Harmony Detection"]
    B --> E["Parsed Millisecond Lines"]
    D --> F["Timestamped Chords"]
    E & F --> G["Deterministic Aligner"]
    H["Tab Option (Selective)"] --> I["tab_synthesizer / tab_fetcher"]
    G & I --> J["ASCII Monospace Tab Sheet"]
    J --> K["Save to .tab / .json or Upload to Firestore"]
```

---

## 2. Requirements & Installation

Python 3.10+ is required.

```bash
cd tools/chord-sync
pip install -r requirements.txt
```

> **Note:** Lyrics retrieval, tab synthesis, and alignment engine use Python's standard library with zero mandatory external packages.

---

## 3. CLI Usage & Examples

### Example 1: Pure Chords-Over-Lyrics (Sing-Along / Strumming Song)
Generates clean distraction-free chords aligned over lyrics with zero unnecessary tab staves:
```bash
python sync_generator.py --title "Wonderwall" --artist "Oasis" --progression "Em7 G Dsus4 A7sus4" --dry-run
```

### Example 2: Procedural Fingerstyle Pattern (e.g. Ukulele or Guitar Ballad)
Synthesizes standard monospace ASCII tablatures for specific chord progressions:
```bash
python sync_generator.py \
  --title "Riptide" \
  --artist "Vance Joy" \
  --progression "Am G C" \
  --instrument ukulele \
  --fingerstyle arpeggio \
  --capo 1 \
  --dry-run
```

### Example 3: Tab-Based Song with Real Intro Riff / Solo
Fetches verified public ASCII tablature blocks for iconic tab songs:
```bash
python sync_generator.py \
  --title "Dust in the Wind" \
  --artist "Kansas" \
  --progression "C G/B Am" \
  --fetch-tab \
  --tab-section intro \
  --dry-run
```

### Example 4: Direct Upload to Firestore Vault
```bash
python sync_generator.py \
  --title "Yesterday" \
  --artist "The Beatles" \
  --progression "F Em7 A7 Dm" \
  --upload \
  --service-account "path/to/serviceAccountKey.json"
```

---

## 4. Supported CLI Flags

| Flag | Type | Description |
|---|---|---|
| `--title` | `str` *(Required)* | Song title (e.g., `'Wonderwall'`) |
| `--artist` | `str` *(Required)* | Artist name (e.g., `'Oasis'`) |
| `--progression` | `str` | Verse chord progression (e.g., `'Em7 G Dsus4 A7sus4'`) |
| `--chorus-progression`| `str` | Chorus chord progression |
| `--fingerstyle` | `travis \| arpeggio` | Procedural fingerstyle ASCII tab pattern |
| `--fetch-tab` | flag | Fetch real ASCII tab from public archive |
| `--tab-section` | `intro \| solo \| riff` | Section to extract when fetching tab (default: `intro`) |
| `--audio` | `str` | Path to audio file (`.mp3`, `.wav`) or chords file |
| `--lrc-file` | `str` | Path to local `.lrc` file (skips LRCLIB online API) |
| `--capo` | `int` | Capo position (default: `0`) |
| `--instrument` | `guitar \| ukulele` | Target instrument (default: `guitar`) |
| `--output` | `str` | Output file path (`.tab` or `.json`) |
| `--upload` | flag | Direct upload to Firestore `tabs/{tabId}` |
| `--service-account`| `str` | Path to Firebase service account JSON |
| `--dry-run` | flag | Print tab preview to console without saving |

---

## 5. Running the Test Suite

```bash
python test_aligner.py
```
