import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Check } from 'lucide-react';
import { useModalA11y } from '../common/useModalA11y';
import { searchLrclib, formatLyricsForChords, type LrclibTrack } from '../../lib/lyrics/lrclibService';
import { LrclibResultItem } from './LrclibResultItem';
import { LrclibSearchForm } from './LrclibSearchForm';

interface LrclibSearchModalProps {
  isOpen: boolean;
  initialTitle: string;
  initialArtist: string;
  onClose: () => void;
  onSelectLyrics: (formattedLyrics: string, lrclibId: number) => void;
}

export function LrclibSearchModal({
  isOpen,
  initialTitle,
  initialArtist,
  onClose,
  onSelectLyrics,
}: LrclibSearchModalProps): React.JSX.Element | null {
  const [titleQuery, setTitleQuery] = useState(initialTitle);
  const [artistQuery, setArtistQuery] = useState(initialArtist);
  const [results, setResults] = useState<LrclibTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewTrack, setPreviewTrack] = useState<LrclibTrack | null>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const activeSearchIdRef = useRef(0);
  const modalRef = useModalA11y({ isOpen, onClose, initialFocusRef: titleInputRef });

  const performSearch = useCallback(async (title: string, artist: string) => {
    if (!title.trim()) return;
    const searchId = ++activeSearchIdRef.current;
    setIsLoading(true);

    try {
      const res = await searchLrclib(title, artist);
      if (searchId !== activeSearchIdRef.current) return;
      setResults(res);
      const firstWithLyrics = res.find((t) => Boolean(t.plainLyrics));
      setPreviewTrack(firstWithLyrics || res[0] || null);
    } finally {
      if (searchId === activeSearchIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTitleQuery(initialTitle);
      setArtistQuery(initialArtist);
      setPreviewTrack(null);
      if (initialTitle.trim()) {
        performSearch(initialTitle, initialArtist);
      }
    }
  }, [isOpen, initialTitle, initialArtist, performSearch]);

  const handleSearchSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    performSearch(titleQuery, artistQuery);
  };

  const handleApplyLyrics = () => {
    if (!previewTrack?.plainLyrics) return;
    const formatted = formatLyricsForChords(previewTrack.plainLyrics);
    onSelectLyrics(formatted, previewTrack.id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lrclib-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/50 backdrop-blur-xs animate-in fade-in duration-150 [overscroll-behavior:contain]"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-surface border border-warm p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          type="button"
          aria-label="Close lyrics search dialog"
          className="absolute right-4 top-4 p-1 rounded-lg text-walnut hover:text-espresso min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta transition-colors"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        <h2 id="lrclib-modal-title" className="font-serif text-xl font-bold text-espresso mb-1">
          Auto-Fetch Lyrics (LRCLIB)
        </h2>
        <p className="text-xs text-walnut mb-4">
          Free, open-source lyrics database. Inserts lyrics with blank chord lines ready for chord placement.
        </p>

        <LrclibSearchForm
          titleQuery={titleQuery}
          artistQuery={artistQuery}
          isLoading={isLoading}
          titleInputRef={titleInputRef}
          onTitleChange={setTitleQuery}
          onArtistChange={setArtistQuery}
          onSubmit={handleSearchSubmit}
        />

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[260px] overflow-hidden">
          <div
            role="status"
            aria-live="polite"
            className="overflow-y-auto space-y-1.5 pr-1 border-r border-warm/40 max-h-[300px]"
          >
            {isLoading ? (
              <div className="py-12 text-center text-xs text-walnut">Searching LRCLIB…</div>
            ) : results.length > 0 ? (
              results.map((track) => (
                <LrclibResultItem
                  key={track.id}
                  track={track}
                  isSelected={previewTrack?.id === track.id}
                  onSelect={setPreviewTrack}
                />
              ))
            ) : (
              <p className="py-12 text-center text-xs text-walnut">No lyrics found. Try another search.</p>
            )}
          </div>

          <div className="flex flex-col max-h-[300px]">
            <span className="text-xs font-mono text-walnut mb-1">Lyrics Preview</span>
            <div
              tabIndex={0}
              role="region"
              aria-label="Lyrics preview"
              className="flex-1 p-3 rounded-xl bg-canvas border border-warm overflow-y-auto font-mono text-xs whitespace-pre-wrap text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
            >
              {previewTrack?.plainLyrics || 'Select a track from the left to preview lyrics.'}
            </div>
          </div>
        </div>

        <div className="pt-4 mt-3 border-t border-warm flex items-center justify-between">
          <span className="text-xs text-walnut">
            {previewTrack?.plainLyrics ? 'Ready to insert formatted lyrics.' : 'Select a track with lyrics.'}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-medium text-walnut hover:text-espresso hover:bg-canvas transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!previewTrack?.plainLyrics}
              onClick={handleApplyLyrics}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-terracotta text-white text-xs font-semibold hover:bg-terracotta/90 inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Insert Lyrics</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
