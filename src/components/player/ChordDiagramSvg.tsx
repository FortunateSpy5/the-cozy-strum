import React from 'react';
import type { ChordVoicing } from '../../lib/types';

interface ChordDiagramSvgProps {
  voicing: ChordVoicing;
  className?: string;
  size?: number; // width in px (default 85)
}

export const ChordDiagramSvg: React.FC<ChordDiagramSvgProps> = ({
  voicing,
  className = '',
  size = 85
}) => {
  const isGuitar = voicing.instrument === 'guitar';
  const numStrings = isGuitar ? 6 : 4;
  const numFrets = 5;

  const width = isGuitar ? 90 : 76, height = 110;
  const paddingX = 14, paddingTop = 26, paddingBottom = 14;

  const stringSpacing = (width - 2 * paddingX) / (numStrings - 1);
  const fretSpacing = (height - paddingTop - paddingBottom) / numFrets;

  const getStringX = (index: number) => paddingX + index * stringSpacing;
  const getFretY = (fretIndex: number) => paddingTop + fretIndex * fretSpacing;

  const fretDesc = voicing.frets
    .map((f, i) => `string ${isGuitar ? 6 - i : 4 - i}: ${f === -1 ? 'muted' : f === 0 ? 'open' : `fret ${f}`}`)
    .join(', ');

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <span className="text-xs font-mono font-bold text-espresso dark:text-cream tracking-wide mb-1" aria-hidden="true">
        {voicing.name}
      </span>
      <svg
        role="img"
        width={size}
        height={(size / width) * height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
        aria-label={`${voicing.name} chord diagram for ${voicing.instrument}`}
      >
        <title>{`${voicing.name} chord diagram for ${voicing.instrument}`}</title>
        <desc>{`${voicing.name} chord for ${voicing.instrument}. Strings from lowest to highest: ${fretDesc}.`}</desc>

        {/* Nut (fret 0) or base fret label */}
        {voicing.baseFret === 1 ? (
          <line
            x1={paddingX}
            y1={paddingTop}
            x2={width - paddingX}
            y2={paddingTop}
            stroke="currentColor"
            strokeWidth="3.5"
            className="text-espresso dark:text-cream"
          />
        ) : (
          <>
            <line
              x1={paddingX}
              y1={paddingTop}
              x2={width - paddingX}
              y2={paddingTop}
              stroke="currentColor"
              strokeWidth="1.2"
              className="text-espresso/70 dark:text-cream/70"
            />
            <text
              x={paddingX - 4}
              y={paddingTop + fretSpacing * 0.7}
              textAnchor="end"
              className="text-[9px] font-mono fill-walnut dark:fill-cream/70 font-semibold"
            >
              fr{voicing.baseFret}
            </text>
          </>
        )}

        {/* Frets */}
        {Array.from({ length: numFrets }).map((_, f) => (
          <line
            key={`fret-${f + 1}`}
            x1={paddingX}
            y1={getFretY(f + 1)}
            x2={width - paddingX}
            y2={getFretY(f + 1)}
            stroke="currentColor"
            strokeWidth="1"
            className="text-espresso/30 dark:text-cream/30"
          />
        ))}

        {/* Strings */}
        {Array.from({ length: numStrings }).map((_, s) => (
          <line
            key={`string-${s}`}
            x1={getStringX(s)}
            y1={paddingTop}
            x2={getStringX(s)}
            y2={getFretY(numFrets)}
            stroke="currentColor"
            strokeWidth={s === 0 && isGuitar ? '1.8' : '1'}
            className="text-espresso/60 dark:text-cream/60"
          />
        ))}

        {/* Barre indicators */}
        {voicing.barres?.map((barre, idx) => {
          const fretIdx = barre.fromFret - (voicing.baseFret - 1);
          if (fretIdx < 1 || fretIdx > numFrets) return null;
          const x1 = getStringX(barre.fromString - 1);
          const x2 = getStringX(barre.toString - 1);
          const y = getFretY(fretIdx) - fretSpacing / 2;
          return (
            <rect
              key={`barre-${idx}`}
              x={Math.min(x1, x2) - 4}
              y={y - 4.5}
              width={Math.abs(x2 - x1) + 8}
              height={9}
              rx={4.5}
              className="fill-terracotta dark:fill-amber-500 opacity-90"
            />
          );
        })}

        {/* Muted (X) and Open (O) indicators */}
        {voicing.frets.map((fret, sIdx) => {
          const x = getStringX(sIdx);
          const y = paddingTop - 8;
          if (fret === -1) {
            return (
              <text
                key={`mute-${sIdx}`}
                x={x}
                y={y + 3}
                textAnchor="middle"
                className="text-[10px] font-mono fill-walnut/70 dark:fill-cream/60 font-bold"
              >
                ✕
              </text>
            );
          }
          if (fret === 0) {
            return (
              <circle
                key={`open-${sIdx}`}
                cx={x}
                cy={y}
                r="3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                className="text-espresso/70 dark:text-cream/70"
              />
            );
          }
          return null;
        })}

        {/* Fretted Dots & Finger numbers */}
        {voicing.frets.map((fret, sIdx) => {
          if (fret <= 0) return null;
          const fretIdx = fret - (voicing.baseFret - 1);
          if (fretIdx < 1 || fretIdx > numFrets) return null;

          const cx = getStringX(sIdx);
          const cy = getFretY(fretIdx) - fretSpacing / 2;
          const finger = voicing.fingers ? voicing.fingers[sIdx] : 0;

          return (
            <g key={`dot-${sIdx}`}>
              <circle cx={cx} cy={cy} r="5" className="fill-terracotta dark:fill-amber-500 shadow-sm" />
              {finger && finger > 0 ? (
                <text
                  x={cx}
                  y={cy + 3}
                  textAnchor="middle"
                  className="text-[7.5px] font-mono font-bold fill-white pointer-events-none select-none"
                >
                  {finger}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
