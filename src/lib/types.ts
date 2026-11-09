export type Instrument = 'guitar' | 'ukulele';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface SongMetadata {
  title: string;
  artist: string;
  instrument: Instrument;
  tuning: string;
  capo: number;
  bpm?: number;
  difficulty: Difficulty;
  strummingPattern?: string;
  tags: string[];
  isFingerstyle: boolean;
  key?: string;
  createdAt: string;
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
