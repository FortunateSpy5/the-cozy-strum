import React from 'react';
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';
import { signInWithGoogle } from '../../lib/firebase/auth';

interface AdminAuthGateProps {
  isAuthenticated: boolean;
}

export function AdminAuthGate({ isAuthenticated }: AdminAuthGateProps): React.JSX.Element {
  return (
    <div className="max-w-xl mx-auto py-16 text-center p-8 rounded-3xl bg-surface border border-warm space-y-4">
      <ShieldAlert className="w-12 h-12 text-terracotta mx-auto" aria-hidden="true" />
      <h1 className="font-serif text-2xl font-bold text-espresso">Admin Sanctuary Moderation</h1>
      <p className="text-sm text-walnut">
        {isAuthenticated
          ? 'Your account does not possess administrator credentials to access the moderation console.'
          : 'Please sign in with an authorized administrator Google account to continue.'}
      </p>

      <div className="flex justify-center gap-3 pt-2">
        <a
          href="/"
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-canvas border border-warm text-xs font-semibold text-espresso hover:border-terracotta transition-colors inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to Library</span>
        </a>

        {!isAuthenticated && (
          <button
            type="button"
            onClick={() => {
              signInWithGoogle().catch(() => {});
            }}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-terracotta text-white font-semibold text-xs hover:bg-terracotta/90 transition-colors inline-flex items-center gap-2 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
          >
            <LogIn className="w-4 h-4" aria-hidden="true" />
            <span>Sign In as Admin</span>
          </button>
        )}
      </div>
    </div>
  );
}
