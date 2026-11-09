import React from 'react';
import { ChevronRight, Play } from 'lucide-react';
import type { Setlist } from '../../lib/firebase/types';

interface SetlistCardProps {
  setlist: Setlist;
  onSelect: (id: string) => void;
}

export function SetlistCard({ setlist, onSelect }: SetlistCardProps): React.JSX.Element {
  const firstSong = setlist.tabIds[0];
  const stageUrl = firstSong
    ? `/tab?id=${encodeURIComponent(firstSong)}&setlist=${encodeURIComponent(setlist.id)}&index=0`
    : null;

  return (
    <div
      onClick={() => onSelect(setlist.id)}
      className="group p-5 rounded-2xl bg-surface border border-warm hover:border-terracotta hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-xs text-walnut px-2 py-0.5 rounded bg-canvas border border-warm">
            {setlist.tabIds.length} {setlist.tabIds.length === 1 ? 'song' : 'songs'}
          </span>
          <ChevronRight className="w-4 h-4 text-walnut group-hover:text-terracotta transition-colors" />
        </div>
        <h3 className="font-serif text-lg font-bold text-espresso group-hover:text-terracotta transition-colors">
          {setlist.title}
        </h3>
        {setlist.description && (
          <p className="text-xs text-walnut line-clamp-2 mt-1">{setlist.description}</p>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-warm flex items-center justify-between text-xs">
        <span className="text-walnut/70 text-[11px] font-mono">
          Updated {new Date(setlist.updatedAt).toLocaleDateString()}
        </span>
        {stageUrl && (
          <a
            href={stageUrl}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-terracotta font-semibold hover:underline"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Stage</span>
          </a>
        )}
      </div>
    </div>
  );
}
