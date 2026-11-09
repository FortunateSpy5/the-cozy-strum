import type { ChordVoicing, Instrument } from '../types';
import { transposeChord } from './transpose';

export const GUITAR_VOICINGS: Record<string, ChordVoicing> = {
  'C': { name: 'C', instrument: 'guitar', baseFret: 1, frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
  'G': { name: 'G', instrument: 'guitar', baseFret: 1, frets: [3, 2, 0, 0, 3, 3], fingers: [2, 1, 0, 0, 3, 4] },
  'D': { name: 'D', instrument: 'guitar', baseFret: 1, frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
  'A': { name: 'A', instrument: 'guitar', baseFret: 1, frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
  'E': { name: 'E', instrument: 'guitar', baseFret: 1, frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
  'Am': { name: 'Am', instrument: 'guitar', baseFret: 1, frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
  'Em': { name: 'Em', instrument: 'guitar', baseFret: 1, frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
  'Dm': { name: 'Dm', instrument: 'guitar', baseFret: 1, frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
  'F': { name: 'F', instrument: 'guitar', baseFret: 1, frets: [1, 3, 3, 2, 1, 1], barres: [{ fromFret: 1, fromString: 1, toString: 6 }] },
  'Bm': { name: 'Bm', instrument: 'guitar', baseFret: 2, frets: [-1, 2, 4, 4, 3, 2], barres: [{ fromFret: 2, fromString: 2, toString: 6 }] },
  'F#m': { name: 'F#m', instrument: 'guitar', baseFret: 2, frets: [2, 4, 4, 2, 2, 2], barres: [{ fromFret: 2, fromString: 1, toString: 6 }] },
  'B7': { name: 'B7', instrument: 'guitar', baseFret: 1, frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },
  'E7': { name: 'E7', instrument: 'guitar', baseFret: 1, frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
  'A7': { name: 'A7', instrument: 'guitar', baseFret: 1, frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0] },
  'D7': { name: 'D7', instrument: 'guitar', baseFret: 1, frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
  'G7': { name: 'G7', instrument: 'guitar', baseFret: 1, frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
  'C7': { name: 'C7', instrument: 'guitar', baseFret: 1, frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
  'Am7': { name: 'Am7', instrument: 'guitar', baseFret: 1, frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0] },
  'Em7': { name: 'Em7', instrument: 'guitar', baseFret: 1, frets: [0, 2, 2, 0, 3, 3], fingers: [0, 1, 2, 0, 3, 4] },
  'Cadd9': { name: 'Cadd9', instrument: 'guitar', baseFret: 1, frets: [-1, 3, 2, 0, 3, 3], fingers: [0, 2, 1, 0, 3, 4] },
  'Dsus4': { name: 'Dsus4', instrument: 'guitar', baseFret: 1, frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 2, 4] },
  'A7sus4': { name: 'A7sus4', instrument: 'guitar', baseFret: 1, frets: [-1, 0, 2, 0, 3, 0], fingers: [0, 0, 1, 0, 2, 0] },
  'D/F#': { name: 'D/F#', instrument: 'guitar', baseFret: 1, frets: [2, 0, 0, 2, 3, 2], fingers: [1, 0, 0, 2, 4, 3] },
  'G/B': { name: 'G/B', instrument: 'guitar', baseFret: 1, frets: [-1, 2, 0, 0, 3, 3], fingers: [0, 1, 0, 0, 3, 4] },
  'C/E': { name: 'C/E', instrument: 'guitar', baseFret: 1, frets: [0, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
  'Bb': { name: 'Bb', instrument: 'guitar', baseFret: 1, frets: [-1, 1, 3, 3, 3, 1], barres: [{ fromFret: 1, fromString: 2, toString: 6 }] },
  'Cmaj7': { name: 'Cmaj7', instrument: 'guitar', baseFret: 1, frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0] }
};

export const UKULELE_VOICINGS: Record<string, ChordVoicing> = {
  'C': { name: 'C', instrument: 'ukulele', baseFret: 1, frets: [0, 0, 0, 3], fingers: [0, 0, 0, 3] },
  'G': { name: 'G', instrument: 'ukulele', baseFret: 1, frets: [0, 2, 3, 2], fingers: [0, 1, 3, 2] },
  'Am': { name: 'Am', instrument: 'ukulele', baseFret: 1, frets: [2, 0, 0, 0], fingers: [2, 0, 0, 0] },
  'F': { name: 'F', instrument: 'ukulele', baseFret: 1, frets: [2, 0, 1, 0], fingers: [2, 0, 1, 0] },
  'Em': { name: 'Em', instrument: 'ukulele', baseFret: 1, frets: [0, 4, 3, 2], fingers: [0, 3, 2, 1] },
  'Dm': { name: 'Dm', instrument: 'ukulele', baseFret: 1, frets: [2, 2, 1, 0], fingers: [2, 3, 1, 0] },
  'A': { name: 'A', instrument: 'ukulele', baseFret: 1, frets: [2, 1, 0, 0], fingers: [2, 1, 0, 0] },
  'E': { name: 'E', instrument: 'ukulele', baseFret: 1, frets: [4, 4, 4, 2], fingers: [2, 3, 4, 1] },
  'D': { name: 'D', instrument: 'ukulele', baseFret: 1, frets: [2, 2, 2, 0], fingers: [1, 2, 3, 0] },
  'A7': { name: 'A7', instrument: 'ukulele', baseFret: 1, frets: [0, 1, 0, 0], fingers: [0, 1, 0, 0] },
  'G7': { name: 'G7', instrument: 'ukulele', baseFret: 1, frets: [0, 2, 1, 2], fingers: [0, 2, 1, 3] },
  'C7': { name: 'C7', instrument: 'ukulele', baseFret: 1, frets: [0, 0, 0, 1], fingers: [0, 0, 0, 1] },
  'E7': { name: 'E7', instrument: 'ukulele', baseFret: 1, frets: [1, 2, 0, 2], fingers: [1, 2, 0, 3] },
  'B7': { name: 'B7', instrument: 'ukulele', baseFret: 2, frets: [2, 3, 2, 2], barres: [{ fromFret: 2, fromString: 1, toString: 4 }] },
  'Bm': { name: 'Bm', instrument: 'ukulele', baseFret: 2, frets: [4, 2, 2, 2], barres: [{ fromFret: 2, fromString: 1, toString: 4 }] },
  'Bb': { name: 'Bb', instrument: 'ukulele', baseFret: 1, frets: [3, 2, 1, 1], barres: [{ fromFret: 1, fromString: 3, toString: 4 }] },
  'F#m': { name: 'F#m', instrument: 'ukulele', baseFret: 1, frets: [2, 1, 2, 0], fingers: [2, 1, 3, 0] },
  'Cmaj7': { name: 'Cmaj7', instrument: 'ukulele', baseFret: 1, frets: [0, 0, 0, 2], fingers: [0, 0, 0, 2] },
  'Cadd9': { name: 'Cadd9', instrument: 'ukulele', baseFret: 1, frets: [0, 2, 0, 3], fingers: [0, 1, 0, 2] },
  'Dsus4': { name: 'Dsus4', instrument: 'ukulele', baseFret: 1, frets: [2, 2, 3, 0], fingers: [1, 2, 3, 0] },
  'A7sus4': { name: 'A7sus4', instrument: 'ukulele', baseFret: 1, frets: [0, 2, 0, 0], fingers: [0, 1, 0, 0] },
  'Em7': { name: 'Em7', instrument: 'ukulele', baseFret: 1, frets: [0, 2, 0, 2], fingers: [0, 1, 0, 2] }
};

export function getChordVoicing(chordName: string, instrument: Instrument = 'guitar'): ChordVoicing {
  const dict = instrument === 'guitar' ? GUITAR_VOICINGS : UKULELE_VOICINGS;

  // 1. Exact match
  const exact = dict[chordName];
  if (exact) return exact;

  // 2. Enharmonic match (e.g. A# <-> Bb, Gb <-> F#, Db <-> C#)
  const isFlat = chordName.includes('b');
  const enharmonic = transposeChord(chordName, 0, !isFlat);
  const enharmonicMatch = dict[enharmonic];
  if (enharmonicMatch) {
    return { ...enharmonicMatch, name: chordName };
  }

  // 3. Slash chord fallback (e.g. D/F# -> D, C/E -> C)
  if (chordName.includes('/')) {
    const baseChord = chordName.split('/')[0];
    if (baseChord) {
      const baseVoicing = getChordVoicing(baseChord, instrument);
      if (baseVoicing.frets.some((f) => f !== 0)) {
        return { ...baseVoicing, name: chordName };
      }
    }
  }

  // 4. Procedural fallback voicing
  const stringCount = instrument === 'guitar' ? 6 : 4;
  return {
    name: chordName,
    instrument,
    baseFret: 1,
    frets: Array(stringCount).fill(0),
    fingers: Array(stringCount).fill(0)
  };
}
