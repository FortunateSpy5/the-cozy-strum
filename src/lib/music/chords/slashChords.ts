import type { ChordVoicing, Instrument } from '../../types';

const BASS_NOTE_STRING6: Record<string, number> = {
  'E': 0, 'F': 1, 'F#': 2, 'Gb': 2, 'G': 3, 'G#': 4, 'Ab': 4,
  'A': 5, 'A#': 6, 'Bb': 6, 'B': 7, 'C': 8, 'C#': 9, 'Db': 9,
  'D': 10, 'D#': 11, 'Eb': 11
};

const BASS_NOTE_STRING5: Record<string, number> = {
  'A': 0, 'A#': 1, 'Bb': 1, 'B': 2, 'C': 3, 'C#': 4, 'Db': 4,
  'D': 5, 'D#': 6, 'Eb': 6, 'E': 7, 'F': 8, 'F#': 9, 'Gb': 9,
  'G': 10, 'G#': 11, 'Ab': 11
};

export function createSlashVoicing(
  chordName: string,
  baseVoicing: ChordVoicing,
  instrument: Instrument
): ChordVoicing | null {
  if (instrument === 'ukulele') {
    return { ...baseVoicing, name: chordName };
  }

  const parts = chordName.split('/');
  const bass = parts[1]?.trim().replace(/\*$/, '');
  if (!bass) return null;

  const frets = [...baseVoicing.frets];
  const s6Fret = BASS_NOTE_STRING6[bass];
  const s5Fret = BASS_NOTE_STRING5[bass];

  // Try placing bass on 6th string if low fret (<= 4)
  if (s6Fret !== undefined && s6Fret <= 4) {
    frets[0] = s6Fret;
    return {
      ...baseVoicing,
      name: chordName,
      frets,
      variationLabel: `Slash (bass /${bass})`
    };
  }

  // Try placing bass on 5th string if low fret (<= 4)
  if (s5Fret !== undefined && s5Fret <= 4) {
    frets[0] = -1; // Mute 6th string
    frets[1] = s5Fret;
    return {
      ...baseVoicing,
      name: chordName,
      frets,
      variationLabel: `Slash (bass /${bass})`
    };
  }

  return { ...baseVoicing, name: chordName };
}
