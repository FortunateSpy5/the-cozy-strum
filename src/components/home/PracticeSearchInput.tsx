import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Guitar, Music, ArrowRight, Loader2, X } from 'lucide-react';
import { getSongDirectory, filterSongDirectory } from '../../lib/firebase/songDirectoryService';
import type { CompactSongEntry } from '../../lib/firebase/types';

export function PracticeSearchInput(): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [songs, setSongs] = useState<CompactSongEntry[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
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
        setActiveIndex(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const results = useMemo(() => {
    if (!songs || !query.trim()) return [];
    return filterSongDirectory(songs, query).slice(0, 8);
  }, [songs, query]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev === null || prev >= results.length - 1 ? 0 : prev + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev === null || prev <= 0 ? results.length - 1 : prev - 1));
    } else if (e.key === 'Enter' && activeIndex !== null && results[activeIndex]) {
      e.preventDefault();
      window.location.href = `/tab?id=${encodeURIComponent(results[activeIndex].i)}`;
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(null);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-walnut pointer-events-none" aria-hidden="true" />
        <input
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen && results.length > 0}
          aria-controls="practice-search-results"
          aria-activedescendant={activeIndex !== null && results[activeIndex] ? `suggestion-${results[activeIndex].i}` : undefined}
          aria-label="Search acoustic songs by title or artist"
          placeholder="Search 243+ songs by title or artist…"
          value={query}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(null);
            if (!isOpen) setIsOpen(true);
            loadDirectory();
          }}
          className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-surface border border-warm text-sm text-espresso placeholder:text-walnut/60 shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta transition-all"
        />
        {isLoading ? (
          <Loader2 className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-terracotta animate-spin" aria-hidden="true" />
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              setActiveIndex(null);
            }}
            aria-label="Clear search query"
            className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] flex items-center justify-center text-walnut hover:text-espresso rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {isOpen && query.trim().length > 0 && (
        <div
          id="practice-search-results"
          role="listbox"
          aria-label="Search suggestions"
          className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl bg-surface border border-warm shadow-2xl p-2 max-h-[380px] overflow-y-auto scrollbar-thin animate-in fade-in duration-150"
        >
          {results.length > 0 ? (
            results.map((song, idx) => (
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
