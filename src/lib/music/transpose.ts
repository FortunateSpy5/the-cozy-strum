const SHARP_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
const FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

// Normalize enharmonics to 0-11 pitch class
const NOTE_TO_PITCH: Record<string, number> = {
  'C': 0, 'B#': 0,
  'C#': 1, 'Db': 1,
  'D': 2,
  'D#': 3, 'Eb': 3,
  'E': 4, 'Fb': 4,
  'F': 5, 'E#': 5,
  'F#': 6, 'Gb': 6,
  'G': 7,
  'G#': 8, 'Ab': 8,
  'A': 9,
  'A#': 10, 'Bb': 10,
  'B': 11, 'Cb': 11
};

export const CHORD_REGEX =
  /^([A-G](?:#|b)?)(m7b5|m7#5|mmaj7|m\/maj7|maj7|maj9|maj11|maj13|maj|min|m7|m9|m11|m13|m6|m|M7|M9|7sus4|7sus2|7sus|9sus4|9sus|sus2|sus4|sus|dim7|dim|aug7|aug|\+7|\+|add9|add2|add4|add11|7b5|7#5|7b9|7#9|9b5|9#5|5|6|7|9|11|13)?(?:\/([A-G](?:#|b)?))?(\*?)$/;

/**
 * Normalizes semitones into 0..11
 */
export function normalizeSemitones(semitones: number): number {
  return ((semitones % 12) + 12) % 12;
}

/**
 * Transposes a single note by semitones
 */
export function transposeNote(note: string, semitones: number, preferFlats = false): string {
  const pitch = NOTE_TO_PITCH[note];
  if (pitch === undefined) return note;

  const newPitch = (pitch + normalizeSemitones(semitones)) % 12;
  const scale = preferFlats ? FLAT_NOTES : SHARP_NOTES;
  return scale[newPitch] ?? note;
}

/**
 * Transposes a chord string (e.g. "Am", "F#m7", "D/F#", "A7sus4")
 */
export function transposeChord(chord: string, semitones: number, preferFlats?: boolean): string {
  const normalized = normalizeSemitones(semitones);
  if (normalized === 0 && preferFlats === undefined) return chord;

  const match = chord.match(CHORD_REGEX);
  if (!match) return chord;

  const [, root, quality = '', bass, star = ''] = match;
  if (!root) return chord;

  const useFlats = preferFlats !== undefined
    ? preferFlats
    : (root.endsWith('b') || Boolean(bass?.endsWith('b')));

  const newRoot = transposeNote(root, normalized, useFlats);
  const newBass = bass ? transposeNote(bass, normalized, useFlats) : null;
  const slashPart = newBass ? `/${newBass}` : '';

  return `${newRoot}${quality}${slashPart}${star}`;
}

/**
 * Capo calculation helper:
 * Playing open shapes with a Capo requires transposing chords DOWN by the capo fret.
 * e.g., A song in key of E played with Capo 2 -> Play D shape (-2 semitones).
 */
export function getCapoOpenChord(chord: string, capoFret: number): string {
  return transposeChord(chord, -capoFret);
}
