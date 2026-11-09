import type { TabSubmissionInput } from '../../lib/firebase/submitService';

export type MetadataInput = Omit<TabSubmissionInput, 'content'>;

export const INITIAL_METADATA: MetadataInput = {
  title: '',
  artist: '',
  album: '',
  releaseYear: undefined,
  categories: ['Acoustic'],
  instrument: 'guitar',
  tuning: 'Standard (E A D G B E)',
  capo: 0,
  difficulty: 'Beginner',
  isFingerstyle: false,
  visibility: 'public',
};

export const INITIAL_CONTENT = `[Verse 1]\n\nWise men say only fools rush in\n\nBut I can't help falling in love with you`;
