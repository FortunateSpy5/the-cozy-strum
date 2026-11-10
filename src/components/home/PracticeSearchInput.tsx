import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Guitar, Music, ArrowRight, Loader2 } from 'lucide-react';
import { getSongDirectory, filterSongDirectory } from '../../lib/firebase/songDirectoryService';
import type { CompactSongEntry } from '../../lib/firebase/types';

export function PracticeSearchInput(): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [songs, setSongs] = useState<CompactSongEntry[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadDirectory = async () => {
    if (songs !== null || isLoading) return;
    setIsLoading(true);
    try {
      const doc = await getSongDirectory();
      setSongs(doc.songs);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
    loadDirectory();
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const results = useMemo(() => {
    if (!songs || !query.trim()) return [];
    return filterSongDirectory(songs, query).slice(0, 8);
  }, [songs, query]);

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-walnut/70 pointer-events-none" aria-hidden="true" />
        <input
          type="search"
          aria-label="Search acoustic songs by title or artist"
          placeholder="Search 243+ acoustic songs by title or artist…"
          value={query}
          onFocus={handleFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
            loadDirectory();
          }}
          className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-surface border border-warm text-sm text-espresso placeholder:text-walnut/60 shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta transition-all"
        />
        {isLoading && (
          <Loader2 className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-terracotta animate-spin" aria-hidden="true" />
        )}
      </div>

      {isOpen && query.trim().length > 0 && (
        <div
          role="listbox"
          aria-label="Search suggestions"
          className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl bg-surface border border-warm shadow-2xl p-2 max-h-[380px] overflow-y-auto scrollbar-thin animate-in fade-in duration-150"
        >
          {results.length > 0 ? (
            results.map((song) => (
              <a
                key={song.i}
                href={`/tab?id=${encodeURIComponent(song.i)}`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-canvas focus-visible:bg-canvas text-left transition-colors group cursor-pointer focus-visible:outline-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-canvas border border-warm flex items-center justify-center text-terracotta shrink-0">
                    {song.ins === 'u' ? <Music className="w-4 h-4" /> : <Guitar className="w-4 h-4" />}
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
                  <ArrowRight className="w-4 h-4 text-walnut group-hover:text-terracotta transition-colors" />
                </div>
              </a>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-walnut">
              {isLoading ? 'Searching song directory…' : `No songs found matching "${query}".`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
