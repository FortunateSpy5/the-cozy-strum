import React from 'react';
import type { User } from 'firebase/auth';
import { Heart, ListMusic, PlusCircle, FileText, ShieldAlert, LogOut } from 'lucide-react';
import type { UserProfile } from '../../lib/firebase/types';

interface UserDropdownContentProps {
  user: User;
  profile: UserProfile | null;
  onClose: () => void;
  onSignOut: () => void;
}

const itemClass =
  'min-h-[44px] flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-espresso hover:bg-canvas transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta cursor-pointer';

export function UserDropdownContent({
  user,
  profile,
  onClose,
  onSignOut,
}: UserDropdownContentProps): React.JSX.Element {
  const isAdmin = profile?.role === 'admin';

  return (
    <div
      role="menu"
      aria-label="User account menu"
      className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-warm bg-surface p-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-150"
    >
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
        <a role="menuitem" href="/#favorites" onClick={onClose} className={itemClass}>
          <Heart className="w-4 h-4 text-terracotta" aria-hidden="true" />
          <span>My Favorites</span>
        </a>
        <a role="menuitem" href="/setlists" onClick={onClose} className={itemClass}>
          <ListMusic className="w-4 h-4 text-amber" aria-hidden="true" />
          <span>My Setlists</span>
        </a>
        <a role="menuitem" href="/submit" onClick={onClose} className={itemClass}>
          <PlusCircle className="w-4 h-4 text-terracotta" aria-hidden="true" />
          <span>Submit a Tab</span>
        </a>
        <a role="menuitem" href="/import" onClick={onClose} className={itemClass}>
          <FileText className="w-4 h-4 text-walnut" aria-hidden="true" />
          <span>Quick Paste Studio</span>
        </a>

        {isAdmin && (
          <a
            role="menuitem"
            href="/admin"
            onClick={onClose}
            className={`${itemClass} border-t border-warm/50 mt-1`}
          >
            <ShieldAlert className="w-4 h-4 text-terracotta" aria-hidden="true" />
            <span className="font-semibold text-terracotta">Admin Moderation</span>
          </a>
        )}
      </div>

      <div className="pt-1 border-t border-warm/60">
        <button
          role="menuitem"
          type="button"
          onClick={onSignOut}
          className="w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-walnut hover:text-espresso hover:bg-canvas transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta cursor-pointer"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
