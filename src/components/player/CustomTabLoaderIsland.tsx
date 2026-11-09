import React, { useEffect, useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import type { UserTab } from '../../lib/types';
import { getUserTabBySlug, getUserTabById } from '../../lib/storage/tabStorage';
import { TabPlayerIsland } from './TabPlayerIsland';

export const CustomTabLoaderIsland: React.FC = () => {
  const [tab, setTab] = useState<UserTab | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const slug = params.get('slug');

    if (id) {
      const found = getUserTabById(id) ?? (slug ? getUserTabBySlug(slug) : null);
      setTab(found);
    } else if (slug) {
      const found = getUserTabBySlug(slug);
      setTab(found);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div role="status" aria-live="polite" className="py-20 text-center text-sm font-mono text-walnut animate-pulse">
        Loading saved tab from browser storage...
      </div>
    );
  }

  if (!tab) {
    return (
      <div className="py-16 text-center max-w-md mx-auto space-y-4">
        <h2 className="font-serif text-2xl font-bold text-espresso">Tab Not Found</h2>
        <p className="text-sm text-walnut">
          This tab was either deleted from your browser or the link is invalid.
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

  return <TabPlayerIsland metadata={tab} rawTabContent={tab.content} />;
};
