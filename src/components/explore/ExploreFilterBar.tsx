import React from 'react';
import { Search, RotateCw } from 'lucide-react';

interface ExploreFilterBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  instrument: 'all' | 'guitar' | 'ukulele';
  onInstrumentChange: (ins: 'all' | 'guitar' | 'ukulele') => void;
  fingerstyleOnly: boolean;
  onFingerstyleChange: (val: boolean) => void;
  sortBy: 'title' | 'artist';
  onSortChange: (sort: 'title' | 'artist') => void;
  isSyncing: boolean;
  onSync: () => void;
}

export function ExploreFilterBar({
  query,
  onQueryChange,
  instrument,
  onInstrumentChange,
  fingerstyleOnly,
  onFingerstyleChange,
  sortBy,
  onSortChange,
  isSyncing,
  onSync,
}: ExploreFilterBarProps): React.JSX.Element {
  return (
    <div className="p-4 rounded-2xl bg-surface border border-warm shadow-sm space-y-3">
      {/* Search and Sync */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-walnut pointer-events-none" aria-hidden="true" />
          <input
            type="search"
            aria-label="Filter song directory"
            placeholder="Search by song title or artist…"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 min-h-[44px] rounded-xl bg-canvas border border-warm text-sm text-espresso placeholder:text-walnut/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta transition-colors"
          />
        </div>

        <button
          type="button"
          onClick={onSync}
          disabled={isSyncing}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-canvas border border-warm hover:border-terracotta text-espresso text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
          title="Refresh directory from cloud (bypasses 24h local cache)"
        >
          <RotateCw className={`w-3.5 h-3.5 text-terracotta ${isSyncing ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span>{isSyncing ? 'Syncing…' : 'Sync New Songs'}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-warm/40 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {(['all', 'guitar', 'ukulele'] as const).map((ins) => (
            <button
              key={ins}
              type="button"
              aria-pressed={instrument === ins}
              onClick={() => onInstrumentChange(ins)}
              className={`min-h-[44px] px-3.5 py-2 rounded-lg font-medium transition-colors cursor-pointer capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta ${
                instrument === ins
                  ? 'bg-terracotta text-white font-semibold shadow-xs'
                  : 'bg-canvas text-walnut hover:text-espresso border border-warm/60'
              }`}
            >
              {ins === 'all' ? 'All Instruments' : ins}
            </button>
          ))}

          <button
            type="button"
            aria-pressed={fingerstyleOnly}
            onClick={() => onFingerstyleChange(!fingerstyleOnly)}
            className={`min-h-[44px] px-3.5 py-2 rounded-lg font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta ${
              fingerstyleOnly
                ? 'bg-amber-600 text-white font-semibold shadow-xs'
                : 'bg-canvas text-walnut hover:text-espresso border border-warm/60'
            }`}
          >
            Fingerstyle Only
          </button>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort-directory-select" className="text-walnut text-[11px] font-mono font-medium">Sort:</label>
          <select
            id="sort-directory-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as 'title' | 'artist')}
            aria-label="Sort directory by"
            className="min-h-[44px] px-3 py-2 rounded-lg bg-canvas border border-warm text-espresso text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta cursor-pointer"
          >
            <option value="title">Title (A–Z)</option>
            <option value="artist">Artist (A–Z)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
