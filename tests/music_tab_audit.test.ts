import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  transposeChord,
  transposeNote,
  getCapoOpenChord
} from '../src/lib/music/transpose';

import {
  getChordVoicing
} from '../src/lib/music/chordVoicings';

import {
  classifyLine
} from '../src/lib/parser/classifier';

import {
  extractChordTokens,
  reconstructChordLine
} from '../src/lib/parser/chordExtractor';

import { parseSongText } from '../src/lib/parser/songParser';
import { SAMPLE_TAB } from '../src/components/import/sampleTab';

describe('1. Standard Chord Transpositions & Semitone Math', () => {
  it('transposes C through all 12 chromatic semitones (sharps)', () => {
    const expectedSharps = [
      'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C'
    ];
    for (let i = 0; i <= 12; i++) {
      const result = transposeChord('C', i, false);
      assert.equal(result, expectedSharps[i], `C transposed by +${i} semitones should be ${expectedSharps[i]}`);
    }
  });

  it('transposes C through all 12 chromatic semitones (flats)', () => {
    const expectedFlats = [
      'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B', 'C'
    ];
    for (let i = 0; i <= 12; i++) {
      const result = transposeChord('C', i, true);
      assert.equal(result, expectedFlats[i], `C transposed by +${i} semitones with preferFlats should be ${expectedFlats[i]}`);
    }
  });

  it('handles negative semitone shifts (-1 to -12)', () => {
    assert.equal(transposeChord('C', -1), 'B');
    assert.equal(transposeChord('C', -2), 'A#');
    assert.equal(transposeChord('C', -2, true), 'Bb');
    assert.equal(transposeChord('C', -3), 'A');
    assert.equal(transposeChord('C', -5), 'G');
    assert.equal(transposeChord('C', -7), 'F');
    assert.equal(transposeChord('C', -12), 'C');
  });

  it('handles arbitrary large positive and negative semitone shifts with modulo wrapping', () => {
    assert.equal(transposeChord('C', 24), 'C');
    assert.equal(transposeChord('C', -24), 'C');
    assert.equal(transposeChord('C', 25), 'C#');
    assert.equal(transposeChord('C', -25), 'B');
    assert.equal(transposeChord('C', -125), 'G');
    assert.equal(transposeChord('E', -122), 'D');
  });

  it('preserves 0-shift chord identity exactly', () => {
    assert.equal(transposeChord('F#m7', 0), 'F#m7');
    assert.equal(transposeChord('Bbmaj7', 0), 'Bbmaj7');
    assert.equal(transposeChord('D/F#', 0), 'D/F#');
  });

  it('correctly maps rare theoretical enharmonics (B#, E#, Cb, Fb)', () => {
    assert.equal(transposeNote('B#', 0), 'C');
    assert.equal(transposeNote('E#', 0), 'F');
    assert.equal(transposeNote('Cb', 0), 'B');
    assert.equal(transposeNote('Fb', 0), 'E');
  });
});

describe('2. Slash Chords Transposition', () => {
  it('accurately transposes both root and bass notes across positive and negative shifts', () => {
    // D/F# + 2 -> E/G#
    assert.equal(transposeChord('D/F#', 2), 'E/G#');
    // D/F# - 2 -> C/E
    assert.equal(transposeChord('D/F#', -2), 'C/E');
    // G/B - 5 -> D/F#
    assert.equal(transposeChord('G/B', -5), 'D/F#');
    // C/E - 5 -> G/B
    assert.equal(transposeChord('C/E', -5), 'G/B');
  });

  it('handles minor slash chords and extensions', () => {
    assert.equal(transposeChord('Am/G', 2), 'Bm/A');
    assert.equal(transposeChord('Bm7/A', -2), 'Am7/G');
  });

  it('handles octave boundary wrapping for bass notes', () => {
    // C/B + 1 -> C#/C
    assert.equal(transposeChord('C/B', 1), 'C#/C');
    // C#/C - 1 -> C/B
    assert.equal(transposeChord('C#/C', -1), 'C/B');
  });

  it('handles enharmonic flat preference on slash chords', () => {
    assert.equal(transposeChord('F#/A#', 1, true), 'G/B');
    assert.equal(transposeChord('C/E', 1, true), 'Db/F');
  });
});

