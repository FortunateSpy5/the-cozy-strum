import React from 'react';
import { Guitar, Music, ArrowRight } from 'lucide-react';
import type { CompactSongEntry } from '../../lib/firebase/types';

interface SearchDropdownResultsProps {
  results: CompactSongEntry[];
  query: string;
  activeIndex: number | null;
}

export function SearchDropdownResults({
  results,
  query,
  activeIndex,
}: SearchDropdownResultsProps): React.JSX.Element {
  return (
    <div
      id="practice-search-results"
      role="listbox"
      aria-label="Search suggestions"
      className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl bg-surface border border-warm shadow-2xl p-2 max-h-[400px] overflow-y-auto scrollbar-thin animate-in fade-in duration-150"
    >
      {results.length > 0 ? (
        <>
          {results.map((song, idx) => (
            <a
              key={song.i}
              id={`suggestion-${song.i}`}
              role="option"
              aria-selected={activeIndex === idx}
              href={`/tab?id=${encodeURIComponent(song.i)}`}
              className={`flex items-center justify-between p-3 rounded-xl transition-colors group cursor-pointer focus-visible:outline-none ${
                activeIndex === idx ? 'bg-terracotta/15 text-espresso ring-1 ring-terracotta/40' : 'hover:bg-canvas'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-canvas border border-warm flex items-center justify-center text-terracotta shrink-0">
                  {song.ins === 'u' ? <Music className="w-4 h-4" aria-hidden="true" /> : <Guitar className="w-4 h-4" aria-hidden="true" />}
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-espresso group-hover:text-terracotta transition-colors">
                    {song.t}
                  </h4>
                  <p className="text-xs text-walnut">{song.a}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-canvas border border-warm text-walnut">
                  {song.ins === 'u' ? 'Ukulele' : 'Guitar'}
                </span>
                <ArrowRight className="w-4 h-4 text-walnut group-hover:text-terracotta transition-colors" aria-hidden="true" />
              </div>
            </a>
          ))}
          <a
            href={`/explore?q=${encodeURIComponent(query.trim())}`}
            className="flex items-center justify-between p-2.5 mt-1 rounded-xl bg-canvas border border-warm/60 text-xs font-semibold text-terracotta hover:bg-surface transition-colors"
          >
            <span>View all results for &ldquo;{query.trim()}&rdquo; in Directory</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </a>
        </>
      ) : (
        <div className="p-4 text-center space-y-2">
          <p className="text-xs text-walnut">No quick matches for &ldquo;{query}&rdquo;.</p>
          <a
            href={`/explore?q=${encodeURIComponent(query.trim())}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-terracotta hover:underline"
          >
            <span>Search full directory for &ldquo;{query}&rdquo; →</span>
          </a>
        </div>
      )}
    </div>
  );
}
