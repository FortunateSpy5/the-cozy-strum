import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import {
  getSongDirectory,
  getFallbackSongDirectory,
  filterSongDirectory,
  DIRECTORY_CACHE_KEY,
} from '../../lib/firebase/songDirectoryService';
import type { CompactSongEntry } from '../../lib/firebase/types';
import { SearchDropdownResults } from './SearchDropdownResults';

export function PracticeSearchInput(): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [songs, setSongs] = useState<CompactSongEntry[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(DIRECTORY_CACHE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.data?.songs?.length > 0) return parsed.data.songs;
        }
      } catch {
        // Fallback to local catalog
      }
    }
    return getFallbackSongDirectory().songs;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadDirectory = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const doc = await getSongDirectory();
      if (doc?.songs?.length) {
        setSongs(doc.songs);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
    loadDirectory();
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const results = useMemo(() => {
    if (!songs || !query.trim()) return [];
    return filterSongDirectory(songs, query).slice(0, 8);
  }, [songs, query]);

  const handleSubmit = (e?: React.SyntheticEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (activeIndex !== null && results[activeIndex]) {
      window.location.href = `/tab?id=${encodeURIComponent(results[activeIndex].i)}`;
    } else if (results.length > 0 && results[0]) {
      window.location.href = `/tab?id=${encodeURIComponent(results[0].i)}`;
    } else if (query.trim()) {
      window.location.href = `/explore?q=${encodeURIComponent(query.trim())}`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) setIsOpen(true);
      setActiveIndex((prev) => (prev === null || prev >= results.length - 1 ? 0 : prev + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) setIsOpen(true);
      setActiveIndex((prev) => (prev === null || prev <= 0 ? results.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(null);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      <form role="search" onSubmit={handleSubmit} className="relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-walnut pointer-events-none" aria-hidden="true" />
        <input
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen && query.trim().length > 0}
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
      </form>

      {isOpen && query.trim().length > 0 && (
        <SearchDropdownResults
          results={results}
          query={query}
          activeIndex={activeIndex}
        />
      )}
    </div>
  );
}