describe('3. Complex Chords & Enharmonic Handling', () => {
  it('correctly matches and transposes complex chord qualities', () => {
    // F#m7
    assert.equal(transposeChord('F#m7', 1), 'Gm7');
    // Cadd9
    assert.equal(transposeChord('Cadd9', 2), 'Dadd9');
    // Dsus4
    assert.equal(transposeChord('Dsus4', 5), 'Gsus4');
    // A7sus4 (Wonderwall chord)
    assert.equal(transposeChord('A7sus4', 3), 'C7sus4');
    assert.equal(transposeChord('A7sus4', -2), 'G7sus4');
    // Bm7b5 (half-diminished)
    assert.equal(transposeChord('Bm7b5', 1), 'Cm7b5');
    // Power chords (5th chords)
    assert.equal(transposeChord('E5', 1), 'F5');
    assert.equal(transposeChord('A5', 2), 'B5');
    // Major 7th
    assert.equal(transposeChord('Cmaj7', 2), 'Dmaj7');
    // Minor 9th
    assert.equal(transposeChord('Am9', 2), 'Bm9');
    // Diminished & Augmented
    assert.equal(transposeChord('Bdim7', 1), 'Cdim7');
    assert.equal(transposeChord('Caug', 4), 'Eaug');
    assert.equal(transposeChord('G+', 2), 'A+');
  });

  it('automatically preserves flat spelling when transposing flat chords without preferFlats', () => {
    // Bb transposed by +2 -> C (natural)
    assert.equal(transposeChord('Bb', 2), 'C');
    // Bb transposed by -2 -> Ab (not G#)
    assert.equal(transposeChord('Bb', -2), 'Ab');
    // Eb transposed by +1 -> E (natural)
    assert.equal(transposeChord('Eb', 1), 'E');
    // Eb transposed by -2 -> Db (not C#)
    assert.equal(transposeChord('Eb', -2), 'Db');
  });

  it('calculates Capo open chords accurately', () => {
    // Key of E, Capo 2 -> play D shape
    assert.equal(getCapoOpenChord('E', 2), 'D');
    // Key of E, Capo 4 -> play C shape
    assert.equal(getCapoOpenChord('E', 4), 'C');
    // Key of G, Capo 3 -> play E shape
    assert.equal(getCapoOpenChord('G', 3), 'E');
    // Key of Bb, Capo 1 -> play A shape
    assert.equal(getCapoOpenChord('Bb', 1), 'A');
    // Key of F#, Capo 2 -> play E shape
    assert.equal(getCapoOpenChord('F#', 2), 'E');
    // Capo 0 -> returns original chord
    assert.equal(getCapoOpenChord('G', 0), 'G');
  });
});

