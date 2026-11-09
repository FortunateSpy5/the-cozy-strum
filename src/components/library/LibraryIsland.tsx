import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Music2 } from 'lucide-react';
import type { TabItem, Instrument } from '../../lib/types';
import { getUserTabs, deleteUserTab } from '../../lib/storage/tabStorage';
import { SongCard } from './SongCard';

interface LibraryIslandProps {
  initialTabs: TabItem[];
}

export const LibraryIsland: React.FC<LibraryIslandProps> = ({ initialTabs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [instrumentFilter, setInstrumentFilter] = useState<'all' | Instrument>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'fingerstyle' | 'strumming' | 'custom'>('all');
  const [customTabs, setCustomTabs] = useState<TabItem[]>([]);

  useEffect(() => {
    const loaded = getUserTabs();
    setCustomTabs(loaded);
  }, []);

  const handleDeleteCustom = (id: string) => {
    deleteUserTab(id);
    setCustomTabs((prev) => prev.filter((t) => t.id !== id));
  };

  const allTabs = useMemo(() => {
    // Custom tabs take precedence if duplicate slugs exist
    const map = new Map<string, TabItem>();
    initialTabs.forEach((tab) => map.set(tab.slug, tab));
    customTabs.forEach((tab) => map.set(tab.slug, tab));
    return Array.from(map.values());
  }, [initialTabs, customTabs]);

  const filteredTabs = useMemo(() => {
    return allTabs.filter((tab) => {
      // Instrument match
      if (instrumentFilter !== 'all' && tab.instrument !== instrumentFilter) {
        return false;
      }
      // Type match
      if (typeFilter === 'fingerstyle' && !tab.isFingerstyle) return false;
      if (typeFilter === 'strumming' && tab.isFingerstyle) return false;
      if (typeFilter === 'custom' && !tab.isCustom) return false;

      // Query match
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const inTitle = tab.title.toLowerCase().includes(q);
      const inArtist = tab.artist.toLowerCase().includes(q);
      const inTags = tab.tags?.some((t) => t.toLowerCase().includes(q));
      return inTitle || inArtist || inTags;
    });
  }, [allTabs, instrumentFilter, typeFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-surface border border-warm">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-walnut/70" aria-hidden="true" />
          <input
            id="library-search-input"
            type="search"
            aria-label="Search tabs by song title, artist, or tags"
            placeholder="Search by song title, artist, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 min-h-[44px] rounded-xl bg-canvas border border-warm text-sm text-espresso placeholder:text-walnut/50 focus:outline-none focus:border-terracotta focus-visible:ring-2 focus-visible:ring-terracotta/30"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Instrument Filter */}
          <div role="group" aria-label="Filter by instrument" className="inline-flex rounded-xl bg-canvas border border-warm p-1">
            {(['all', 'guitar', 'ukulele'] as const).map((inst) => (
              <button
                key={inst}
                type="button"
                onClick={() => setInstrumentFilter(inst)}
                aria-pressed={instrumentFilter === inst}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta ${
                  instrumentFilter === inst ? 'bg-terracotta text-white shadow-xs' : 'text-walnut hover:text-espresso'
                }`}
              >
                {inst}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <div role="group" aria-label="Filter by song type" className="inline-flex rounded-xl bg-canvas border border-warm p-1">
            {([
              { id: 'all', label: 'All Types' },
              { id: 'fingerstyle', label: 'Fingerstyle' },
              { id: 'custom', label: `Saved (${customTabs.length})` }
            ] as const).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTypeFilter(id)}
                aria-pressed={typeFilter === id}
                className={`min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta ${
                  typeFilter === id ? 'bg-espresso text-canvas dark:bg-cream dark:text-espresso' : 'text-walnut hover:text-espresso'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-walnut px-1">
        <span role="status" aria-live="polite">
          Showing <strong className="text-espresso font-semibold">{filteredTabs.length}</strong> sanctuary songs
        </span>
        <a
          href="/import"
          className="min-h-[44px] inline-flex items-center gap-1.5 text-terracotta hover:underline font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta rounded-md"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Paste New Tab</span>
        </a>
      </div>

      {/* Grid */}
      {filteredTabs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTabs.map((tab) => (
            <SongCard key={tab.slug} tab={tab} onDeleteCustom={handleDeleteCustom} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 rounded-3xl bg-surface border border-warm">
          <Music2 className="w-12 h-12 mx-auto text-walnut/50 mb-3" aria-hidden="true" />
          <h4 className="font-serif text-lg font-bold text-espresso mb-1">No songs found</h4>
          <p className="text-sm text-walnut max-w-md mx-auto mb-5">
            {searchQuery
              ? `No tabs matching "${searchQuery}". Try a different search or clear filters.`
              : 'Your practice library is waiting. Paste a song from Ultimate Guitar to get started.'}
          </p>
          <a
            href="/import"
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-terracotta text-white text-sm font-medium hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 transition-opacity"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Paste a Tab Now
          </a>
        </div>
      )}
    </div>
  );
};
