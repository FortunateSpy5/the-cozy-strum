import React from 'react';
import { Sparkles, LogIn } from 'lucide-react';
import { signInWithGoogle } from '../../lib/firebase/auth';

export function SubmissionAuthGuard(): React.JSX.Element {
  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch {
      // User cancelled popup or closed dialog
    }
  };

  return (
    <div className="max-w-xl mx-auto py-16 text-center p-8 rounded-3xl bg-surface border border-warm space-y-4">
      <Sparkles className="w-10 h-10 text-terracotta mx-auto" aria-hidden="true" />
      <h1 className="font-serif text-2xl font-bold text-espresso">Community Submission Studio</h1>
      <p className="text-sm text-walnut">
        Sign in with Google to submit tabs to the public sanctuary or save private chords to your personal vault.
      </p>
      <button
        type="button"
        onClick={handleSignIn}
        className="min-h-[44px] px-6 py-2.5 rounded-xl bg-terracotta text-white font-semibold text-sm hover:bg-terracotta/90 transition-colors inline-flex items-center gap-2 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
      >
        <LogIn className="w-4 h-4" aria-hidden="true" />
        <span>Sign In to Continue</span>
      </button>
    </div>
  );
}
