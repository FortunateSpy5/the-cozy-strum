import React, { useState, useEffect, useRef } from 'react';
import type { User } from 'firebase/auth';
import { LogIn, ChevronDown, Loader2 } from 'lucide-react';
import { signInWithGoogle, logout, subscribeToAuth } from '../../lib/firebase/auth';
import { isFirebaseConfigured } from '../../lib/firebase/config';
import type { UserProfile } from '../../lib/firebase/types';
import { UserDropdownContent } from './UserDropdownContent';

export function UserMenuIsland(): React.JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    return subscribeToAuth((currentUser, currentProfile, loading) => {
      setUser(currentUser);
      setProfile(currentProfile);
      setIsLoading(loading);
    });
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen]);

  const handleSignIn = async (): Promise<void> => {
    setErrorMsg(null);
    if (!isFirebaseConfigured()) {
      setErrorMsg('Firebase not configured. Check .env');
      return;
    }
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed';
      console.error('[The Cozy Strum] Sign-in error:', msg);
      setErrorMsg('Sign-in cancelled or failed');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async (): Promise<void> => {
    setIsOpen(false);
    await logout();
  };

  if (isLoading) {
    return (
      <div className="h-9 w-24 rounded-lg bg-warm/30 animate-pulse flex items-center justify-center">
        <Loader2 className="w-4 h-4 text-walnut/40 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative flex items-center">
        <button
          onClick={handleSignIn}
          disabled={isSigningIn}
          className="min-h-[40px] inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border border-warm bg-canvas text-espresso hover:bg-surface hover:border-terracotta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta transition-colors shadow-2xs disabled:opacity-50"
          title={isFirebaseConfigured() ? 'Sign in with Google' : 'Firebase not configured'}
        >
          {isSigningIn ? (
            <Loader2 className="w-4 h-4 animate-spin text-terracotta" />
          ) : (
            <LogIn className="w-4 h-4 text-terracotta" />
          )}
          <span className="hidden sm:inline">Sign In</span>
        </button>
        {errorMsg && (
          <span className="absolute -bottom-6 right-0 text-[11px] text-amber whitespace-nowrap bg-surface px-1.5 py-0.5 rounded border border-warm shadow-xs">
            {errorMsg}
          </span>
        )}
      </div>
    );
  }

  const initials = (profile?.displayName || user.displayName || user.email || 'M')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="min-h-[40px] flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-lg border border-warm bg-canvas hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta transition-colors"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'User profile'}
            className="w-7 h-7 rounded-full object-cover border border-warm"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-terracotta text-white font-mono text-xs flex items-center justify-center font-bold">
            {initials}
          </div>
        )}
        <span className="hidden md:inline-block max-w-[100px] truncate text-xs font-medium text-espresso">
          {profile?.displayName || user.displayName || 'Musician'}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-walnut transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <UserDropdownContent
          user={user}
          profile={profile}
          onClose={() => setIsOpen(false)}
          onSignOut={handleSignOut}
        />
      )}
    </div>
  );
}