describe('4. Line Classification', () => {
  it('classifies bracketed section headers', () => {
    assert.equal(classifyLine('[Intro]'), 'section-header');
    assert.equal(classifyLine('[Verse 1]'), 'section-header');
    assert.equal(classifyLine('[Chorus]'), 'section-header');
    assert.equal(classifyLine('[Bridge]'), 'section-header');
    assert.equal(classifyLine('[Outro]'), 'section-header');
  });

  it('classifies unbracketed section headers with and without colons', () => {
    assert.equal(classifyLine('Intro:'), 'section-header');
    assert.equal(classifyLine('Verse 1:'), 'section-header');
    assert.equal(classifyLine('Chorus:'), 'section-header');
    assert.equal(classifyLine('Bridge:'), 'section-header');
    assert.equal(classifyLine('Verse 1'), 'section-header');
    assert.equal(classifyLine('Chorus'), 'section-header');
    assert.equal(classifyLine('Outro'), 'section-header');
    assert.equal(classifyLine('Solo'), 'section-header');
  });

  it('classifies chord-only lines including lines containing chord A', () => {
    assert.equal(classifyLine('G        C/G       Em7      D'), 'chord-line');
    assert.equal(classifyLine('A   D   E'), 'chord-line');
    assert.equal(classifyLine('A'), 'chord-line');
    assert.equal(classifyLine('A   Bm   G   D'), 'chord-line');
    assert.equal(classifyLine('Em7   G   Dsus4   A7sus4'), 'chord-line');
    assert.equal(classifyLine('Cadd9   G/B   Am7   D/F#'), 'chord-line');
    assert.equal(classifyLine('E5   B5   C#5   A5'), 'chord-line');
  });

  it('correctly classifies lyric lines that contain words like A, I, Am', () => {
    assert.equal(classifyLine('A boy walked down the road'), 'lyric-line');
    assert.equal(classifyLine('Here I am again'), 'lyric-line');
    assert.equal(classifyLine('Am I dreaming tonight'), 'lyric-line');
    assert.equal(classifyLine('I love the way you play guitar'), 'lyric-line');
    assert.equal(classifyLine('Today is gonna be the day'), 'lyric-line');
    assert.equal(classifyLine('Because maybe, you\'re gonna be the one'), 'lyric-line');
  });

  it('classifies 6-string guitar ASCII tab lines', () => {
    assert.equal(classifyLine('e|---0-------2-------|'), 'ascii-tab');
    assert.equal(classifyLine('B|---1-------3-------|'), 'ascii-tab');
    assert.equal(classifyLine('G|---0-------2-------|'), 'ascii-tab');
    assert.equal(classifyLine('D|---2-------0-------|'), 'ascii-tab');
    assert.equal(classifyLine('A|---3---------------|'), 'ascii-tab');
    assert.equal(classifyLine('E|-------------------|'), 'ascii-tab');
    // Tab lines with articulations (hammer, pull, slide, bend)
    assert.equal(classifyLine('e|---12h14p12---10/12\\10---15b17r15~---|'), 'ascii-tab');
  });

  it('classifies 4-string ukulele ASCII tab lines (including C string)', () => {
    assert.equal(classifyLine('A|---0---2---3---|'), 'ascii-tab');
    assert.equal(classifyLine('E|---0---0---0---|'), 'ascii-tab');
    assert.equal(classifyLine('C|---0---2---3---|'), 'ascii-tab');
    assert.equal(classifyLine('G|---2---2---2---|'), 'ascii-tab');
  });

  it('classifies empty lines', () => {
    assert.equal(classifyLine(''), 'empty');
    assert.equal(classifyLine('   '), 'empty');
    assert.equal(classifyLine('\t'), 'empty');
  });
});

describe('5. Column Offset Preservation & Line Reconstruction', () => {
  it('extracts chord tokens with exact column offsets', () => {
    const line = 'Em7            G       Dsus4          A7sus4';
    const tokens = extractChordTokens(line);
    assert.equal(tokens.length, 4);
    assert.equal(tokens[0]?.chord, 'Em7');
    assert.equal(tokens[0]?.col, 0);
    assert.equal(tokens[1]?.chord, 'G');
    assert.equal(tokens[1]?.col, 15);
    assert.equal(tokens[2]?.chord, 'Dsus4');
    assert.equal(tokens[2]?.col, 23);
    assert.equal(tokens[3]?.chord, 'A7sus4');
    assert.equal(tokens[3]?.col, 38);
  });

  it('reconstructs transposed chord lines preserving spacing', () => {
    const line = 'Em7            G';
    const tokens = extractChordTokens(line);
    const transposed = tokens.map(t => transposeChord(t.chord, 2)); // F#m7, A
    const reconstructed = reconstructChordLine(tokens, transposed);

    assert.equal(reconstructed.startsWith('F#m7'), true);
    assert.equal(reconstructed.indexOf('A'), 15);
  });

  it('prevents chord collisions when transposed chords expand', () => {
    const tokens = [
      { chord: 'G', col: 0 },
      { chord: 'C', col: 2 }
    ];
    // G transposed to G#maj7 (length 6), overflows past col 2
    const transposed = ['G#maj7', 'C#'];
    const reconstructed = reconstructChordLine(tokens, transposed);
    assert.equal(reconstructed, 'G#maj7 C#');
  });
});

