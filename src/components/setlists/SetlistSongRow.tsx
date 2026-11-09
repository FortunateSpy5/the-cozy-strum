import React from 'react';
import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import type { TabItem } from '../../lib/types';

interface SetlistSongRowProps {
  tab: TabItem;
  index: number;
  totalSongs: number;
  songUrl: string;
  onMove: (index: number, direction: 'up' | 'down') => void;
  onRemove: (tabId: string) => void;
}

export const SetlistSongRow = React.memo<SetlistSongRowProps>(function SetlistSongRow({
  tab,
  index,
  totalSongs,
  songUrl,
  onMove,
  onRemove,
}) {
  const tabId = tab.id || tab.slug;

  return (
    <div className="p-4 flex items-center justify-between gap-3 hover:bg-canvas/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <span className="font-mono text-xs text-walnut/60 w-5">{index + 1}.</span>
        <div className="truncate">
          <a
            href={songUrl}
            className="font-serif font-bold text-sm text-espresso hover:text-terracotta transition-colors truncate block"
          >
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
          onClick={() => onMove(index, 'up')}
          disabled={index === 0}
          aria-label={`Move ${tab.title} up`}
          className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg hover:bg-canvas text-walnut disabled:opacity-30 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
        >
          <ChevronUp className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          onClick={() => onMove(index, 'down')}
          disabled={index === totalSongs - 1}
          aria-label={`Move ${tab.title} down`}
          className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg hover:bg-canvas text-walnut disabled:opacity-30 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
        >
          <ChevronDown className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          onClick={() => onRemove(tabId)}
          aria-label={`Remove ${tab.title} from setlist`}
          className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg hover:bg-rose-50 text-walnut hover:text-rose-600 transition-colors cursor-pointer ml-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
        >
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
});
