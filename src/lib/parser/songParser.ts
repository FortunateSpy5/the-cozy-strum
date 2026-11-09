import type { SongAst, ParsedLine } from '../types';
import { classifyLine } from './classifier';
import { extractChordTokens } from './chordExtractor';

export function parseSongText(raw: string): SongAst {
  const lines = raw.split(/\r?\n/);
  const parsedLines: ParsedLine[] = [];
  const uniqueChordSet = new Set<string>();

  let tabStaveBuffer: string[] = [];

  const flushTabBuffer = () => {
    if (tabStaveBuffer.length > 0) {
      parsedLines.push({
        type: 'ascii-tab',
        lines: [...tabStaveBuffer]
      });
      tabStaveBuffer = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i] ?? '';
    const lineType = classifyLine(rawLine);

    if (lineType === 'ascii-tab') {
      tabStaveBuffer.push(rawLine);
      continue;
    }

    // Flush any pending ascii tab buffer before processing other line types
    flushTabBuffer();

    if (lineType === 'section-header') {
      // Normalize header, e.g. "Intro:" -> "[Intro]" or leave "[Chorus]" as is
      let header = rawLine.trim();
      if (!header.startsWith('[')) {
        header = `[${header.replace(/:$/, '')}]`;
      }
      parsedLines.push({
        type: 'section-header',
        text: header
      });
    } else if (lineType === 'chord-line') {
      const tokens = extractChordTokens(rawLine);
      for (const token of tokens) {
        uniqueChordSet.add(token.chord);
      }
      parsedLines.push({
        type: 'chord-line',
        chords: tokens,
        raw: rawLine
      });
    } else if (lineType === 'lyric-line') {
      parsedLines.push({
        type: 'lyric-line',
        text: rawLine
      });
    } else {
      parsedLines.push({
        type: 'empty'
      });
    }
  }

  // Final flush in case tab was at end of song
  flushTabBuffer();

  return {
    lines: parsedLines,
    uniqueChords: Array.from(uniqueChordSet)
  };
}
