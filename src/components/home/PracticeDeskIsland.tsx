import React, { useState, useEffect } from 'react';
import type { RecentSongItem } from '../../lib/firebase/types';
import { getRecentSongs } from '../../lib/storage/recentSongsStorage';
import { PracticeSearchInput } from './PracticeSearchInput';
import { RecentSongsGrid } from './RecentSongsGrid';
import { PracticeHubCards } from './PracticeHubCards';

export function PracticeDeskIsland(): React.JSX.Element {
  const [recentSongs, setRecentSongs] = useState<RecentSongItem[]>([]);

  useEffect(() => {
    // Read purely from localStorage on client mount (0 DB reads!)
    setRecentSongs(getRecentSongs());
  }, []);

  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      {/* 1. Fast Lazy-Loaded Search */}
      <PracticeSearchInput />

      {/* 2. Continue Practicing (Zero-Read localStorage) */}
      <RecentSongsGrid recentSongs={recentSongs} />

      {/* 3. Sanctuary Hub Links */}
      <PracticeHubCards />
    </div>
  );
}
