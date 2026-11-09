import React, { useState } from 'react';
import { X, Check, XCircle, Loader2 } from 'lucide-react';
import { useModalA11y } from '../common/useModalA11y';
import type { CloudTab } from '../../lib/firebase/types';
import { parseSongText } from '../../lib/parser/songParser';
import { TabRenderer } from '../player/TabRenderer';

interface SubmissionReviewModalProps {
  tab: CloudTab | null;
  onClose: () => void;
  onApprove: (tab: CloudTab) => Promise<void>;
  onReject: (tabId: string, reason?: string) => Promise<void>;
}

export function SubmissionReviewModal({
  tab,
  onClose,
  onApprove,
  onReject,
}: SubmissionReviewModalProps): React.JSX.Element | null {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const modalRef = useModalA11y({
    isOpen: Boolean(tab),
    onClose,
  });

  if (!tab) return null;

  const ast = parseSongText(tab.content);

  const handleApprove = async () => {
    try {
      setIsProcessing(true);
      await onApprove(tab);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsProcessing(true);
      await onReject(tab.id, rejectReason);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/50 backdrop-blur-xs animate-in fade-in duration-150 [overscroll-behavior:contain]"
    >
      <div className="w-full max-w-3xl rounded-2xl bg-surface border border-warm p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          type="button"
          aria-label="Close tab review dialog"
          className="absolute right-4 top-4 p-1 rounded-lg text-walnut hover:text-espresso min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta transition-colors"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        <div className="border-b border-warm pb-3 mb-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-terracotta font-semibold">Moderation Review</span>
          <h2 id="review-modal-title" className="font-serif text-xl font-bold text-espresso">
            {tab.title} — <span className="font-sans font-normal text-walnut">{tab.artist}</span>
          </h2>
          <div className="flex flex-wrap gap-2 text-xs font-mono text-walnut mt-1">
            <span className="px-2 py-0.5 rounded bg-canvas border border-warm">Author: {tab.authorName}</span>
            <span className="px-2 py-0.5 rounded bg-canvas border border-warm uppercase">{tab.instrument}</span>
            <span className="px-2 py-0.5 rounded bg-canvas border border-warm">Capo: {tab.capo}</span>
            <span className="px-2 py-0.5 rounded bg-canvas border border-warm">{tab.difficulty}</span>
            <span className="px-2 py-0.5 rounded bg-canvas border border-warm">{ast.uniqueChords.length} chords</span>
          </div>
        </div>

        <div
          tabIndex={0}
          role="region"
          aria-label="Tab lyrics and chords"
          className="flex-1 overflow-y-auto p-4 rounded-xl bg-canvas border border-warm scrollbar-thin min-h-[250px] max-h-[400px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
        >
          <TabRenderer lines={ast.lines} semitones={0} fontSize="base" columnMode="single" />
        </div>

        {showRejectInput && (
          <div className="pt-3 border-t border-warm mt-3">
            <label htmlFor="reject-reason" className="block text-xs font-semibold text-walnut mb-1">
              Rejection Reason (Optional):
            </label>
            <input
              id="reject-reason"
              type="text"
              placeholder="e.g., Inaccurate chorus chords, broken ASCII tabs"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 min-h-[44px] rounded-xl bg-canvas border border-warm text-xs text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
            />
          </div>
        )}

        <div className="pt-4 mt-3 border-t border-warm flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-medium text-walnut hover:text-espresso hover:bg-canvas transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
          >
            Cancel
          </button>

          <div className="flex gap-2">
            {!showRejectInput ? (
              <button
                type="button"
                onClick={() => setShowRejectInput(true)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-50 border border-rose-300 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300 text-xs font-semibold hover:bg-rose-100 transition-colors inline-flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
              >
                <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Reject...</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleReject}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <XCircle className="w-3.5 h-3.5" aria-hidden="true" />}
                <span>Confirm Reject</span>
              </button>
            )}

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleApprove}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Check className="w-3.5 h-3.5" aria-hidden="true" />}
              <span>Approve & Publish to Catalog</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
