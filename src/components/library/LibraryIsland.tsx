import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Music2, Sparkles, Loader2 } from 'lucide-react';
import type { TabItem, Instrument, Difficulty, SongCategory } from '../../lib/types';
import { getUserTabs, deleteUserTab } from '../../lib/storage/tabStorage';
import { getCatalogIndex, seedInitialTabs } from '../../lib/firebase/tabsService';
import { SongCard } from './SongCard';
import { LibraryFilterBar } from './LibraryFilterBar';

interface LibraryIslandProps {
  initialTabs: TabItem[];
}

export const LibraryIsland: React.FC<LibraryIslandProps> = ({ initialTabs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [instrumentFilter, setInstrumentFilter] = useState<'all' | Instrument>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'fingerstyle' | 'custom'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | SongCategory>('all');
  const [customTabs, setCustomTabs] = useState<TabItem[]>([]);
  const [cloudTabs, setCloudTabs] = useState<TabItem[]>(initialTabs);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    setCustomTabs(getUserTabs());

    async function loadCatalog() {
      const catalog = await getCatalogIndex();
      const items: TabItem[] = Object.values(catalog.items).map((s) => ({
        id: s.id,
        slug: s.slug,
        title: s.title,
        artist: s.artist,
        album: s.album,
        releaseYear: s.releaseYear,
        category: s.category,
        categories: s.categories || [],
        instrument: s.instrument,
        tuning: s.tuning,
        capo: s.capo,
        bpm: s.bpm,
        difficulty: s.difficulty.toLowerCase() as Difficulty,
        tags: [s.instrument, ...(s.categories || [])],
        isFingerstyle: s.isFingerstyle,
        createdAt: s.updatedAt,
        isCustom: false,
      }));
      if (items.length > 0) {
        setCloudTabs(items);
      }
    }

    loadCatalog();
  }, []);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const res = await seedInitialTabs();
      const items: TabItem[] = Object.values(res.items).map((s) => ({
        id: s.id,
        slug: s.slug,
        title: s.title,
        artist: s.artist,
        album: s.album,
        releaseYear: s.releaseYear,
        category: s.category,
        categories: s.categories || [],
        instrument: s.instrument,
        tuning: s.tuning,
        capo: s.capo,
        bpm: s.bpm,
        difficulty: s.difficulty.toLowerCase() as Difficulty,
        tags: [s.instrument, ...(s.categories || [])],
        isFingerstyle: s.isFingerstyle,
        createdAt: s.updatedAt,
        isCustom: false,
      }));
      setCloudTabs(items);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleDeleteCustom = (id: string) => {
    deleteUserTab(id);
    setCustomTabs((prev) => prev.filter((t) => t.id !== id));
  };

  const allTabs = useMemo(() => {
    const map = new Map<string, TabItem>();
    cloudTabs.forEach((tab) => map.set(tab.id || tab.slug, tab));
    customTabs.forEach((tab) => map.set(tab.id || tab.slug, tab));
    return Array.from(map.values());
  }, [cloudTabs, customTabs]);

  const filteredTabs = useMemo(() => {
    return allTabs.filter((tab) => {
      if (instrumentFilter !== 'all' && tab.instrument !== instrumentFilter) return false;
      if (typeFilter === 'fingerstyle' && !tab.isFingerstyle) return false;
      if (typeFilter === 'custom' && !tab.isCustom) return false;

      if (categoryFilter !== 'all') {
        const matchesCategory = tab.categories?.includes(categoryFilter) || tab.category === categoryFilter;
        if (!matchesCategory) return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const inTitle = tab.title.toLowerCase().includes(q);
      const inArtist = tab.artist.toLowerCase().includes(q);
      const inCat = tab.categories?.some((c) => c.toLowerCase().includes(q)) || tab.category?.toLowerCase().includes(q);
      const inYear = tab.releaseYear ? String(tab.releaseYear).includes(q) : false;
      const inTags = tab.tags?.some((t) => t.toLowerCase().includes(q));
      return inTitle || inArtist || inCat || inYear || inTags;
    });
  }, [allTabs, instrumentFilter, typeFilter, categoryFilter, searchQuery]);

  return (
    <div className="space-y-6">
      <LibraryFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        instrumentFilter={instrumentFilter}
        onInstrumentChange={setInstrumentFilter}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        customTabsCount={customTabs.length}
      />

      <div className="flex items-center justify-between text-xs text-walnut px-1">
        <span role="status" aria-live="polite">
          Showing <strong className="text-espresso font-semibold">{filteredTabs.length}</strong> sanctuary songs
        </span>
        <div className="flex items-center gap-3">
          {cloudTabs.length <= 3 && (
            <button
              onClick={handleSeed}
              disabled={isSeeding}
              className="inline-flex items-center gap-1.5 text-xs text-walnut hover:text-terracotta transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSeeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber" />}
              <span>Sync Cloud Seeds</span>
            </button>
          )}
          <a href="/import" className="min-h-[44px] inline-flex items-center gap-1.5 text-terracotta hover:underline font-medium">
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Paste New Tab</span>
          </a>
        </div>
      </div>

      {filteredTabs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTabs.map((tab) => (
            <SongCard key={tab.id || tab.slug} tab={tab} onDeleteCustom={handleDeleteCustom} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 rounded-3xl bg-surface border border-warm">
          <Music2 className="w-12 h-12 mx-auto text-walnut/50 mb-3" aria-hidden="true" />
          <h4 className="font-serif text-lg font-bold text-espresso mb-1">No songs found</h4>
          <p className="text-sm text-walnut max-w-md mx-auto mb-5">
            {searchQuery || categoryFilter !== 'all'
              ? 'No tabs matching your current search or genre filters.'
              : 'Your practice library is waiting.'}
          </p>
        </div>
      )}
    </div>
  );
};
