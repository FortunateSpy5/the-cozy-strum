import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ExplorePaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

export function ExplorePagination({
  page,
  totalPages,
  onPageChange,
}: ExplorePaginationProps): React.JSX.Element | null {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Song directory pagination" className="flex items-center justify-center gap-3 pt-4">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label="Previous page"
        className="min-h-[44px] px-4 py-2 rounded-xl bg-surface border border-warm text-xs font-semibold text-espresso hover:border-terracotta disabled:opacity-40 cursor-pointer inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta transition-colors"
      >
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        <span>Previous</span>
      </button>
      <span className="text-xs font-mono text-walnut">
        {page} / {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        aria-label="Next page"
        className="min-h-[44px] px-4 py-2 rounded-xl bg-surface border border-warm text-xs font-semibold text-espresso hover:border-terracotta disabled:opacity-40 cursor-pointer inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta transition-colors"
      >
        <span>Next</span>
        <ChevronRight className="w-4 h-4" aria-hidden="true" />
      </button>
    </nav>
  );
}
