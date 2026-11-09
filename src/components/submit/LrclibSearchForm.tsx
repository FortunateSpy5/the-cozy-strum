import React from 'react';
import { Search, Loader2 } from 'lucide-react';

interface LrclibSearchFormProps {
  titleQuery: string;
  artistQuery: string;
  isLoading: boolean;
  titleInputRef: React.RefObject<HTMLInputElement | null>;
  onTitleChange: (val: string) => void;
  onArtistChange: (val: string) => void;
  onSubmit: (e: React.SyntheticEvent) => void;
}

export function LrclibSearchForm({
  titleQuery,
  artistQuery,
  isLoading,
  titleInputRef,
  onTitleChange,
  onArtistChange,
  onSubmit,
}: LrclibSearchFormProps): React.JSX.Element {
  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
      <input
        ref={titleInputRef}
        name="title"
        type="search"
        required
        autoComplete="off"
        placeholder="Track title *"
        aria-label="Track title"
        value={titleQuery}
        onChange={(e) => onTitleChange(e.target.value)}
        className="w-full px-3 py-2 min-h-[44px] rounded-xl bg-canvas border border-warm text-xs sm:text-sm text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
      />
      <div className="flex gap-2">
        <input
          name="artist"
          type="search"
          autoComplete="off"
          placeholder="Artist name (optional)"
          aria-label="Artist name"
          value={artistQuery}
          onChange={(e) => onArtistChange(e.target.value)}
          className="w-full px-3 py-2 min-h-[44px] rounded-xl bg-canvas border border-warm text-xs sm:text-sm text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
        />
        <button
          type="submit"
          disabled={isLoading || !titleQuery.trim()}
          className="min-h-[44px] px-4 rounded-xl bg-terracotta text-white text-xs font-semibold hover:bg-terracotta/90 inline-flex items-center gap-1.5 shrink-0 transition-colors disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          <span>Search</span>
        </button>
      </div>
    </form>
  );
}
