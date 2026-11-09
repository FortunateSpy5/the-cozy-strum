export type Instrument = 'guitar' | 'ukulele';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export const SONG_CATEGORIES = [
  'Acoustic',
  'Folk',
  'Singer-Songwriter',
  'Classic Rock',
  'Rock',
  'Indie',
  'Alternative',
  'Pop',
  'Ballad',
  'Campfire',
  'Fingerstyle',
  'Bollywood',
  'Hindi Indie',
  'Bengali Modern',
  'Rabindrasangeet',
  'Soundtrack',
  'Country',
  'Americana',
  'Blues',
  'Soul',
  'R&B',
  'Jazz',
  'Bossa Nova',
  'Reggae',
  'World'
] as const;

export type SongCategory = typeof SONG_CATEGORIES[number];

export interface SongMetadata {
  title: string;
  artist: string;
  album?: string;
  releaseYear?: number;
  category?: string;
  categories?: SongCategory[];
  instrument: Instrument;
  tuning: string;
  capo: number;
  bpm?: number;
  difficulty: Difficulty;
  strummingPattern?: string;
  tags: string[];
  isFingerstyle: boolean;
  key?: string;
  timeSignature?: string;
  createdAt: string;
  slug?: string;
  isCustom?: boolean;
}

export interface UserTab extends SongMetadata {
  id: string;
  slug: string;
  content: string;
  isCustom: true;
}

export interface TabItem extends SongMetadata {
  id?: string;
  slug: string;
  content?: string;
  isCustom?: boolean;
}

export type LineType = 
  | 'section-header'
  | 'chord-line'
  | 'lyric-line'
  | 'ascii-tab'
  | 'empty';

export interface ChordToken {
  chord: string;
  col: number;
}

export type ParsedLine =
  | { type: 'section-header'; text: string }
  | { type: 'chord-line'; chords: ChordToken[]; raw: string }
  | { type: 'lyric-line'; text: string }
  | { type: 'ascii-tab'; lines: string[] }
  | { type: 'empty' };

export interface SongAst {
  lines: ParsedLine[];
  uniqueChords: string[];
}

export interface ChordVoicing {
  name: string;
  instrument: Instrument;
  baseFret: number;
  frets: number[]; // -1 = Muted, 0 = Open, 1+ = Fretted
  fingers?: number[]; // 0 = None, 1=Index, 2=Middle, 3=Ring, 4=Pinky
  barres?: {
    fromFret: number;
    fromString: number;
    toString: number;
  }[];
}

export interface UserPreferences {
  theme: 'parchment' | 'campfire';
  defaultInstrument: Instrument;
  fontSize: 'sm' | 'base' | 'lg' | 'xl';
  autoScrollSpeed: number;
  columnMode: 'single' | 'two-column' | 'three-column';
  dockPosition: 'bottom' | 'top';
  metronomeVolume: number;
}

export interface Setlist {
  id: string;
  name: string;
  description?: string;
  songSlugs: string[];
  updatedAt: string;
}
