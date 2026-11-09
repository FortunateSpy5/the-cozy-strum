import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import type { TabStatus } from '../../lib/firebase/types';

interface SubmissionSuccessViewProps {
  tabId: string;
  status: TabStatus;
  onReset: () => void;
}

export function SubmissionSuccessView({
  tabId,
  status,
  onReset,
}: SubmissionSuccessViewProps): React.JSX.Element {
  const isPublic = status === 'pending_review';

  return (
    <div
      role="status"
      aria-live="polite"
      className="max-w-xl mx-auto py-16 text-center p-8 rounded-3xl bg-surface border border-warm space-y-4"
    >
      <CheckCircle2 className="w-12 h-12 text-emerald-700 dark:text-emerald-400 mx-auto" aria-hidden="true" />
      <h2 className="font-serif text-2xl font-bold text-espresso">
        {isPublic ? 'Tab Submitted for Review!' : 'Tab Saved to Your Vault!'}
      </h2>
      <p className="text-sm text-walnut">
        {isPublic
          ? 'Thank you for contributing to The Cozy Strum. Your tab has been queued for moderation.'
          : 'Your private tab has been saved to your personal sanctuary vault.'}
      </p>
      <div className="flex justify-center gap-3 pt-2">
        <a
          href={`/tab?id=${encodeURIComponent(tabId)}`}
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-terracotta text-white font-semibold text-xs hover:bg-terracotta/90 transition-colors inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
        >
          <span>Play Tab Now</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </a>
        <button
          type="button"
          onClick={onReset}
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-canvas border border-warm text-xs font-semibold text-espresso hover:border-terracotta transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta cursor-pointer"
        >
          Submit Another Tab
        </button>
      </div>
    </div>
  );
}
