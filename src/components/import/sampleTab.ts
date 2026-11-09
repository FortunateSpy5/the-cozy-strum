import type { SongMetadata } from '../../lib/types';

export const SAMPLE_TAB = `[Intro]
Em7   G   Dsus4   A7sus4
Em7   G   Dsus4   A7sus4

[Verse 1]
Em7            G
Today is gonna be the day
                Dsus4               A7sus4
That they're gonna throw it back to you
Em7               G
By now you should've somehow
        Dsus4              A7sus4
Realized what you gotta do
Em7                  G       Dsus4          A7sus4
I don't believe that anybody feels the way I do
             Cadd9   Dsus4   A7sus4
About you now

[Chorus]
       Cadd9         Em7      G
Because maybe, you're gonna be the one that saves me
    Em7     Cadd9   Em7   G
And after all
             Em7     Cadd9   Em7   G   Em7
You're my wonderwall`;

export function getSampleMetadata(): SongMetadata {
  return {
    title: 'Wonderwall',
    artist: 'Oasis',
    instrument: 'guitar',
    tuning: 'Standard (E A D G B e)',
    capo: 2,
    bpm: 88,
    difficulty: 'beginner',
    strummingPattern: 'D - D - D U D - D - D U D U',
    tags: ['90s', 'britpop', 'acoustic-classic'],
    isFingerstyle: false,
    key: 'Em',
    createdAt: new Date().toISOString()
  };
}
