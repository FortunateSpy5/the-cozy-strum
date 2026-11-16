import type { ChordVoicing, Instrument } from '../types';
import { transposeChord } from './transpose';
import { getMovableVoicings } from './chords/movableShapes';
import { createSlashVoicing } from './chords/slashChords';
import guitarJson from './chords/guitarData.json';
import ukuleleJson from './chords/ukuleleData.json';

interface RawVoicing {
  baseFret: number;
  frets: number[];
  fingers?: number[];
  barres?: { fromFret: number; fromString: number; toString: number }[];
  variationLabel?: string;
}

const GUITAR_DATA: Record<string, RawVoicing[]> = guitarJson as Record<string, RawVoicing[]>;
const UKULELE_DATA: Record<string, RawVoicing[]> = ukuleleJson as Record<string, RawVoicing[]>;

function buildVoicingsMap(data: Record<string, RawVoicing[]>, inst: Instrument): Record<string, ChordVoicing> {
  const map: Record<string, ChordVoicing> = {};
  for (const [name, list] of Object.entries(data)) {
    const first = list[0];
    if (first) {
      map[name] = { ...first, name, instrument: inst, variation: 1, totalVariations: list.length };
    }
  }
  return map;
}

export const GUITAR_VOICINGS: Record<string, ChordVoicing> = buildVoicingsMap(GUITAR_DATA, 'guitar');
export const UKULELE_VOICINGS: Record<string, ChordVoicing> = buildVoicingsMap(UKULELE_DATA, 'ukulele');

export function getChordVoicings(chordName: string, instrument: Instrument = 'guitar'): ChordVoicing[] {
  const clean = (chordName || '').trim().replace(/\*$/, '');
  if (!clean) return [createFallbackVoicing(chordName, instrument)];

  const data = instrument === 'guitar' ? GUITAR_DATA : UKULELE_DATA;

  // 1. Direct match in dictionary
  const direct = data[clean];
  if (direct && direct.length > 0) {
    return direct.map((v, i) => ({
      ...v,
      name: chordName,
      instrument,
      variation: i + 1,
      totalVariations: direct.length
    }));
  }

  // 2. Enharmonic match (e.g. A# <-> Bb, Gb <-> F#, Db <-> C#)
  const isFlat = clean.includes('b');
  const enharmonic = transposeChord(clean, 0, !isFlat);
  const enharmonicList = data[enharmonic];
  if (enharmonicList && enharmonicList.length > 0) {
    return enharmonicList.map((v, i) => ({
      ...v,
      name: chordName,
      instrument,
      variation: i + 1,
      totalVariations: enharmonicList.length
    }));
  }

  // 3. Slash chord fallback (e.g. D/F#, C/E)
  if (clean.includes('/')) {
    const [baseName] = clean.split('/');
    if (baseName) {
      const baseVoicings = getChordVoicings(baseName, instrument);
      if (baseVoicings.length > 0 && baseVoicings[0]?.frets.some((f) => f !== 0)) {
        return baseVoicings.map((bv, idx) => {
          const slash = createSlashVoicing(chordName, bv, instrument);
          return slash
            ? { ...slash, variation: idx + 1, totalVariations: baseVoicings.length }
            : { ...bv, name: chordName, variation: idx + 1, totalVariations: baseVoicings.length };
        });
      }
    }
  }

  // 4. Movable CAGED / Barre shapes fallback
  const movable = getMovableVoicings(clean, instrument);
  if (movable.length > 0) {
    return movable.map((v, i) => ({
      ...v,
      name: chordName,
      variation: i + 1,
      totalVariations: movable.length
    }));
  }

  // 5. Procedural fallback voicing
  return [createFallbackVoicing(chordName, instrument)];
}

export function getChordVoicing(
  chordName: string,
  instrument: Instrument = 'guitar',
  variationIndex = 0
): ChordVoicing {
  const voicings = getChordVoicings(chordName, instrument);
  const safeIndex = Math.max(0, Math.min(voicings.length - 1, variationIndex));
  return voicings[safeIndex] ?? voicings[0] ?? createFallbackVoicing(chordName, instrument);
}

export function hasChordVariations(chordName: string, instrument: Instrument = 'guitar'): boolean {
  return getChordVoicings(chordName, instrument).length > 1;
}

function createFallbackVoicing(name: string, instrument: Instrument): ChordVoicing {
  const stringCount = instrument === 'guitar' ? 6 : 4;
  return {
    name,
    instrument,
    baseFret: 1,
    frets: Array(stringCount).fill(0),
    fingers: Array(stringCount).fill(0),
    variation: 1,
    totalVariations: 1
  };
}
