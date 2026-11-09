import React, { useState, useEffect } from 'react';
import { ShieldAlert, Send, Loader2 } from 'lucide-react';
import { submitDmcaRequest, type DmcaSubmissionInput } from '../../lib/firebase/dmcaService';
import { DmcaSuccessNotice } from './DmcaSuccessNotice';
import { DmcaClaimantFields } from './DmcaClaimantFields';
import { DmcaStatementAgreement } from './DmcaStatementAgreement';

const inputClass =
  'w-full px-3 py-2 min-h-[44px] rounded-xl bg-canvas border border-warm text-sm text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta';

export function DmcaFormIsland(): React.JSX.Element {
  const [formData, setFormData] = useState<DmcaSubmissionInput>({
    tabId: '',
    songTitle: '',
    artistName: '',
    claimantName: '',
    claimantEmail: '',
    companyOrRightsholder: '',
    infringingUrl: '',
    statementOfGoodFaith: false,
    digitalSignature: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabId = params.get('tabId') || '';
      const title = params.get('title') || '';
      const url = tabId ? `${window.location.origin}/tab?id=${tabId}` : '';
      setFormData((prev) => ({
        ...prev,
        tabId,
        songTitle: title,
        infringingUrl: url,
      }));
    }
  }, []);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.statementOfGoodFaith) {
      setErrorMessage('You must confirm the good-faith statement under penalty of perjury.');
      return;
    }

    try {
      setIsSubmitting(true);
      const id = await submitDmcaRequest(formData);
      setSubmittedId(id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit DMCA request.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedId) {
    return <DmcaSuccessNotice submittedId={submittedId} onReset={() => setSubmittedId(null)} />;
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-canvas border border-warm space-y-4">
      <div className="flex items-center gap-2 border-b border-warm pb-3">
        <ShieldAlert className="w-5 h-5 text-terracotta" aria-hidden="true" />
        <h3 className="font-serif text-lg font-bold text-espresso">Official DMCA Takedown Notice Form</h3>
      </div>

      {errorMessage && (
        <div role="alert" aria-live="assertive" className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300 text-xs">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="dmca-work" className="block text-xs font-semibold text-walnut uppercase tracking-wider mb-1">
            Copyrighted Work / Song Title *
          </label>
          <input
            id="dmca-work"
            name="songTitle"
            required
            type="text"
            value={formData.songTitle}
            onChange={(e) => setFormData((p) => ({ ...p, songTitle: e.target.value }))}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="dmca-artist" className="block text-xs font-semibold text-walnut uppercase tracking-wider mb-1">
            Artist / Composer Name
          </label>
          <input
            id="dmca-artist"
            name="artistName"
            type="text"
            value={formData.artistName}
            onChange={(e) => setFormData((p) => ({ ...p, artistName: e.target.value }))}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="dmca-url" className="block text-xs font-semibold text-walnut uppercase tracking-wider mb-1">
          Infringing URL or Tab ID on The Cozy Strum *
        </label>
        <input
          id="dmca-url"
          name="infringingUrl"
          required
          type="text"
          placeholder="https://thecozystrum.local/tab?id=..."
          value={formData.infringingUrl}
          onChange={(e) => setFormData((p) => ({ ...p, infringingUrl: e.target.value }))}
          className={inputClass}
        />
      </div>

      <DmcaClaimantFields
        claimantName={formData.claimantName}
        claimantEmail={formData.claimantEmail}
        companyOrRightsholder={formData.companyOrRightsholder}
        onChange={(updates) => setFormData((p) => ({ ...p, ...updates }))}
      />

      <div className="pt-2 border-t border-warm space-y-3">
        <DmcaStatementAgreement
          checked={formData.statementOfGoodFaith}
          onChange={(checked) => setFormData((p) => ({ ...p, statementOfGoodFaith: checked }))}
        />

        <div>
          <label htmlFor="dmca-sig" className="block text-xs font-semibold text-walnut uppercase tracking-wider mb-1">
            Electronic Signature (Type Your Full Legal Name) *
          </label>
          <input
            id="dmca-sig"
            name="digitalSignature"
            required
            type="text"
            placeholder="e.g., Jonathan Doe"
            value={formData.digitalSignature}
            onChange={(e) => setFormData((p) => ({ ...p, digitalSignature: e.target.value }))}
            className={inputClass}
          />
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-[44px] px-6 py-2.5 rounded-xl bg-terracotta text-white font-semibold text-xs hover:bg-terracotta/90 transition-colors inline-flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Send className="w-4 h-4" aria-hidden="true" />}
          <span>Submit Official Notice</span>
        </button>
      </div>
    </form>
  );
}
