import React, { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { ListMusic, Plus, Loader2, Sparkles } from 'lucide-react';
import { subscribeToAuth } from '../../lib/firebase/auth';
import type { UserProfile, Setlist } from '../../lib/firebase/types';
import type { TabItem } from '../../lib/types';
import {
  getUserSetlists,
  createSetlist,
  deleteSetlist,
  addTabToSetlist,
  removeTabFromSetlist,
  updateSetlist,
} from '../../lib/firebase/setlistService';
import { getCatalogIndex, catalogToTabItems } from '../../lib/firebase/tabsService';
import { getUserTabs } from '../../lib/storage/tabStorage';
import { CreateSetlistModal } from './CreateSetlistModal';
import { SetlistDetailView } from './SetlistDetailView';
import { SetlistCard } from './SetlistCard';

export function SetlistsManagerIsland(): React.JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [allTabs, setAllTabs] = useState<TabItem[]>([]);
  const [activeSetlistId, setActiveSetlistId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load tabs catalog + custom tabs
    const custom = getUserTabs();
    getCatalogIndex().then((catalog) => {
      const cloud = catalogToTabItems(catalog);
      const map = new Map<string, TabItem>();
      cloud.forEach((t) => map.set(t.id || t.slug, t));
      custom.forEach((t) => map.set(t.id || t.slug, t));
      setAllTabs(Array.from(map.values()));
    });

    const unsub = subscribeToAuth((currentUser, currentProfile) => {
      setUser(currentUser);
      setProfile(currentProfile);
      const uid = currentUser?.uid || 'local-user';
      getUserSetlists(uid).then((res) => {
        setSetlists(res);
        setIsLoading(false);
      });
    });

    return () => unsub();
  }, []);

  const handleCreate = async (title: string, description: string) => {
    const uid = user?.uid || 'local-user';
    const ownerName = profile?.displayName || user?.displayName || 'Musician';
    const created = await createSetlist(uid, ownerName, title, description);
    setSetlists((prev) => [created, ...prev]);
    setActiveSetlistId(created.id);
  };

  const handleDelete = async (id: string) => {
    await deleteSetlist(id);
    setSetlists((prev) => prev.filter((s) => s.id !== id));
    if (activeSetlistId === id) setActiveSetlistId(null);
  };

  const handleAddSong = async (setlistId: string, tabId: string) => {
    await addTabToSetlist(setlistId, tabId);
    setSetlists((prev) =>
      prev.map((s) => (s.id === setlistId ? { ...s, tabIds: [...s.tabIds, tabId] } : s))
    );
  };

  const handleRemoveSong = async (setlistId: string, tabId: string) => {
    await removeTabFromSetlist(setlistId, tabId);
    setSetlists((prev) =>
      prev.map((s) => (s.id === setlistId ? { ...s, tabIds: s.tabIds.filter((id) => id !== tabId) } : s))
    );
  };

  const handleReorder = async (setlistId: string, newTabIds: string[]) => {
    await updateSetlist(setlistId, { tabIds: newTabIds });
    setSetlists((prev) =>
      prev.map((s) => (s.id === setlistId ? { ...s, tabIds: newTabIds } : s))
    );
  };

  const activeSetlist = setlists.find((s) => s.id === activeSetlistId);

  if (activeSetlist) {
    return (
      <SetlistDetailView
        setlist={activeSetlist}
        allTabs={allTabs}
        onBack={() => setActiveSetlistId(null)}
        onDeleteSetlist={handleDelete}
        onAddSong={handleAddSong}
        onRemoveSong={handleRemoveSong}
        onReorder={handleReorder}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-6 rounded-2xl bg-surface border border-warm">
        <div>
          <div className="flex items-center gap-2">
            <ListMusic className="w-6 h-6 text-terracotta" />
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-espresso">Gig & Practice Setlists</h1>
          </div>
          <p className="text-sm text-walnut mt-1">
            Curate ordered song lists for your live gigs, jam sessions, and focused practice routines.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-terracotta text-white text-xs font-semibold hover:bg-terracotta/90 transition-colors shadow-2xs shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Setlist</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 text-center" role="status" aria-live="polite">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-walnut/50 mb-2" aria-hidden="true" />
          <p className="text-xs text-walnut">Loading your setlists…</p>
        </div>
      ) : setlists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {setlists.map((s) => (
            <SetlistCard key={s.id} setlist={s} onSelect={setActiveSetlistId} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 rounded-3xl bg-surface border border-warm">
          <Sparkles className="w-12 h-12 mx-auto text-amber mb-3" />
          <h3 className="font-serif text-lg font-bold text-espresso mb-1">Create your first setlist</h3>
          <p className="text-sm text-walnut max-w-md mx-auto mb-5">
            Group your favorite songs together into sequential setlists and play through them in full-screen Stage Mode.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-terracotta text-white text-xs font-semibold hover:bg-terracotta/90 transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Setlist</span>
          </button>
        </div>
      )}

      <CreateSetlistModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
