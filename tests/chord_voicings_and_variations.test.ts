import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getChordVoicing,
  getChordVoicings,
  hasChordVariations,
  GUITAR_VOICINGS,
  UKULELE_VOICINGS
} from '../src/lib/music/chordVoicings';
import catalog from '../src/lib/firebase/catalogSeedData.json';

describe('Chord Voicings & Variations Engine', () => {
  it('covers all 12 chromatic keys for Guitar with valid fretboards', () => {
    const chromaticRoots = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    for (const root of chromaticRoots) {
      const voicing = getChordVoicing(root, 'guitar');
      assert.equal(voicing.instrument, 'guitar');
      assert.equal(voicing.frets.length, 6);
      // Must not be all zeros (fallback)
      assert.ok(voicing.frets.some((f) => f !== 0), `${root} on guitar must have real frets`);
    }
  });

  it('covers all 12 chromatic keys for Ukulele with valid fretboards', () => {
    const chromaticRoots = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    for (const root of chromaticRoots) {
      const voicing = getChordVoicing(root, 'ukulele');
      assert.equal(voicing.instrument, 'ukulele');
      assert.equal(voicing.frets.length, 4);
      // Must have fretted strings (not all 0)
      assert.ok(voicing.frets.some((f) => f > 0), `${root} on ukulele must have frets > 0`);
    }
  });

  it('provides multiple variations for standard guitar chords (Open, Barre A-shape, Barre E-shape)', () => {
    const cVoicings = getChordVoicings('C', 'guitar');
    assert.ok(cVoicings.length >= 3, 'C on guitar should have at least 3 variations');
    assert.equal(cVoicings[0]?.baseFret, 1, 'Var 1 should be open position');
    assert.equal(cVoicings[1]?.baseFret, 3, 'Var 2 should be barre at fret 3 (A-shape)');
    assert.equal(cVoicings[2]?.baseFret, 8, 'Var 3 should be barre at fret 8 (E-shape)');

    const gVoicings = getChordVoicings('G', 'guitar');
    assert.ok(gVoicings.length >= 3, 'G on guitar should have at least 3 variations');
    assert.equal(gVoicings[0]?.frets[4], 3, 'Var 1 should be 4-finger rock G');
    assert.equal(gVoicings[1]?.frets[4], 0, 'Var 2 should be 3-finger standard G');
    assert.equal(gVoicings[2]?.baseFret, 3, 'Var 3 should be barre at fret 3');
  });

  it('provides multiple variations for standard ukulele chords', () => {
    const cUke = getChordVoicings('C', 'ukulele');
    assert.ok(cUke.length >= 3, 'C on ukulele should have at least 3 variations');
    assert.deepEqual(cUke[0]?.frets, [0, 0, 0, 3], 'Var 1 should be open C [0,0,0,3]');
    assert.equal(cUke[1]?.baseFret, 3, 'Var 2 should be at fret 3');
    assert.equal(cUke[2]?.baseFret, 7, 'Var 3 should be at fret 7');

    const gUke = getChordVoicings('G', 'ukulele');
    assert.ok(gUke.length >= 2, 'G on ukulele should have at least 2 variations');
    assert.deepEqual(gUke[0]?.frets, [0, 2, 3, 2], 'Var 1 should be open G [0,2,3,2]');
  });

  it('correctly reports hasChordVariations helper', () => {
    assert.equal(hasChordVariations('C', 'guitar'), true);
    assert.equal(hasChordVariations('G', 'guitar'), true);
    assert.equal(hasChordVariations('C', 'ukulele'), true);
    assert.equal(hasChordVariations('UnknownChord', 'guitar'), false);
  });

  it('retrieves specific variation by variationIndex with bounds clamping', () => {
    const var0 = getChordVoicing('C', 'guitar', 0);
    const var1 = getChordVoicing('C', 'guitar', 1);
    const var999 = getChordVoicing('C', 'guitar', 999);

    assert.equal(var0.baseFret, 1);
    assert.equal(var1.baseFret, 3);
    // Should clamp to last variation without throwing
    assert.equal(var999.baseFret, 8);
  });

  it('resolves all guitar slash chords with proper bass notes', () => {
    const dFsharp = getChordVoicing('D/F#', 'guitar');
    assert.equal(dFsharp.frets[0], 2, 'D/F# must have F# (fret 2) on lowest 6th string');

    const gB = getChordVoicing('G/B', 'guitar');
    assert.equal(gB.frets[1], 2, 'G/B must have B (fret 2) on 5th string');

    const cE = getChordVoicing('C/E', 'guitar');
    assert.equal(cE.frets[0], 0, 'C/E must have low E (fret 0) open');

    const amG = getChordVoicing('Am/G', 'guitar');
    assert.equal(amG.frets[0], 3, 'Am/G must have G (fret 3) on 6th string');
  });

  it('ensures 100% of chords used across the catalogSeedData have valid non-empty voicings', () => {
    const catalogChords = new Set<string>();
    for (const song of catalog) {
      for (const chord of song.chordsUsed || []) {
        catalogChords.add(chord);
      }
    }

    assert.ok(catalogChords.size > 100, `Catalog should have > 100 chords, got ${catalogChords.size}`);

    for (const chord of catalogChords) {
      // Guitar check
      const g = getChordVoicing(chord, 'guitar');
      assert.equal(g.frets.length, 6, `${chord} must have 6 strings for guitar`);
      assert.ok(
        g.frets.some((f) => f !== 0),
        `Catalog chord "${chord}" on guitar must NOT fall back to all-0 open strings!`
      );

      // Ukulele check
      const u = getChordVoicing(chord, 'ukulele');
      assert.equal(u.frets.length, 4, `${chord} must have 4 strings for ukulele`);
      // Except natural open chords (Am7, C6) which are all 0s by definition
      if (!['Am7', 'C6'].includes(chord)) {
        assert.ok(
          u.frets.some((f) => f !== 0),
          `Catalog chord "${chord}" on ukulele must NOT fall back to all-0 open strings!`
        );
      }
    }
  });

  it('generates movable barre shapes for complex transposed chords', () => {
    const fSharpM7 = getChordVoicing('F#m7', 'guitar');
    assert.ok(fSharpM7.barres && fSharpM7.barres.length > 0, 'F#m7 should be a barre chord');
    assert.equal(fSharpM7.baseFret, 2, 'F#m7 on guitar should have baseFret 2');

    const cSharpMaj7 = getChordVoicing('C#maj7', 'guitar');
    assert.equal(cSharpMaj7.baseFret, 4, 'C#maj7 on guitar should have baseFret 4');

    const bFlatSus4 = getChordVoicing('Bbsus4', 'guitar');
    assert.equal(bFlatSus4.baseFret, 1, 'Bbsus4 should have baseFret 1');
  });

  it('preserves backward compatibility with GUITAR_VOICINGS and UKULELE_VOICINGS exports', () => {
    assert.ok(GUITAR_VOICINGS['C'], 'GUITAR_VOICINGS must contain C');
    assert.ok(GUITAR_VOICINGS['Am'], 'GUITAR_VOICINGS must contain Am');
    assert.ok(UKULELE_VOICINGS['C'], 'UKULELE_VOICINGS must contain C');
    assert.ok(UKULELE_VOICINGS['G'], 'UKULELE_VOICINGS must contain G');
  });
});
