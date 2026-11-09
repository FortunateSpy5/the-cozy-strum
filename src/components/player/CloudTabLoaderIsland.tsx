import React, { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Loader2 } from 'lucide-react';
import type { CloudTab } from '../../lib/firebase/types';
import { getTabById } from '../../lib/firebase/tabsService';
import { TabPlayerIsland } from './TabPlayerIsland';

export function CloudTabLoaderIsland(): React.JSX.Element {
  const [tab, setTab] = useState<CloudTab | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTab(): Promise<void> {
      const params = new URLSearchParams(window.location.search);
      let tabId = params.get('id') || params.get('slug');

      if (!tabId) {
        // Fallback: check if path contains /tabs/xyz
        const pathSegments = window.location.pathname.split('/').filter(Boolean);
        if (pathSegments[0] === 'tabs' && pathSegments[1]) {
          tabId = pathSegments[1];
        }
      }

      if (tabId) {
        const result = await getTabById(tabId);
        setTab(result);
      }
      setLoading(false);
    }

    loadTab();
  }, []);

  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="py-24 text-center text-sm font-mono text-walnut flex flex-col items-center justify-center gap-3"
      >
        <Loader2 className="w-5 h-5 text-terracotta animate-spin" />
        <span>Loading song from sanctuary library…</span>
      </div>
    );
  }

  if (!tab) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4 px-4">
        <h2 className="font-serif text-2xl font-bold text-espresso [text-wrap:balance]">
          Song Not Found
        </h2>
        <p className="text-sm text-walnut">
          The song you requested could not be located in the library. It may have been unpublished or removed.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl bg-canvas border border-warm text-xs font-semibold text-espresso hover:border-terracotta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            Back to Sanctuary
          </a>
          <a
            href="/import"
            className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl bg-terracotta text-white text-xs font-semibold hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Paste New Tab
          </a>
        </div>
      </div>
    );
  }

  return (
    <TabPlayerIsland
      metadata={{
        title: tab.title,
        artist: tab.artist,
        instrument: tab.instrument,
        tuning: tab.tuning,
        capo: tab.capo,
        bpm: tab.bpm,
        difficulty: tab.difficulty.toLowerCase() as 'beginner' | 'intermediate' | 'advanced',
        strummingPattern: tab.strummingPattern,
        tags: [tab.instrument, tab.difficulty.toLowerCase()],
        isFingerstyle: tab.isFingerstyle,
        createdAt: tab.createdAt,
      }}
      rawTabContent={tab.content}
    />
  );
}
