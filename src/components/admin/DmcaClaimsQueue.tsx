import React, { useState } from 'react';
import { ShieldCheck, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import type { DmcaRequest } from '../../lib/firebase/types';

interface DmcaClaimsQueueProps {
  claims: DmcaRequest[];
  isLoading: boolean;
  onResolve: (requestId: string, tabId: string, resolution: 'approved_removed' | 'dismissed', notes?: string) => Promise<void>;
}

export function DmcaClaimsQueue({
  claims,
  isLoading,
  onResolve,
}: DmcaClaimsQueueProps): React.JSX.Element {
  const [filter, setFilter] = useState<'open' | 'all'>('open');
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const filteredClaims = filter === 'open' ? claims.filter((c) => c.status === 'open') : claims;

  const handleAction = async (
    requestId: string,
    tabId: string,
    resolution: 'approved_removed' | 'dismissed'
  ) => {
    try {
      setResolvingId(requestId);
      await onResolve(requestId, tabId, resolution);
    } finally {
      setResolvingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center space-y-3">
        <Loader2 className="w-6 h-6 text-terracotta animate-spin mx-auto" aria-hidden="true" />
        <p className="text-xs font-mono text-walnut">Loading copyright claims…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <h3 className="font-serif text-base font-bold text-espresso">
          Copyright Takedown Requests ({filteredClaims.length})
        </h3>
        <div className="flex gap-1.5 bg-canvas p-1 rounded-xl border border-warm">
          <button
            type="button"
            onClick={() => setFilter('open')}
            className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filter === 'open' ? 'bg-terracotta text-white' : 'text-walnut hover:text-espresso'
            }`}
          >
            Open Claims
          </button>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filter === 'all' ? 'bg-terracotta text-white' : 'text-walnut hover:text-espresso'
            }`}
          >
            All History
          </button>
        </div>
      </div>

      {filteredClaims.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-canvas border border-warm space-y-2">
          <ShieldCheck className="w-8 h-8 text-emerald-700 dark:text-emerald-400 mx-auto" aria-hidden="true" />
          <h3 className="font-serif text-lg font-bold text-espresso">No Open Copyright Claims</h3>
          <p className="text-xs text-walnut">All legal notices have been reviewed and resolved.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredClaims.map((claim) => {
            const isOpen = claim.status === 'open';
            const isProcessing = resolvingId === claim.id;

            return (
              <div
                key={claim.id}
                className="p-5 rounded-2xl bg-canvas border border-warm space-y-3 shadow-2xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-base text-espresso">
                        {claim.songTitle}
                      </span>
                      {claim.artistName && <span className="text-xs text-walnut">• {claim.artistName}</span>}
                    </div>
                    <p className="text-xs text-walnut mt-0.5">
                      Reported URL / ID: <span className="font-mono text-espresso font-semibold">{claim.tabId || claim.infringingUrl}</span>
                    </p>
                  </div>

                  <span
                    className={`self-start text-[10px] font-mono font-semibold px-2 py-0.5 rounded uppercase ${
                      isOpen
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        : claim.status === 'approved_removed'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-warm/40 text-walnut'
                    }`}
                  >
                    {claim.status}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-surface border border-warm/80 text-xs space-y-1 font-mono text-walnut">
                  <p>Claimant: <strong className="text-espresso font-sans">{claim.claimantName}</strong> ({claim.claimantEmail})</p>
                  {claim.companyOrRightsholder && <p>Organization: {claim.companyOrRightsholder}</p>}
                  <p>Digital Signature: <span className="italic text-espresso font-sans">"{claim.digitalSignature}"</span></p>
                  <p className="text-[10px] text-walnut/70">Filed: {new Date(claim.createdAt).toLocaleString()}</p>
                </div>

                {isOpen && (
                  <div className="pt-2 border-t border-warm flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleAction(claim.id, claim.tabId, 'dismissed')}
                      className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-warm text-xs font-medium text-walnut hover:text-espresso hover:bg-surface transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-walnut" aria-hidden="true" />
                      <span>Dismiss Notice</span>
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleAction(claim.id, claim.tabId, 'approved_removed')}
                      className="min-h-[40px] px-4 py-1.5 rounded-xl bg-rose-700 text-white text-xs font-semibold hover:bg-rose-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      <span>1-Click Soft-Delete Tab (DMCA)</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
