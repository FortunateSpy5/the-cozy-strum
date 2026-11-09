import type { LineType } from '../types';
import { CHORD_REGEX } from '../music/transpose';

const SECTION_HEADER_REGEX =
  /^\[([^\]]+)\]$|^(Intro|Verse\s*\d*|Chorus\s*\d*|Bridge\s*\d*|Outro|Solo|Interlude|Pre-Chorus|Hook)\s*:?$/i;

const ASCII_TAB_LINE_REGEX = /^[A-Ga-g]\s*\|[\d\-\|\/\\hpbr~xXsS\(\)\^v\s]{3,}/;

// Lyric stopwords (strictly excluding 'a' and 'am' which are musical chords)
const COMMON_LYRIC_WORDS = new Set([
  'the', 'and', 'to', 'in', 'that', 'i', 'it', 'for', 'not', 'on', 'with', 'he',
  'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say',
  'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
  'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when'
]);

export function isSectionHeader(line: string): boolean {
  return SECTION_HEADER_REGEX.test(line.trim());
}

export function isAsciiTabLine(line: string): boolean {
  return ASCII_TAB_LINE_REGEX.test(line.trim());
}

export function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (isSectionHeader(line) || isAsciiTabLine(line)) return false;

  // Split line by whitespace
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;

  let chordCount = 0;
  for (const token of tokens) {
    // If token is a common lyric stopword, this line is lyrics
    if (COMMON_LYRIC_WORDS.has(token.toLowerCase())) {
      return false;
    }
    // Check if token matches standard chord pattern
    if (CHORD_REGEX.test(token)) {
      chordCount++;
    }
  }

  // If >= 60% of tokens are valid chords, it's a chord line
  return chordCount / tokens.length >= 0.6;
}

export function classifyLine(line: string): LineType {
  const trimmed = line.trim();
  if (!trimmed) return 'empty';
  if (isSectionHeader(line)) return 'section-header';
  if (isAsciiTabLine(line)) return 'ascii-tab';
  if (isChordLine(line)) return 'chord-line';
  return 'lyric-line';
}
