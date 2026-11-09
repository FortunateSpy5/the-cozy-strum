import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, ListMusic } from 'lucide-react';
import { getSetlistById } from '../../lib/firebase/setlistService';
import { getCatalogIndex, catalogToTabItems } from '../../lib/firebase/tabsService';
import { getUserTabs } from '../../lib/storage/tabStorage';
import type { Setlist } from '../../lib/firebase/types';
import type { TabItem } from '../../lib/types';

interface SetlistGigDockProps {
  currentTabId: string;
}

export function SetlistGigDock({ currentTabId }: SetlistGigDockProps): React.JSX.Element | null {
  const [setlist, setSetlist] = useState<Setlist | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [allTabs, setAllTabs] = useState<Map<string, TabItem>>(new Map());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const setlistId = params.get('setlist');
    const indexParam = params.get('index');

    if (!setlistId) return;

    // Load tabs map for song titles
    const custom = getUserTabs();
    getCatalogIndex().then((catalog) => {
      const cloud = catalogToTabItems(catalog);
      const map = new Map<string, TabItem>();
      cloud.forEach((t) => map.set(t.id || t.slug, t));
      custom.forEach((t) => map.set(t.id || t.slug, t));
      setAllTabs(map);
    });

    getSetlistById(setlistId).then((res) => {
      if (res) {
        setSetlist(res);
        if (indexParam !== null) {
          setCurrentIndex(parseInt(indexParam, 10));
        } else {
          const idx = res.tabIds.indexOf(currentTabId);
          setCurrentIndex(idx >= 0 ? idx : 0);
        }
      }
    });
  }, [currentTabId]);

  if (!setlist || currentIndex < 0) return null;

  const totalSongs = setlist.tabIds.length;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < totalSongs - 1;

  const prevTabId = hasPrev ? setlist.tabIds[currentIndex - 1] : null;
  const nextTabId = hasNext ? setlist.tabIds[currentIndex + 1] : null;

  const prevTitle = prevTabId ? allTabs.get(prevTabId)?.title || 'Previous Song' : null;
  const nextTitle = nextTabId ? allTabs.get(nextTabId)?.title || 'Next Song' : null;

  const getSongUrl = (id: string, idx: number) => {
    return `/tab?id=${encodeURIComponent(id)}&setlist=${encodeURIComponent(setlist.id)}&index=${idx}`;
  };

  return (
    <aside
      aria-label="Stage mode setlist navigation"
      className="sticky top-2 z-40 max-w-4xl mx-auto px-4 mb-4 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-espresso text-cream shadow-xl border border-warm/20">
        <div className="flex items-center gap-2.5 min-w-0">
          <ListMusic className="w-4 h-4 text-terracotta shrink-0" aria-hidden="true" />
          <div className="truncate">
            <span className="text-[11px] font-mono text-terracotta uppercase tracking-wider block">Stage Mode</span>
            <span className="font-serif font-bold text-xs sm:text-sm text-cream truncate block">
              {setlist.title} ({currentIndex + 1} of {totalSongs})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {hasPrev && prevTabId ? (
            <a
              href={getSongUrl(prevTabId, currentIndex - 1)}
              className="min-h-[40px] px-2.5 sm:px-3 py-1 rounded-xl bg-warm/20 hover:bg-warm/30 text-xs font-medium text-cream inline-flex items-center gap-1 transition-colors"
              title={`Previous: ${prevTitle}`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden md:inline truncate max-w-[120px]">{prevTitle}</span>
              <span className="md:hidden">Prev</span>
            </a>
          ) : (
            <span className="min-h-[40px] px-2 sm:px-3 py-1 rounded-xl text-xs font-medium text-cream/30 inline-flex items-center gap-1 opacity-50 cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Start</span>
            </span>
          )}

          {hasNext && nextTabId ? (
            <a
              href={getSongUrl(nextTabId, currentIndex + 1)}
              className="min-h-[40px] px-2.5 sm:px-3 py-1 rounded-xl bg-terracotta hover:bg-terracotta/90 text-xs font-semibold text-white inline-flex items-center gap-1 transition-colors"
              title={`Next: ${nextTitle}`}
            >
              <span className="hidden md:inline truncate max-w-[120px]">{nextTitle}</span>
              <span className="md:hidden">Next</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          ) : (
            <span className="min-h-[40px] px-2 sm:px-3 py-1 rounded-xl text-xs font-medium text-cream/30 inline-flex items-center gap-1 opacity-50 cursor-not-allowed">
              <span className="hidden sm:inline">End</span>
              <ChevronRight className="w-4 h-4" />
            </span>
          )}

          <a
            href={`/setlists`}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl hover:bg-warm/20 text-cream/70 hover:text-cream transition-colors ml-1"
            title="Exit Stage Mode and return to Setlists"
            aria-label="Exit Stage Mode"
          >
            <X className="w-4 h-4" />
          </a>
        </div>
      </div>
    </aside>
  );
}
