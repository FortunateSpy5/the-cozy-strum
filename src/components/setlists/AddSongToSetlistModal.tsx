import React, { useState, useRef } from 'react';
import { X, Search, Plus, Check } from 'lucide-react';
import type { TabItem } from '../../lib/types';
import { useModalA11y } from '../common/useModalA11y';

interface AddSongToSetlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableTabs: TabItem[];
  existingTabIds: string[];
  onAddSong: (tabId: string) => Promise<void>;
}

export function AddSongToSetlistModal({
  isOpen,
  onClose,
  availableTabs,
  existingTabIds,
  onAddSong,
}: AddSongToSetlistModalProps): React.JSX.Element | null {
  const [query, setQuery] = useState('');
  const [addingId, setAddingId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const dialogRef = useModalA11y({ isOpen, onClose, initialFocusRef: searchInputRef });

  if (!isOpen) return null;

  const filtered = availableTabs.filter((t) => {
    const q = query.toLowerCase();
    const inTitle = t.title.toLowerCase().includes(q);
    const inArtist = t.artist.toLowerCase().includes(q);
    return inTitle || inArtist;
  });

  const handleAdd = async (tabId: string) => {
    try {
      setAddingId(tabId);
      await onAddSong(tabId);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-song-title"
      ref={dialogRef}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/50 backdrop-blur-xs animate-in fade-in duration-150 [overscroll-behavior:contain]"
    >
      <div className="w-full max-w-lg rounded-2xl bg-surface border border-warm p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
        <button
          onClick={onClose}
          type="button"
          aria-label="Close dialog"
          className="absolute right-4 top-4 p-1 rounded-lg text-walnut hover:text-espresso min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        <h2 id="add-song-title" className="font-serif text-xl font-bold text-espresso mb-4">
          Add Song to Setlist
        </h2>

        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-walnut/70" aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="search"
            autoFocus
            aria-label="Search available songs by title or artist"
            placeholder="Search by song title or artist…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 min-h-[44px] rounded-xl bg-canvas border border-warm text-sm text-espresso focus:outline-none focus:border-terracotta"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
          {filtered.length > 0 ? (
            filtered.map((tab) => {
              const id = tab.id || tab.slug;
              const isAlreadyAdded = existingTabIds.includes(id);

              return (
                <div
                  key={id}
                  className="flex items-center justify-between p-3 rounded-xl bg-canvas border border-warm/80 hover:border-terracotta transition-colors"
                >
                  <div>
                    <p className="font-serif font-bold text-sm text-espresso">{tab.title}</p>
                    <p className="text-xs text-walnut">
                      {tab.artist} • <span className="capitalize">{tab.instrument}</span>
                      {tab.capo > 0 ? ` • Capo ${tab.capo}` : ''}
                    </p>
                  </div>

                  <button
                    onClick={() => handleAdd(id)}
                    disabled={isAlreadyAdded || addingId === id}
                    aria-label={isAlreadyAdded ? `${tab.title} is already added` : `Add ${tab.title} to setlist`}
                    className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta ${
                      isAlreadyAdded
                        ? 'bg-warm/40 text-walnut cursor-default'
                        : 'bg-terracotta text-white hover:bg-terracotta/90'
                    }`}
                  >
                    {isAlreadyAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>{addingId === id ? 'Adding…' : 'Add'}</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          ) : (
            <p className="text-center py-8 text-xs text-walnut">No songs match your search.</p>
          )}
        </div>

        <div className="pt-4 mt-3 border-t border-warm flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-canvas border border-warm text-xs font-medium text-espresso hover:border-terracotta transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
