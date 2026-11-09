---
name: fretboard-chord-diagrams
description: Lightweight SVG chord diagram generation for 6-string guitar and 4-string ukulele with barre chords, finger numbering, and muted/open strings.
---

# Fretboard Chord Diagrams Skill

This skill defines the data models, SVG layout calculations, and chord voicing dictionaries for rendering crisp, responsive fretboard chord diagrams for Guitar (`E A D G B e`) and Ukulele (`G C E A`).

## 1. Chord Voicing Data Model

Each chord shape is defined deterministically:

```typescript
export interface ChordVoicing {
  name: string;             // e.g. "C", "Am", "F#m7", "D/F#"
  instrument: 'guitar' | 'ukulele';
  baseFret: number;         // 1 for open position, >1 if shifted up the neck (e.g. 3 for barre at fret 3)
  frets: (number | -1)[];   // Fret per string from low to high pitch. -1 = Muted ('X'), 0 = Open ('O')
  fingers?: (number | 0)[]; // Finger per string (1=Index, 2=Middle, 3=Ring, 4=Pinky, 0=None/Thumb)
  barres?: {
    fromFret: number;
    fromString: number;     // 1-indexed (1=low E for guitar)
    toString: number;
  }[];
}
```

### String Ordering Conventions
- **Guitar (6 strings)**: Index 0 is low E (6th string), Index 5 is high e (1st string).
  - Open C Major: `[-1, 3, 2, 0, 1, 0]` with fingers `[0, 3, 2, 0, 1, 0]`
  - Barre F Major: `[1, 3, 3, 2, 1, 1]` with `baseFret: 1`, barre on fret 1 across strings 1 to 6.
- **Ukulele (4 strings)**: Index 0 is G (4th string), Index 3 is A (1st string).
  - Open C Major: `[0, 0, 0, 3]` with fingers `[0, 0, 0, 3]`
  - Open G Major: `[0, 2, 3, 2]` with fingers `[0, 1, 3, 2]`
  - Open Am: `[2, 0, 0, 0]` with fingers `[2, 0, 0, 0]`

---

## 2. SVG Geometry & Rendering Rules

The chord diagram SVG is drawn on a compact viewBox (e.g., `80x100` or `100x120` px) with pure vector primitives:

### 2.1 Grid Layout Parameters
```typescript
const CONFIG = {
  guitar:  { strings: 6, frets: 5, width: 90, height: 110, paddingX: 18, paddingY: 26 },
  ukulele: { strings: 4, frets: 5, width: 75, height: 110, paddingX: 18, paddingY: 26 }
};
```
- **Nut**: Thick horizontal line at `y = paddingY` if `baseFret === 1`. If `baseFret > 1`, a standard fret wire is drawn with a text label `fr{baseFret}` next to the first rendered fret.
- **Strings**: Vertical lines evenly spaced across `(width - 2 * paddingX) / (strings - 1)`.
- **Frets**: Horizontal lines evenly spaced across fret heights.

### 2.2 Indicators
- **Muted String (`X`)**: Drawn above the nut at the string's X position with a delicate cross.
- **Open String (`O`)**: Drawn above the nut at the string's X position with an unfilled circle.
- **Fretted Dot**: Solid circle placed in the vertical center of the fret slot, filled with `--color-accent` or `--color-primary`.
- **Finger Number**: Centered white text inside the fretted dot (font size ~8-9px).
- **Barre Chord Arc/Capsule**: A rounded capsule spanning from `fromString` to `toString` across the barred fret.

### 2.3 Visual Polish & Accessibility
- Diagram title (Chord name) rendered in bold above or below the grid.
- Full SVG accessibility with `<title>` tag: `<title>C Major chord diagram for guitar</title>`.
- Responsive sizing via CSS `w-full max-w-[120px] aspect-square`.
