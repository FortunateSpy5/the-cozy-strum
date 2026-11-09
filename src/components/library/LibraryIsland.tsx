import React, { useState, useEffect, useMemo } from 'react';
import type { User } from 'firebase/auth';
import { Plus, Music2, Sparkles, Loader2 } from 'lucide-react';
import type { TabItem, Instrument, SongCategory } from '../../lib/types';
import { getUserTabs, deleteUserTab } from '../../lib/storage/tabStorage';
import { getCatalogIndex, seedInitialTabs, catalogToTabItems } from '../../lib/firebase/tabsService';
import { subscribeToAuth } from '../../lib/firebase/auth';
import type { UserProfile } from '../../lib/firebase/types';
import { toggleFavoriteTab, onUserProfileChanged } from '../../lib/firebase/userService';
import { SongCard } from './SongCard';
import { LibraryFilterBar } from './LibraryFilterBar';

interface LibraryIslandProps {
  initialTabs: TabItem[];
}

export const LibraryIsland: React.FC<LibraryIslandProps> = ({ initialTabs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [instrumentFilter, setInstrumentFilter] = useState<'all' | Instrument>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'fingerstyle' | 'custom' | 'favorites'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | SongCategory>('all');
  const [customTabs, setCustomTabs] = useState<TabItem[]>([]);
  const [cloudTabs, setCloudTabs] = useState<TabItem[]>(initialTabs);
  const [isSeeding, setIsSeeding] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    setCustomTabs(getUserTabs());
    getCatalogIndex().then((catalog) => {
      const items = catalogToTabItems(catalog);
      if (items.length > 0) setCloudTabs(items);
    });

    const unsubAuth = subscribeToAuth((u, p) => {
      setUser(u);
      setProfile(p);
    });
    const unsubProfile = onUserProfileChanged((p) => setProfile(p));

    if (typeof window !== 'undefined' && window.location.hash === '#favorites') {
      setTypeFilter('favorites');
    }

    return () => {
      unsubAuth();
      unsubProfile();
    };
  }, []);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const res = await seedInitialTabs();
      setCloudTabs(catalogToTabItems(res));
    } finally {
      setIsSeeding(false);
    }
  };

  const handleDeleteCustom = (id: string) => {
    deleteUserTab(id);
    setCustomTabs((prev) => prev.filter((t) => t.id !== id));
  };

  const handleToggleFavorite = async (tabId: string) => {
    if (!user) {
      alert('Please sign in to save songs to your personal Favorites.');
      return;
    }
    await toggleFavoriteTab(user.uid, tabId);
  };

  const favoriteIds = profile?.favoriteTabIds ?? [];

  const allTabs = useMemo(() => {
    const map = new Map<string, TabItem>();
    cloudTabs.forEach((tab) => map.set(tab.id || tab.slug, tab));
    customTabs.forEach((tab) => map.set(tab.id || tab.slug, tab));
    return Array.from(map.values());
  }, [cloudTabs, customTabs]);

  const filteredTabs = useMemo(() => {
    return allTabs.filter((tab) => {
      const tabId = tab.id || tab.slug;
      if (instrumentFilter !== 'all' && tab.instrument !== instrumentFilter) return false;
      if (typeFilter === 'fingerstyle' && !tab.isFingerstyle) return false;
      if (typeFilter === 'custom' && !tab.isCustom) return false;
      if (typeFilter === 'favorites' && !favoriteIds.includes(tabId)) return false;

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
  }, [allTabs, instrumentFilter, typeFilter, categoryFilter, searchQuery, favoriteIds]);

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
        favoritesCount={favoriteIds.length}
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
          {filteredTabs.map((tab) => {
            const id = tab.id || tab.slug;
            return (
              <SongCard
                key={id}
                tab={tab}
                isFavorited={favoriteIds.includes(id)}
                onToggleFavorite={handleToggleFavorite}
                onDeleteCustom={handleDeleteCustom}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 px-4 rounded-3xl bg-surface border border-warm">
          <Music2 className="w-12 h-12 mx-auto text-walnut/50 mb-3" aria-hidden="true" />
          <h4 className="font-serif text-lg font-bold text-espresso mb-1">
            {typeFilter === 'favorites' ? 'No favorites saved yet' : 'No songs found'}
          </h4>
          <p className="text-sm text-walnut max-w-md mx-auto mb-5">
            {typeFilter === 'favorites'
              ? 'Click the heart icon on any song to add it to your personal practice favorites.'
              : 'No tabs matching your current search or genre filters.'}
          </p>
        </div>
      )}
    </div>
  );
};
