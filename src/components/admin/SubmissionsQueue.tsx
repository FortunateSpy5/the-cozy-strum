import React, { useState } from 'react';
import { Eye, Check, Loader2, Clock } from 'lucide-react';
import type { CloudTab } from '../../lib/firebase/types';
import { SubmissionReviewModal } from './SubmissionReviewModal';

interface SubmissionsQueueProps {
  pendingTabs: CloudTab[];
  isLoading: boolean;
  onApprove: (tab: CloudTab) => Promise<void>;
  onReject: (tabId: string, reason?: string) => Promise<void>;
}

export function SubmissionsQueue({
  pendingTabs,
  isLoading,
  onApprove,
  onReject,
}: SubmissionsQueueProps): React.JSX.Element {
  const [selectedTab, setSelectedTab] = useState<CloudTab | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const handleQuickApprove = async (tab: CloudTab, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setApprovingId(tab.id);
      await onApprove(tab);
    } finally {
      setApprovingId(null);
    }
  };

  if (isLoading) {
    return (
      <div role="status" aria-live="polite" className="py-16 text-center space-y-3">
        <Loader2 className="w-6 h-6 text-terracotta animate-spin mx-auto" aria-hidden="true" />
        <p className="text-xs font-mono text-walnut">Loading submission queue…</p>
      </div>
    );
  }

  if (pendingTabs.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl bg-canvas border border-warm space-y-2">
        <Clock className="w-8 h-8 text-walnut mx-auto" aria-hidden="true" />
        <h3 className="font-serif text-lg font-bold text-espresso">Queue is All Clear</h3>
        <p className="text-xs text-walnut">No community submissions are waiting for moderation right now.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-serif text-base font-bold text-espresso">
          Pending Submissions ({pendingTabs.length})
        </h3>
        <span className="text-[11px] font-mono text-walnut">Click any row to inspect chords & lyrics</span>
      </div>

      <div className="space-y-2">
        {pendingTabs.map((tab) => (
          <div
            key={tab.id}
            role="button"
            tabIndex={0}
            aria-label={`Inspect ${tab.title} by ${tab.artist}`}
            onClick={() => setSelectedTab(tab)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedTab(tab);
              }
            }}
            className="p-4 rounded-xl bg-canvas border border-warm hover:border-terracotta transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer group shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-sm text-espresso group-hover:text-terracotta transition-colors">
                  {tab.title}
                </span>
                <span className="text-xs text-walnut">• {tab.artist}</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-walnut">
                <span className="px-1.5 py-0.5 rounded bg-surface border border-warm uppercase">{tab.instrument}</span>
                <span className="px-1.5 py-0.5 rounded bg-surface border border-warm">{tab.difficulty}</span>
                <span className="px-1.5 py-0.5 rounded bg-surface border border-warm">{tab.authorName}</span>
                <span className="text-terracotta font-semibold">{(tab.categories || []).join(', ')}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                id={`review-btn-${tab.id}`}
                aria-label={`Review tab: ${tab.title} by ${tab.artist}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTab(tab);
                }}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-surface border border-warm hover:border-espresso text-xs font-medium text-espresso transition-colors inline-flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
              >
                <Eye className="w-3.5 h-3.5 text-walnut" aria-hidden="true" />
                <span>Review Tab</span>
              </button>

              <button
                type="button"
                disabled={approvingId === tab.id}
                aria-label={`Quick approve: ${tab.title} by ${tab.artist}`}
                onClick={(e) => handleQuickApprove(tab, e)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              >
                {approvingId === tab.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>Approve</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <SubmissionReviewModal
        tab={selectedTab}
        onClose={() => setSelectedTab(null)}
        onApprove={onApprove}
        onReject={onReject}
      />
    </div>
  );
}
