import { transposeChord } from './transpose';

export interface CapoRecommendation {
  recommendedCapo: number;
  originalBarreCount: number;
  optimizedBarreCount: number;
  originalChords: string[];
  simplifiedChords: string[];
  reason: string;
}

const COMMON_OPEN_SHAPES = new Set([
  'C', 'A', 'G', 'E', 'D',
  'Am', 'Em', 'Dm',
  'C7', 'A7', 'G7', 'E7', 'D7', 'B7',
  'Am7', 'Em7', 'Dm7', 'Em9',
  'Cadd9', 'Dsus4', 'Asus4', 'Esus4', 'A7sus4', 'D/F#',
]);

export function isBarreChord(chord: string): boolean {
  const clean = chord.trim().replace(/\*$/, '');
  if (!clean) return false;
  if (COMMON_OPEN_SHAPES.has(clean)) return false;

  const mainChord = clean.split('/')[0];
  if (mainChord && COMMON_OPEN_SHAPES.has(mainChord)) return false;

  const rootMatch = clean.match(/^[A-G](?:#|b)?/);
  if (!rootMatch) return false;
  const root = rootMatch[0];

  // F, Bb, B (except B7), Eb, Ab, C# are notoriously difficult barre chords for beginners
  if (['F', 'F#', 'Gb', 'G#', 'Ab', 'A#', 'Bb', 'B', 'C#', 'Db', 'Eb', 'D#'].includes(root)) {
    return true;
  }

  // Minors on roots without standard open minor shapes (e.g. Gm, Cm, Fm, Bm)
  if (clean.includes('m') && !['Am', 'Em', 'Dm'].includes(clean)) {
    return true;
  }

  return false;
}

export function countBarreChords(chords: string[]): number {
  return chords.filter(isBarreChord).length;
}

export function recommendCapo(
  chordsUsed: string[],
  currentCapo = 0,
  maxCapoSearch = 7
): CapoRecommendation | null {
  if (!chordsUsed || chordsUsed.length === 0) return null;

  const uniqueChords = Array.from(new Set(chordsUsed.map((c) => c.trim()))).filter(Boolean);
  const currentBarreCount = countBarreChords(uniqueChords);

  // If the song already has zero or very few barres, no need for recommendation
  if (currentBarreCount === 0) return null;

  let bestCapo = currentCapo;
  let minBarres = currentBarreCount;
  let bestSimplifiedChords: string[] = uniqueChords;

  // Test Capo positions 1 to maxCapoSearch (e.g. 1 through 7)
  for (let testCapo = 1; testCapo <= maxCapoSearch; testCapo++) {
    if (testCapo === currentCapo) continue;

    // Transpose chords down by testCapo semitones to find the open shapes
    const shift = -testCapo;
    const testShapes = uniqueChords.map((c) => transposeChord(c, shift));
    const testBarres = countBarreChords(testShapes);

    // We want to reduce barre chords significantly (at least by 1, ideally to 0)
    if (testBarres < minBarres) {
      minBarres = testBarres;
      bestCapo = testCapo;
      bestSimplifiedChords = testShapes;
    }
  }

  // Only recommend if we actually eliminated barre chords
  if (bestCapo !== currentCapo && minBarres < currentBarreCount) {
    const eliminated = currentBarreCount - minBarres;
    return {
      recommendedCapo: bestCapo,
      originalBarreCount: currentBarreCount,
      optimizedBarreCount: minBarres,
      originalChords: uniqueChords,
      simplifiedChords: bestSimplifiedChords,
      reason: `Capo ${bestCapo} eliminates ${eliminated} difficult barre chord${eliminated > 1 ? 's' : ''} with open campfire shapes (${bestSimplifiedChords.slice(0, 4).join(', ')}).`,
    };
  }

  return null;
}
