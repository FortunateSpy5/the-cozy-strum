---
name: ascii-chord-tab-engine
description: Parser and transposition engine for chords-over-lyrics, ChordPro, and ASCII fingerpicking tabs with exact column preservation.
---

# ASCII Chord & Tab Engine Skill

This skill defines the technical rules and algorithmic patterns for parsing, rendering, and transposing guitar and ukulele tablature pasted from Ultimate Guitar or written in plaintext/ChordPro formats.

## 1. Line Classification Rules

Input text is processed line by line through a deterministic classifier:

```typescript
export type LineType = 
  | 'section-header' // [Verse 1], [Chorus], [Intro], [Bridge], [Solo]
  | 'chord-line'     // G        C/G       Em7      D
  | 'lyric-line'     // When the night has come and the land is dark
  | 'ascii-tab'      // e|---0-------2-------|
  | 'empty';         // Blank line for paragraph breaks
```

### 1.1 Section Header Detection
A line is classified as `section-header` if:
- Matches `^\[([^\]]+)\]$` or starts with common section keywords like `Intro:`, `Verse \d+:`, `Chorus:`, `Bridge:`, `Outro:`, `Solo:`, `Interlude:`.
- Normalized to standard bracketed headers: `[Intro]`, `[Verse 1]`, `[Chorus]`, etc.

### 1.2 Chord vs Lyric Line Classification
Raw tabs place chords on a dedicated line directly above the corresponding lyric line. Preserving the exact character column offset of each chord is vital.

A line is classified as a `chord-line` if:
1. It is not an ASCII tab line.
2. At least 60% of whitespace-delimited tokens match the strict Chord Regex:
   ```regex
   ^[A-G](?:#|b)?(?:m|min|maj|dim|aug|sus|sus2|sus4|add9|add2|add4|6|7|9|11|13|maj7|m7|dim7|m7b5)?(?:\/[A-G](?:#|b)?)?$
   ```
3. Or all recognized tokens are chords and the line contains no lowercase conversational words (e.g., "the", "and", "in", "to", "you").

#### Column Offset Preservation
Each chord in a `chord-line` is recorded with its starting character index `col`:
```typescript
interface ChordToken {
  chord: string;
  col: number; // 0-indexed column offset
}
```
When rendering, chords are positioned at their exact column or aligned as interactive badges above lyrics.

### 1.3 ASCII Tab Block Detection
ASCII tabs consist of multiple contiguous lines representing instrument strings.

- **Guitar Staves (6 strings)**: Lines starting with `e|`, `B|`, `G|`, `D|`, `A|`, `E|` (or lowercase equivalents), containing strings of `-`, numbers, `h` (hammer-on), `p` (pull-off), `/` (slide up), `\` (slide down), `b` (bend), `r` (release), `~` (vibrato).
- **Ukulele Staves (4 strings)**: Lines starting with `A|`, `E|`, `C|`, `G|`.

#### Rendering Guarantees
- Group contiguous string lines into a single `TabStave` block.
- Render within an `overflow-x-auto` container with CSS:
  ```css
  font-family: 'JetBrains Mono', monospace;
  font-variant-ligatures: none;
  white-space: pre;
  tab-size: 4;
  ```
- **Never allow line wraps** inside an ASCII tab block, as wrapping breaks horizontal string alignment.

---

## 2. Transposition & Capo Calculation Math

The chromatic pitch scale is indexed `0` to `11`:
```typescript
const SHARP_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_SCALE  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
```

### 2.1 Transposition Algorithm
For any chord `Root[Modifier][/Bass]`:
1. Parse `Root` (e.g. `F#`) and any slash `Bass` note (e.g. `C#`).
2. Find index $I_{root}$ in the chromatic scale.
3. Compute new index $I_{new} = (I_{root} + semitones + 12) \pmod{12}$.
4. If a bass note exists, compute $I_{bass\_new} = (I_{bass} + semitones + 12) \pmod{12}$.
5. Reconstruct chord with preserved modifier: `NewRoot + Modifier + (Bass ? '/' + NewBass : '')`.

### 2.2 Enharmonic Selection
- Default to `#` for sharp keys (G, D, A, E, B, F#).
- Default to `b` for flat keys (F, Bb, Eb, Ab, Db).
- Natural notes (C, D, E, F, G, A, B) remain unchanged.

### 2.3 Capo Shifting Formula
To play easier open chord shapes with a capo:
$$\text{Transposed Semitones} = -\text{Capo Position}$$
*Example*: A song in Key of `E` with `Capo: 4` has chords transposed by `-4` semitones to play in open `C` chord shapes.
