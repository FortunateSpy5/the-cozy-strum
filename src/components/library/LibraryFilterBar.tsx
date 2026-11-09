import React from 'react';
import { Search } from 'lucide-react';
import type { Instrument } from '../../lib/types';
import { SONG_CATEGORIES, type SongCategory } from '../../lib/types';

interface LibraryFilterBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  instrumentFilter: 'all' | Instrument;
  onInstrumentChange: (val: 'all' | Instrument) => void;
  typeFilter: 'all' | 'fingerstyle' | 'custom';
  onTypeChange: (val: 'all' | 'fingerstyle' | 'custom') => void;
  categoryFilter: 'all' | SongCategory;
  onCategoryChange: (val: 'all' | SongCategory) => void;
  customTabsCount: number;
}

export function LibraryFilterBar({
  searchQuery,
  onSearchChange,
  instrumentFilter,
  onInstrumentChange,
  typeFilter,
  onTypeChange,
  categoryFilter,
  onCategoryChange,
  customTabsCount,
}: LibraryFilterBarProps): React.JSX.Element {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-4 rounded-2xl bg-surface border border-warm">
      <div className="relative flex-1">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-walnut/70" aria-hidden="true" />
        <input
          id="library-search-input"
          name="search"
          type="search"
          autoComplete="off"
          spellCheck={false}
          aria-label="Search tabs by song title, artist, or tags"
          placeholder="Search by title, artist, genre, or decade…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 min-h-[44px] rounded-xl bg-canvas border border-warm text-sm text-espresso placeholder:text-walnut/50 focus:outline-none focus:border-terracotta"
        />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none flex-wrap">
        {/* Category / Genre Dropdown */}
        <select
          aria-label="Filter by genre or category"
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value as 'all' | SongCategory)}
          className="min-h-[44px] px-3 py-1.5 rounded-xl bg-canvas border border-warm text-xs font-medium text-espresso focus:outline-none focus:border-terracotta cursor-pointer"
        >
          <option value="all">All Genres</option>
          {SONG_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Instrument Filter */}
        <div role="group" aria-label="Filter by instrument" className="inline-flex rounded-xl bg-canvas border border-warm p-1">
          {(['all', 'guitar', 'ukulele'] as const).map((inst) => (
            <button
              key={inst}
              type="button"
              onClick={() => onInstrumentChange(inst)}
              aria-pressed={instrumentFilter === inst}
              className={`min-h-[40px] px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                instrumentFilter === inst ? 'bg-terracotta text-white' : 'text-walnut hover:text-espresso'
              }`}
            >
              {inst}
            </button>
          ))}
        </div>

        {/* Type Filter */}
        <div role="group" aria-label="Filter by song type" className="inline-flex rounded-xl bg-canvas border border-warm p-1">
          {[
            { id: 'all' as const, label: 'All Types' },
            { id: 'fingerstyle' as const, label: 'Fingerstyle' },
            { id: 'custom' as const, label: `Saved (${customTabsCount})` },
          ].map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => onTypeChange(id)}
              aria-pressed={typeFilter === id}
              className={`min-h-[40px] px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === id ? 'bg-espresso text-canvas dark:bg-cream dark:text-espresso' : 'text-walnut hover:text-espresso'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
