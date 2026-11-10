import React, { useState, useEffect, useMemo } from 'react';
import { ArrowRight, Guitar, Music } from 'lucide-react';
import {
  getSongDirectory,
  getFallbackSongDirectory,
  syncSongDirectory,
  filterSongDirectory,
  difficultyLabel,
  DIRECTORY_CACHE_KEY,
} from '../../lib/firebase/songDirectoryService';
import type { CompactSongEntry } from '../../lib/firebase/types';
import { ExploreFilterBar } from './ExploreFilterBar';
import { ExplorePagination } from './ExplorePagination';

const PAGE_SIZE = 24;

export function ExploreDirectoryIsland(): React.JSX.Element {
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [query, setQuery] = useState('');
  const [instrument, setInstrument] = useState<'all' | 'guitar' | 'ukulele'>('all');
  const [fingerstyleOnly, setFingerstyleOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'title' | 'artist'>('title');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const initialQuery = params.get('q');
      if (initialQuery) {
        setQuery(initialQuery);
      }
    }
    getSongDirectory().then((doc) => {
      if (doc?.songs?.length) setSongs(doc.songs);
    });
  }, []);

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (newQuery.trim()) {
        url.searchParams.set('q', newQuery);
      } else {
        url.searchParams.delete('q');
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const doc = await syncSongDirectory();
      if (doc?.songs?.length) setSongs(doc.songs);
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredSongs = useMemo(() => {
    const list = filterSongDirectory(songs, query, instrument, fingerstyleOnly);
    return list.sort((a, b) => {
      if (sortBy === 'artist') {
        const cmp = a.a.localeCompare(b.a);
        return cmp !== 0 ? cmp : a.t.localeCompare(b.t);
      }
      return a.t.localeCompare(b.t);
    });
  }, [songs, query, instrument, fingerstyleOnly, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [query, instrument, fingerstyleOnly, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredSongs.length / PAGE_SIZE));
  const paginatedSongs = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredSongs.slice(start, start + PAGE_SIZE);
  }, [filteredSongs, page]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <ExploreFilterBar
        query={query} onQueryChange={handleQueryChange}
        instrument={instrument} onInstrumentChange={setInstrument}
        fingerstyleOnly={fingerstyleOnly} onFingerstyleChange={setFingerstyleOnly}
        sortBy={sortBy} onSortChange={setSortBy}
        isSyncing={isSyncing} onSync={handleSync}
      />

      <div className="flex items-center justify-between text-xs text-walnut px-1">
        <span>
          Showing <strong className="text-espresso font-semibold">{filteredSongs.length}</strong> songs
          {totalPages > 1 && ` (Page ${page} of ${totalPages})`}
        </span>
        <span className="font-mono text-[11px] text-walnut/70">1-Doc Cached Directory</span>
      </div>

      {paginatedSongs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-surface border border-warm">
          <p className="font-serif text-base font-bold text-espresso">No songs matched &ldquo;{query}&rdquo;</p>
          <p className="text-xs text-walnut mt-1">Try clearing your search query or instrument toggle.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {paginatedSongs.map((song) => {
            const isUke = song.ins === 'u';
            const diff = difficultyLabel(song.d);
            return (
              <a
                key={song.i}
                href={`/tab?id=${encodeURIComponent(song.i)}`}
                className="group p-3.5 rounded-xl bg-surface border border-warm hover:border-terracotta hover:shadow-xs transition-all flex items-center justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-canvas border border-warm flex items-center justify-center text-terracotta shrink-0 group-hover:scale-105 transition-transform">
                    {isUke ? <Music className="w-4 h-4" /> : <Guitar className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-serif font-bold text-sm text-espresso group-hover:text-terracotta transition-colors truncate">
                      {song.t}
                    </h3>
                    <p className="text-xs text-walnut truncate">{song.a}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-canvas border border-warm text-walnut">
                    {diff}
                  </span>
                  {song.f === 1 && (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold">
                      Fingerstyle
                    </span>
                  )}
                  <ArrowRight className="w-4 h-4 text-walnut group-hover:text-terracotta transition-colors ml-1" />
                </div>
              </a>
            );
          })}
        </div>
      )}

      <ExplorePagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
