import React, { useState } from 'react';
import { ArrowLeft, Play, Plus, ChevronUp, ChevronDown, Trash2, Music } from 'lucide-react';
import type { Setlist } from '../../lib/firebase/types';
import type { TabItem } from '../../lib/types';
import { AddSongToSetlistModal } from './AddSongToSetlistModal';

interface SetlistDetailViewProps {
  setlist: Setlist;
  allTabs: TabItem[];
  onBack: () => void;
  onDeleteSetlist: (id: string) => Promise<void>;
  onAddSong: (setlistId: string, tabId: string) => Promise<void>;
  onRemoveSong: (setlistId: string, tabId: string) => Promise<void>;
  onReorder: (setlistId: string, newTabIds: string[]) => Promise<void>;
}

export function SetlistDetailView({
  setlist,
  allTabs,
  onBack,
  onDeleteSetlist,
  onAddSong,
  onRemoveSong,
  onReorder,
}: SetlistDetailViewProps): React.JSX.Element {
  const [isAddOpen, setIsAddOpen] = useState(false);

  const tabsMap = new Map<string, TabItem>();
  allTabs.forEach((t) => tabsMap.set(t.id || t.slug, t));

  const orderedTabs = setlist.tabIds
    .map((id) => tabsMap.get(id))
    .filter((t): t is TabItem => Boolean(t));

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= setlist.tabIds.length) return;

    const copy = [...setlist.tabIds];
    const temp = copy[index]!;
    copy[index] = copy[newIdx]!;
    copy[newIdx] = temp;

    await onReorder(setlist.id, copy);
  };

  const firstSongId = setlist.tabIds[0];
  const stageModeUrl = firstSongId
    ? `/tab?id=${encodeURIComponent(firstSongId)}&setlist=${encodeURIComponent(setlist.id)}&index=0`
    : null;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          type="button"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-walnut hover:text-terracotta min-h-[44px] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Back to All Setlists</span>
        </button>

        <div className="flex items-center gap-2">
          {stageModeUrl && (
            <a
              href={stageModeUrl}
              className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-terracotta text-white text-xs font-semibold hover:bg-terracotta/90 transition-colors shadow-2xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
              <span>Launch Stage Mode</span>
            </a>
          )}
          <button
            onClick={() => {
              if (confirm(`Delete setlist "${setlist.title}"?`)) {
                onDeleteSetlist(setlist.id);
              }
            }}
            type="button"
            className="min-h-[44px] px-3 py-2 rounded-xl border border-warm bg-canvas text-walnut hover:text-rose-600 hover:border-rose-300 text-xs font-medium transition-colors cursor-pointer"
            title="Delete this setlist"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Setlist Info */}
      <div className="p-6 rounded-2xl bg-surface border border-warm">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-espresso">{setlist.title}</h1>
        {setlist.description && <p className="text-sm text-walnut mt-1">{setlist.description}</p>}
        <p className="text-xs text-walnut/70 font-mono mt-3">
          {orderedTabs.length} {orderedTabs.length === 1 ? 'song' : 'songs'} in set • Created by {setlist.ownerName}
        </p>
      </div>

      {/* Songs List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold text-walnut uppercase tracking-wider">Performance Order</h2>
          <button
            onClick={() => setIsAddOpen(true)}
            className="min-h-[40px] inline-flex items-center gap-1.5 text-xs text-terracotta font-semibold hover:underline cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Song</span>
          </button>
        </div>

        {orderedTabs.length > 0 ? (
          <div className="divide-y divide-warm/60 rounded-2xl bg-surface border border-warm overflow-hidden">
            {orderedTabs.map((tab, idx) => {
              const tabId = tab.id || tab.slug;
              const songUrl = `/tab?id=${encodeURIComponent(tabId)}&setlist=${encodeURIComponent(setlist.id)}&index=${idx}`;

              return (
                <div key={`${tabId}-${idx}`} className="p-4 flex items-center justify-between gap-3 hover:bg-canvas/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs text-walnut/60 w-5">{idx + 1}.</span>
                    <div className="truncate">
                      <a href={songUrl} className="font-serif font-bold text-sm text-espresso hover:text-terracotta transition-colors truncate block">
                        {tab.title}
                      </a>
                      <p className="text-xs text-walnut truncate">
                        {tab.artist} • <span className="capitalize">{tab.instrument}</span>
                        {tab.capo > 0 ? ` • Capo ${tab.capo}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleMove(idx, 'up')}
                      disabled={idx === 0}
                      aria-label={`Move ${tab.title} up`}
                      className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-canvas text-walnut disabled:opacity-30 transition-colors cursor-pointer"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMove(idx, 'down')}
                      disabled={idx === orderedTabs.length - 1}
                      aria-label={`Move ${tab.title} down`}
                      className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-canvas text-walnut disabled:opacity-30 transition-colors cursor-pointer"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onRemoveSong(setlist.id, tabId)}
                      aria-label={`Remove ${tab.title} from setlist`}
                      className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-rose-50 text-walnut hover:text-rose-600 transition-colors cursor-pointer ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 px-4 rounded-2xl bg-surface border border-warm">
            <Music className="w-8 h-8 mx-auto text-walnut/40 mb-2" />
            <p className="font-serif text-base font-bold text-espresso">This setlist is empty</p>
            <p className="text-xs text-walnut mt-1 mb-4">Add your favorite practice songs to curate your set.</p>
            <button
              onClick={() => setIsAddOpen(true)}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-terracotta text-white text-xs font-semibold hover:bg-terracotta/90 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Song</span>
            </button>
          </div>
        )}
      </div>

      <AddSongToSetlistModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        availableTabs={allTabs}
        existingTabIds={setlist.tabIds}
        onAddSong={async (tabId) => {
          await onAddSong(setlist.id, tabId);
        }}
      />
    </div>
  );
}
