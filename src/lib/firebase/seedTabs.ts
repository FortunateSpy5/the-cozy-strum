import type { CloudTab } from './types';

export const SEED_TABS: CloudTab[] = [
  {
    id: 'seed-acoustic-strumming',
    slug: 'wonderwall-acoustic',
    title: 'Wonderwall',
    artist: 'Oasis',
    album: "(What's the Story) Morning Glory?",
    releaseYear: 1995,
    category: 'Britpop / 90s',
    categories: ['Rock', 'Classic Rock', 'Pop', 'Campfire'],
    instrument: 'guitar',
    tuning: 'Standard (E A D G B E)',
    capo: 2,
    bpm: 88,
    key: 'Em',
    timeSignature: '4/4',
    difficulty: 'Beginner',
    strummingPattern: 'D - D - D U D - D - D U D U',
    isFingerstyle: false,
    content: `[Intro]
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
You're my wonderwall`,
    chordsUsed: ['Em7', 'G', 'Dsus4', 'A7sus4', 'Cadd9'],
    authorUid: 'system-seed',
    authorName: 'The Cozy Strum',
    visibility: 'public',
    status: 'approved',
    favoritesCount: 142,
    viewsCount: 1250,
    createdAt: '2026-11-09T10:00:00.000Z',
    updatedAt: '2026-11-09T10:00:00.000Z',
  },
  {
    id: 'seed-fingerstyle-blues',
    slug: 'dust-in-the-wind',
    title: 'Dust in the Wind',
    artist: 'Kansas',
    album: 'Point of Know Return',
    releaseYear: 1977,
    category: 'Classic Rock / Acoustic',
    categories: ['Acoustic', 'Folk', 'Classic Rock', 'Fingerstyle'],
    instrument: 'guitar',
    tuning: 'Standard (E A D G B E)',
    capo: 0,
    bpm: 94,
    key: 'C',
    timeSignature: '4/4',
    difficulty: 'Intermediate',
    strummingPattern: 'Travis Picking (T 1 T 2)',
    isFingerstyle: true,
    content: `[Fingerpicking Intro]
e|---------------------------------|---------------------------------|
B|-------1-------0-------3-------1-|-------1-------0-------3-------1-|
G|-----0-------0-------0-------0---|-----0-------0-------0-------0---|
D|---2-------2-------2-------2-----|---2-------2-------2-------2-----|
A|-3-------3-------3-------3-------|-3-------3-------3-------3-------|
E|---------------------------------|---------------------------------|

[Verse 1]
C        G/B    Am
I close my eyes
G             Dm7        Am
Only for a moment and the moment's gone
C        G/B    Am
All my dreams
G             Dm7          Am
Pass before my eyes, a curiosity

[Chorus]
D/F#     G           Am      Am
Dust in the wind
D/F#            G          Am
All they are is dust in the wind`,
    chordsUsed: ['C', 'G/B', 'Am', 'G', 'Dm7', 'D/F#'],
    authorUid: 'system-seed',
    authorName: 'The Cozy Strum',
    visibility: 'public',
    status: 'approved',
    favoritesCount: 98,
    viewsCount: 840,
    createdAt: '2026-11-09T10:15:00.000Z',
    updatedAt: '2026-11-09T10:15:00.000Z',
  },
  {
    id: 'seed-ukulele-island',
    slug: 'riptide-ukulele',
    title: 'Riptide (Ukulele Edition)',
    artist: 'Vance Joy',
    album: 'Dream Your Life Away',
    releaseYear: 2013,
    category: 'Indie Folk / Ukulele',
    categories: ['Indie', 'Pop', 'Acoustic', 'Campfire'],
    instrument: 'ukulele',
    tuning: 'Standard Ukulele (G C E A)',
    capo: 1,
    bpm: 102,
    key: 'Am',
    timeSignature: '4/4',
    difficulty: 'Beginner',
    strummingPattern: 'D - D U - U D U',
    isFingerstyle: false,
    content: `[Intro]
Am   G   C
Am   G   C

[Verse 1]
Am            G                    C
I was scared of dentists and the dark
Am            G                    C
I was scared of pretty girls and starting conversations
Am            G                   C
Oh, all my friends are turning green
Am                   G                     C
You're the magician's assistant in their dream

[Chorus]
Am     G            C
Oh, oh, and they come unstuck
Am     G               C
Lady, running down to the riptide
          C
Taken away to the dark side
Am       G           C
I wanna be your left hand man
Am         G                 C
I love you when you're singing that song and
           C
I got a lump in my throat 'cause
Am              G               C
You're gonna sing the words wrong`,
    chordsUsed: ['Am', 'G', 'C'],
    authorUid: 'system-seed',
    authorName: 'The Cozy Strum',
    visibility: 'public',
    status: 'approved',
    favoritesCount: 165,
    viewsCount: 1420,
    createdAt: '2026-11-09T10:30:00.000Z',
    updatedAt: '2026-11-09T10:30:00.000Z',
  },
];
