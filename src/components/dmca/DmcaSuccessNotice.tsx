import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface DmcaSuccessNoticeProps {
  submittedId: string;
  onReset: () => void;
}

export function DmcaSuccessNotice({
  submittedId,
  onReset,
}: DmcaSuccessNoticeProps): React.JSX.Element {
  return (
    <div
      role="status"
      aria-live="polite"
      className="p-8 rounded-2xl bg-canvas border border-warm text-center space-y-3"
    >
      <CheckCircle2 className="w-10 h-10 text-emerald-700 dark:text-emerald-400 mx-auto" aria-hidden="true" />
      <h3 className="font-serif text-xl font-bold text-espresso">Takedown Request Submitted</h3>
      <p className="text-xs text-walnut max-w-md mx-auto">
        Your DMCA request has been logged under ID{' '}
        <span className="font-mono font-semibold text-espresso">{submittedId}</span>. Our moderation
        team will review this notice within 24–48 business hours.
      </p>
      <div className="pt-2">
        <button
          type="button"
          onClick={onReset}
          className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold text-terracotta hover:bg-surface border border-warm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
        >
          Submit Another Notice
        </button>
      </div>
    </div>
  );
}
