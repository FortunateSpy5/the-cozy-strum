import { useState, useEffect, useRef } from 'react';
import type { User } from 'firebase/auth';
import type { Instrument } from '../../lib/types';
import { subscribeToAuth } from '../../lib/firebase/auth';
import type { UserProfile, SongPracticePreference } from '../../lib/firebase/types';
import {
  toggleFavoriteTab,
  saveSongPracticePreferences,
  recordRecentlyPlayed,
  onUserProfileChanged,
} from '../../lib/firebase/userService';

interface UsePerSongPracticeMemoryProps {
  tabId: string;
  currentSemitones: number;
  currentSpeed: number;
  currentInstrument: Instrument;
  onRestorePreferences?: (prefs: SongPracticePreference) => void;
}

interface UsePerSongPracticeMemoryReturn {
  user: User | null;
  profile: UserProfile | null;
  isFavorited: boolean;
  isSavingPrefs: boolean;
  toggleFavorite: () => Promise<void>;
}

export function usePerSongPracticeMemory({
  tabId,
  currentSemitones,
  currentSpeed,
  currentInstrument,
  onRestorePreferences,
}: UsePerSongPracticeMemoryProps): UsePerSongPracticeMemoryReturn {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isSavingPrefs, setIsSavingPrefs] = useState<boolean>(false);
  const hasRestoredRef = useRef<boolean>(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsubAuth = subscribeToAuth((currentUser, currentProfile) => {
      setUser(currentUser);
      setProfile(currentProfile);

      if (currentUser && tabId) {
        recordRecentlyPlayed(currentUser.uid, tabId).catch(() => {});
      }
    });

    const unsubProfile = onUserProfileChanged((updatedProfile) => {
      setProfile(updatedProfile);
    });

    return () => {
      unsubAuth();
      unsubProfile();
    };
  }, [tabId]);

  // Restore saved preferences on initial load
  useEffect(() => {
    if (profile && tabId && !hasRestoredRef.current && onRestorePreferences) {
      const saved = profile.songPreferences?.[tabId];
      if (saved) {
        hasRestoredRef.current = true;
        onRestorePreferences(saved);
      }
    }
  }, [profile, tabId, onRestorePreferences]);

  // Debounce saving song preferences (2500ms)
  useEffect(() => {
    if (!user || !tabId) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        setIsSavingPrefs(true);
        await saveSongPracticePreferences(user.uid, tabId, {
          transpose: currentSemitones,
          scrollSpeed: currentSpeed,
          instrumentView: currentInstrument,
        });
      } catch {
        // silent sync fallback
      } finally {
        setIsSavingPrefs(false);
      }
    }, 2500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [user, tabId, currentSemitones, currentSpeed, currentInstrument]);

  const isFavorited = Boolean(tabId && profile?.favoriteTabIds?.includes(tabId));

  const toggleFavorite = async (): Promise<void> => {
    if (!user) {
      alert('Please sign in from the top bar to save songs to your Favorites.');
      return;
    }
    if (!tabId) return;
    try {
      await toggleFavoriteTab(user.uid, tabId);
    } catch (err) {
      console.warn('[The Cozy Strum] Toggle favorite failed:', err);
    }
  };

  return {
    user,
    profile,
    isFavorited,
    isSavingPrefs,
    toggleFavorite,
  };
}
