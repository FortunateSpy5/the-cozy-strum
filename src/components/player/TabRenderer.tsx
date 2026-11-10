import React from 'react';
import type { ParsedLine } from '../../lib/types';
import { transposeChord } from '../../lib/music/transpose';
import { reconstructChordLine } from '../../lib/parser/chordExtractor';

interface TabRendererProps {
  lines: ParsedLine[];
  semitones: number;
  fontSize: 'sm' | 'base' | 'lg' | 'xl';
  columnMode: 'single' | 'two-column' | 'three-column';
  onChordClick?: (chord: string) => void;
}

const FONT_SIZE_CLASSES: Record<string, string> = {
  sm: 'text-xs leading-5',
  base: 'text-sm leading-6',
  lg: 'text-base leading-7',
  xl: 'text-lg leading-8'
};

export const TabRenderer: React.FC<TabRendererProps> = ({
  lines,
  semitones,
  fontSize,
  columnMode,
  onChordClick
}) => {
  const fontClass = FONT_SIZE_CLASSES[fontSize] ?? 'text-sm leading-6';

  const getContainerLayout = () => {
    if (columnMode === 'two-column') {
      return 'md:columns-2 gap-8 [column-fill:_auto] w-full';
    }
    if (columnMode === 'three-column') {
      return 'lg:columns-3 md:columns-2 gap-8 [column-fill:_auto] w-full';
    }
    return 'w-full';
  };

  return (
    <div className={`tab-sheet pb-36 max-w-full overflow-x-auto ${getContainerLayout()}`}>
      {lines.map((line, idx) => {
        if (line.type === 'section-header') {
          const rawText = line.text.replace(/^\[|\]$/g, '').trim();
          const baseSlug = rawText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
          const uniqueId = `section-${idx}-${baseSlug}`;
          return (
            <div
              id={uniqueId}
              key={`section-block-${idx}`}
              className="mt-6 mb-2 pt-2 border-t border-warm/40 first:border-0 first:mt-0 break-inside-avoid scroll-mt-28"
            >
              <h3 className="font-serif font-bold text-terracotta tracking-wide text-sm sm:text-base">
                {line.text}
              </h3>
            </div>
          );
        }

        if (line.type === 'chord-line') {
          const transposedChords = line.chords.map((c) => transposeChord(c.chord, semitones));
          let currentPos = 0;

          return (
            <div
              key={`chord-${idx}`}
              className={`tab-monospace font-bold text-amber-800 dark:text-amber-300 select-text ${fontClass} break-inside-avoid`}
              aria-label={`Chords: ${transposedChords.join(', ')}`}
            >
              {line.chords.length > 0 ? (
                line.chords.map((token, cIdx) => {
                  const chordName = transposedChords[cIdx] ?? token.chord;
                  const paddingLen = token.col > currentPos ? token.col - currentPos : currentPos > 0 ? 1 : 0;
                  const padding = ' '.repeat(paddingLen);
                  currentPos = (token.col > currentPos ? token.col : currentPos + paddingLen) + chordName.length;

                  return (
                    <React.Fragment key={`c-${cIdx}`}>
                      {padding}
                      <button
                        type="button"
                        aria-label={`Inspect ${chordName} chord`}
                        onClick={() => onChordClick?.(chordName)}
                        className="inline bg-transparent border-0 p-0 font-inherit font-bold cursor-pointer hover:underline hover:text-terracotta rounded-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-terracotta transition-colors text-inherit"
                      >
                        {chordName}
                      </button>
                    </React.Fragment>
                  );
                })
              ) : (
                reconstructChordLine(line.chords, transposedChords)
              )}
            </div>
          );
        }

        if (line.type === 'lyric-line') {
          return (
            <div
              key={`lyric-${idx}`}
              className={`tab-monospace text-espresso select-text ${fontClass} break-inside-avoid`}
            >
              {line.text}
            </div>
          );
        }

        if (line.type === 'ascii-tab') {
          return (
            <div
              key={`ascii-${idx}`}
              tabIndex={0}
              role="region"
              aria-label="ASCII tablature. Use horizontal arrow keys to scroll."
              className="my-3 p-3 rounded-xl bg-canvas border border-warm/80 overflow-x-auto scrollbar-thin break-inside-avoid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
            >
              <pre className="tab-monospace text-espresso/90 text-xs sm:text-sm leading-5">
                {line.lines.join('\n')}
              </pre>
            </div>
          );
        }

        return <div key={`empty-${idx}`} className="h-3" />;
      })}
    </div>
  );
};
