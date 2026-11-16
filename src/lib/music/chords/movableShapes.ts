import type { ChordVoicing, Instrument } from '../../types';

const NOTE_PITCHES: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
  'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
};

export function getMovableVoicings(
  chordName: string,
  instrument: Instrument
): ChordVoicing[] {
  const match = chordName.match(/^([A-G](?:#|b)?)(.*)$/);
  if (!match) return [];
  const [, root, rawQuality] = match;
  if (!root) return [];
  const pitch = NOTE_PITCHES[root];
  if (pitch === undefined) return [];

  const quality = (rawQuality || '').replace(/\*$/, '');

  if (instrument === 'guitar') {
    return getGuitarMovable(chordName, pitch, quality);
  }
  return getUkuleleMovable(chordName, pitch, quality);
}

function getGuitarMovable(name: string, pitch: number, q: string): ChordVoicing[] {
  const voicings: ChordVoicing[] = [];

  // E-Shape movable barre: 6th string root (E is pitch 4)
  const eFret = (pitch - 4 + 12) % 12 || 12;
  if (eFret >= 1 && eFret <= 11) {
    const v = createGuitarEShape(name, eFret, q);
    if (v) voicings.push(v);
  }

  // A-Shape movable barre: 5th string root (A is pitch 9)
  const aFret = (pitch - 9 + 12) % 12 || 12;
  if (aFret >= 1 && aFret <= 11) {
    const v = createGuitarAShape(name, aFret, q);
    if (v) voicings.push(v);
  }

  return voicings;
}

function createGuitarEShape(name: string, f: number, q: string): ChordVoicing | null {
  const isMinor = q === 'm' || q === 'min' || q.startsWith('m7') || q === 'm6';
  const is7 = q === '7' || q === 'dom7';
  const isM7 = q === 'm7' || q === 'min7';
  const isMaj7 = q === 'maj7' || q === 'M7';
  const isSus4 = q === 'sus4' || q === 'sus';

  let frets: number[];
  if (isM7) {
    frets = [f, f + 2, f, f, f, f];
  } else if (isMinor) {
    frets = [f, f + 2, f + 2, f, f, f];
  } else if (is7) {
    frets = [f, f + 2, f, f + 1, f, f];
  } else if (isMaj7) {
    frets = [f, f + 2, f + 1, f + 1, f, f];
  } else if (isSus4) {
    frets = [f, f + 2, f + 2, f + 2, f, f];
  } else {
    frets = [f, f + 2, f + 2, f + 1, f, f]; // Major
  }

  return {
    name,
    instrument: 'guitar',
    baseFret: f,
    frets,
    barres: [{ fromFret: f, fromString: 1, toString: 6 }],
    variationLabel: `Barre (6th-string pos ${f})`
  };
}

function createGuitarAShape(name: string, f: number, q: string): ChordVoicing | null {
  const isMinor = q === 'm' || q === 'min' || q.startsWith('m7') || q === 'm6';
  const is7 = q === '7' || q === 'dom7';
  const isM7 = q === 'm7' || q === 'min7';
  const isMaj7 = q === 'maj7' || q === 'M7';
  const isSus4 = q === 'sus4' || q === 'sus';
  const isSus2 = q === 'sus2';

  let frets: number[];
  if (isM7) {
    frets = [-1, f, f + 2, f, f + 1, f];
  } else if (isMinor) {
    frets = [-1, f, f + 2, f + 2, f + 1, f];
  } else if (is7) {
    frets = [-1, f, f + 2, f, f + 2, f];
  } else if (isMaj7) {
    frets = [-1, f, f + 2, f + 1, f + 2, f];
  } else if (isSus4) {
    frets = [-1, f, f + 2, f + 2, f + 3, f];
  } else if (isSus2) {
    frets = [-1, f, f + 2, f + 2, f, f];
  } else {
    frets = [-1, f, f + 2, f + 2, f + 2, f]; // Major
  }

  return {
    name,
    instrument: 'guitar',
    baseFret: f,
    frets,
    barres: [{ fromFret: f, fromString: 2, toString: 6 }],
    variationLabel: `Barre (5th-string pos ${f})`
  };
}

function getUkuleleMovable(name: string, pitch: number, q: string): ChordVoicing[] {
  // Ukulele GCEA: Movable D-shape (root on C string 3rd string, pitch 2)
  const shift = (pitch - 2 + 12) % 12;
  const isMinor = q.startsWith('m') && !q.startsWith('maj');
  const is7 = q === '7';
  const baseFret = Math.max(1, shift);

  let frets: number[];
  if (isMinor) {
    frets = [shift + 2, shift + 2, shift + 1, shift];
  } else if (is7) {
    frets = [shift + 2, shift, shift + 2, shift];
  } else {
    frets = [shift + 2, shift + 2, shift + 2, shift];
  }

  return [
    {
      name,
      instrument: 'ukulele',
      baseFret,
      frets,
      barres: shift > 0 ? [{ fromFret: shift, fromString: 1, toString: 4 }] : undefined,
      variationLabel: `Pos ${baseFret}`
    }
  ];
}
