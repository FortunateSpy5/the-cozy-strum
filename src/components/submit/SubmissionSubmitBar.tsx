import React from 'react';
import { Send, Loader2 } from 'lucide-react';

interface SubmissionSubmitBarProps {
  visibility: 'public' | 'private';
  isSubmitting: boolean;
  canSubmit: boolean;
}

export function SubmissionSubmitBar({
  visibility,
  isSubmitting,
  canSubmit,
}: SubmissionSubmitBarProps): React.JSX.Element {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-surface border border-warm">
      <p className="text-xs text-walnut">
        {visibility === 'public'
          ? 'Public submissions will be reviewed by sanctuary curators before publishing.'
          : 'Private tabs are visible only to your signed-in account.'}
      </p>
      <button
        type="submit"
        disabled={isSubmitting || !canSubmit}
        className="min-h-[44px] px-6 py-2.5 rounded-xl bg-terracotta text-white dark:text-espresso font-semibold text-xs sm:text-sm hover:bg-terracotta/90 inline-flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
      >
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="w-4 h-4" aria-hidden="true" />
        )}
        <span>{visibility === 'public' ? 'Submit to Community' : 'Save to Private Vault'}</span>
      </button>
    </div>
  );
}
