import React from 'react';
import type { User } from 'firebase/auth';
import { Heart, ListMusic, FileText, ShieldAlert, LogOut } from 'lucide-react';
import type { UserProfile } from '../../lib/firebase/types';

interface UserDropdownContentProps {
  user: User;
  profile: UserProfile | null;
  onClose: () => void;
  onSignOut: () => void;
}

export function UserDropdownContent({
  user,
  profile,
  onClose,
  onSignOut,
}: UserDropdownContentProps): React.JSX.Element {
  const isAdmin = profile?.role === 'admin';

  return (
    <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-warm bg-surface p-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
      <div className="px-3 py-2 border-b border-warm/60">
        <div className="flex items-center justify-between">
          <p className="font-serif font-bold text-sm text-espresso truncate">
            {profile?.displayName || user.displayName || 'Musician'}
          </p>
          {isAdmin && (
            <span className="text-[10px] font-mono tracking-wider font-semibold px-1.5 py-0.5 rounded bg-terracotta text-white uppercase">
              Admin
            </span>
          )}
        </div>
        <p className="text-xs text-walnut truncate">{user.email}</p>
      </div>

      <div className="py-1">
        <a
          href="/#favorites"
          onClick={onClose}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-espresso hover:bg-canvas transition-colors"
        >
          <Heart className="w-4 h-4 text-terracotta" />
          <span>My Favorites</span>
        </a>
        <a
          href="/setlists"
          onClick={onClose}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-espresso hover:bg-canvas transition-colors"
        >
          <ListMusic className="w-4 h-4 text-amber" />
          <span>My Setlists</span>
        </a>
        <a
          href="/import"
          onClick={onClose}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-espresso hover:bg-canvas transition-colors"
        >
          <FileText className="w-4 h-4 text-walnut" />
          <span>Quick Paste Studio</span>
        </a>

        {isAdmin && (
          <a
            href="/admin"
            onClick={onClose}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-espresso hover:bg-canvas transition-colors border-t border-warm/50 mt-1 pt-2"
          >
            <ShieldAlert className="w-4 h-4 text-terracotta" />
            <span className="font-semibold text-terracotta">Admin Moderation</span>
          </a>
        )}
      </div>

      <div className="pt-1 border-t border-warm/60">
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-walnut hover:text-espresso hover:bg-canvas transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
