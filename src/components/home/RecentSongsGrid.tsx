import React from 'react';
import { Play, Guitar, Music, Clock, Sparkles } from 'lucide-react';
import type { RecentSongItem } from '../../lib/firebase/types';
import { STARTER_PRACTICE_SONGS } from '../../lib/storage/recentSongsStorage';

interface RecentSongsGridProps {
  recentSongs: RecentSongItem[];
}

export function RecentSongsGrid({ recentSongs }: RecentSongsGridProps): React.JSX.Element {
  const isStarter = recentSongs.length === 0;
  const displaySongs = isStarter ? STARTER_PRACTICE_SONGS : recentSongs.slice(0, 6);

  return (
    <section aria-labelledby="recent-practice-heading" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isStarter ? (
            <Sparkles className="w-4 h-4 text-terracotta" aria-hidden="true" />
          ) : (
            <Clock className="w-4 h-4 text-terracotta" aria-hidden="true" />
          )}
          <h2 id="recent-practice-heading" className="font-serif text-lg font-bold text-espresso">
            {isStarter ? 'Sanctuary Starter Picks' : 'Continue Practicing'}
          </h2>
        </div>
        <a
          href="/explore"
          className="text-xs font-semibold text-terracotta hover:underline inline-flex items-center gap-1"
        >
          <span>All 243 Songs →</span>
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {displaySongs.map((song) => {
          const isUke = song.instrument === 'ukulele';
          return (
            <a
              key={song.id}
              href={`/tab?id=${encodeURIComponent(song.id)}`}
              className="group p-4 rounded-2xl bg-surface border border-warm hover:border-terracotta hover:shadow-md transition-all flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-canvas border border-warm text-walnut inline-flex items-center gap-1">
                    {isUke ? <Music className="w-3 h-3" /> : <Guitar className="w-3 h-3" />}
                    <span>{isUke ? 'Ukulele' : 'Guitar'}</span>
                  </span>
                  <span className="text-[10px] text-walnut/70 font-mono">
                    {isStarter ? 'Starter' : 'Recent'}
                  </span>
                </div>
                <h3 className="font-serif text-base font-bold text-espresso group-hover:text-terracotta transition-colors line-clamp-1">
                  {song.title}
                </h3>
                <p className="text-xs text-walnut line-clamp-1 mt-0.5">{song.artist}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-warm flex items-center justify-between text-xs text-terracotta font-semibold group-hover:underline">
                <span>Play Tab</span>
                <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