describe('6. Chord Voicings & Fallback Behavior', () => {
  it('retrieves known guitar voicings with correct fingering & frets', () => {
    const cVoicing = getChordVoicing('C', 'guitar');
    assert.equal(cVoicing.name, 'C');
    assert.equal(cVoicing.instrument, 'guitar');
    assert.deepEqual(cVoicing.frets, [-1, 3, 2, 0, 1, 0]);

    const dVoicing = getChordVoicing('D', 'guitar');
    assert.deepEqual(dVoicing.frets, [-1, -1, 0, 2, 3, 2]);

    const a7sus4 = getChordVoicing('A7sus4', 'guitar');
    assert.equal(a7sus4.name, 'A7sus4');
    assert.deepEqual(a7sus4.frets, [-1, 0, 2, 0, 3, 0]);
  });

  it('retrieves known ukulele voicings with correct frets', () => {
    const cVoicing = getChordVoicing('C', 'ukulele');
    assert.equal(cVoicing.name, 'C');
    assert.equal(cVoicing.instrument, 'ukulele');
    assert.deepEqual(cVoicing.frets, [0, 0, 0, 3]);

    const gVoicing = getChordVoicing('G', 'ukulele');
    assert.deepEqual(gVoicing.frets, [0, 2, 3, 2]);

    const a7sus4Uke = getChordVoicing('A7sus4', 'ukulele');
    assert.equal(a7sus4Uke.name, 'A7sus4');
    assert.deepEqual(a7sus4Uke.frets, [0, 2, 0, 0]);
  });

  it('handles enharmonic fallback (e.g. A# -> Bb)', () => {
    const aSharpGuitar = getChordVoicing('A#', 'guitar');
    assert.ok(aSharpGuitar);
    assert.equal(aSharpGuitar.name, 'A#');
    // Should have Bb frets, not all 0s!
    assert.notDeepEqual(aSharpGuitar.frets, [0, 0, 0, 0, 0, 0]);
    assert.deepEqual(aSharpGuitar.frets, [-1, 1, 3, 3, 3, 1]);
  });

  it('handles slash chord fallback (e.g. C/E -> C)', () => {
    const ceGuitar = getChordVoicing('C/E', 'guitar');
    assert.ok(ceGuitar);
    assert.notDeepEqual(ceGuitar.frets, [0, 0, 0, 0, 0, 0]);
  });

  it('returns valid fallback structure for completely unknown chord', () => {
    const unknownGuitar = getChordVoicing('UnknownChord', 'guitar');
    assert.equal(unknownGuitar.instrument, 'guitar');
    assert.equal(unknownGuitar.frets.length, 6);

    const unknownUke = getChordVoicing('UnknownChord', 'ukulele');
    assert.equal(unknownUke.instrument, 'ukulele');
    assert.equal(unknownUke.frets.length, 4);
  });
});

describe('7. Song AST Parsing & Demo Tab', () => {
  it('parses SAMPLE_TAB completely and detects all unique chords', () => {
    const ast = parseSongText(SAMPLE_TAB);
    assert.ok(ast.lines.length > 0);
    // Wonderwall must detect A7sus4 along with Em7, G, Dsus4, Cadd9
    assert.ok(ast.uniqueChords.includes('A7sus4'), 'Must detect A7sus4 in Wonderwall');
    assert.ok(ast.uniqueChords.includes('Em7'));
    assert.ok(ast.uniqueChords.includes('G'));
    assert.ok(ast.uniqueChords.includes('Dsus4'));
    assert.ok(ast.uniqueChords.includes('Cadd9'));
  });

  it('correctly parses and groups multi-line ASCII tab blocks', () => {
    const ukeTab = `[Solo]
A|---0---2---3---|
E|---0---0---0---|
C|---0---2---3---|
G|---2---2---2---|

Em7   G`;

    const ast = parseSongText(ukeTab);
    const tabLine = ast.lines.find(l => l.type === 'ascii-tab');
    assert.ok(tabLine, 'Should have an ascii-tab block');
    if (tabLine && tabLine.type === 'ascii-tab') {
      assert.equal(tabLine.lines.length, 4, 'Ukulele tab block must contain all 4 strings (A, E, C, G)');
    }
  });

  it('normalizes unbracketed section headers in song text', () => {
    const song = `Intro:
G   C
Verse 1
G   C
Chorus:
D   C`;
    const ast = parseSongText(song);
    const headers = ast.lines.filter(l => l.type === 'section-header').map(l => l.text);
    assert.deepEqual(headers, ['[Intro]', '[Verse 1]', '[Chorus]']);
  });
});
