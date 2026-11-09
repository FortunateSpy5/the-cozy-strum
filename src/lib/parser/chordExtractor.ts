import type { ChordToken } from '../types';
import { CHORD_REGEX } from '../music/transpose';

/**
 * Extracts chord tokens and their starting column offsets from a chord line.
 */
export function extractChordTokens(line: string): ChordToken[] {
  const tokens: ChordToken[] = [];
  const regex = /\S+/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    const word = match[0];
    if (CHORD_REGEX.test(word)) {
      tokens.push({
        chord: word,
        col: match.index
      });
    }
  }

  return tokens;
}

/**
 * Reconstructs a chord line from ChordTokens with transposed chords.
 */
export function reconstructChordLine(tokens: ChordToken[], transposedChords: string[]): string {
  if (tokens.length === 0) return '';
  
  let result = '';
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token) continue;
    const chord = transposedChords[i] ?? token.chord;
    
    // Pad with spaces up to col offset
    if (result.length < token.col) {
      result += ' '.repeat(token.col - result.length);
    } else if (result.length > 0 && result.length >= token.col) {
      // If previous chord length overflowed into this chord's column, add at least 1 space
      result += ' ';
    }
    result += chord;
  }

  return result;
}
