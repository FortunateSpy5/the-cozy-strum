import React, { useState } from 'react';
import { Database, RefreshCw, Sparkles, Check, AlertCircle, Loader2 } from 'lucide-react';
import { rebuildCatalogIndex } from '../../lib/firebase/adminService';
import { seedInitialTabs, CATALOG_CACHE_KEY } from '../../lib/firebase/tabsService';

export function CatalogManagerPanel(): React.JSX.Element {
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleRebuild = async () => {
    try {
      setIsRebuilding(true);
      setMessage(null);
      const count = await rebuildCatalogIndex();
      setMessage(`Successfully rebuilt catalog index with ${count} public tabs!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to rebuild index.';
      setMessage(`Error: ${msg}`);
    } finally {
      setIsRebuilding(false);
    }
  };

  const handleSeed = async () => {
    try {
      setIsSeeding(true);
      setMessage(null);
      await seedInitialTabs();
      setMessage('Sample songs seeded to Firestore and catalog index updated!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to seed sample songs.';
      setMessage(`Error: ${msg}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClearLocalCache = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CATALOG_CACHE_KEY);
      setMessage('Local catalog cache evicted. Next visit will fetch fresh catalog.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-6 rounded-2xl bg-canvas border border-warm space-y-4">
        <div className="flex items-center gap-2 border-b border-warm pb-3">
          <Database className="w-5 h-5 text-terracotta" aria-hidden="true" />
          <h3 className="font-serif text-lg font-bold text-espresso">Catalog Index & Database Maintenance</h3>
        </div>

        <p className="text-xs text-walnut leading-relaxed">
          The Cozy Strum maintains a single summary document at <code className="font-mono text-espresso font-semibold">meta/catalog_index</code> containing all approved public songs. Rebuilding the index ensures instant 1-read library performance with 0 desyncs.
        </p>

        {message && (
          <div
            role={message.startsWith('Error:') ? 'alert' : 'status'}
            aria-live="polite"
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              message.startsWith('Error:')
                ? 'bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300'
                : 'bg-surface border-warm text-espresso'
            }`}
          >
            {message.startsWith('Error:') ? (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" aria-hidden="true" />
            ) : (
              <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" aria-hidden="true" />
            )}
            <span>{message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            type="button"
            disabled={isRebuilding}
            aria-busy={isRebuilding}
            onClick={handleRebuild}
            className="min-h-[44px] p-4 rounded-xl bg-surface border border-warm hover:border-terracotta transition-colors flex flex-col items-start gap-1 cursor-pointer disabled:opacity-50 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-espresso">
              {isRebuilding ? <Loader2 className="w-3.5 h-3.5 animate-spin text-terracotta" /> : <RefreshCw className="w-3.5 h-3.5 text-terracotta" />}
              <span>Rebuild Catalog Index</span>
            </div>
            <span className="text-[11px] text-walnut">Scans all approved tabs and regenerates summary index</span>
          </button>

          <button
            type="button"
            disabled={isSeeding}
            aria-busy={isSeeding}
            onClick={handleSeed}
            className="min-h-[44px] p-4 rounded-xl bg-surface border border-warm hover:border-terracotta transition-colors flex flex-col items-start gap-1 cursor-pointer disabled:opacity-50 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-espresso">
              {isSeeding ? <Loader2 className="w-3.5 h-3.5 animate-spin text-amber" /> : <Sparkles className="w-3.5 h-3.5 text-amber" />}
              <span>Seed Sample Songs</span>
            </div>
            <span className="text-[11px] text-walnut">Populates 3 core tabs if database was cleared</span>
          </button>

          <button
            type="button"
            onClick={handleClearLocalCache}
            className="min-h-[44px] p-4 rounded-xl bg-surface border border-warm hover:border-terracotta transition-colors flex flex-col items-start gap-1 cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-espresso">
              <Database className="w-3.5 h-3.5 text-walnut" />
              <span>Clear Local Cache</span>
            </div>
            <span className="text-[11px] text-walnut">Clears browser 15-min TTL catalog memory</span>
          </button>
        </div>
      </div>
    </div>
  );
}
