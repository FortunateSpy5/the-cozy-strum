import React from 'react';

interface DmcaClaimantFieldsProps {
  claimantName: string;
  claimantEmail: string;
  companyOrRightsholder: string;
  onChange: (updates: {
    claimantName?: string;
    claimantEmail?: string;
    companyOrRightsholder?: string;
  }) => void;
}

const inputClass =
  'w-full px-3 py-2 min-h-[44px] rounded-xl bg-canvas border border-warm text-sm text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta';

export function DmcaClaimantFields({
  claimantName,
  claimantEmail,
  companyOrRightsholder,
  onChange,
}: DmcaClaimantFieldsProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <label htmlFor="dmca-name" className="block text-xs font-semibold text-walnut uppercase tracking-wider mb-1">
          Your Full Legal Name *
        </label>
        <input
          id="dmca-name"
          name="claimantName"
          required
          autoComplete="name"
          type="text"
          value={claimantName}
          onChange={(e) => onChange({ claimantName: e.target.value })}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="dmca-email" className="block text-xs font-semibold text-walnut uppercase tracking-wider mb-1">
          Contact Email Address *
        </label>
        <input
          id="dmca-email"
          name="claimantEmail"
          required
          autoComplete="email"
          type="email"
          value={claimantEmail}
          onChange={(e) => onChange({ claimantEmail: e.target.value })}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="dmca-company" className="block text-xs font-semibold text-walnut uppercase tracking-wider mb-1">
          Rightsholder / Organization
        </label>
        <input
          id="dmca-company"
          name="companyOrRightsholder"
          type="text"
          placeholder="Self / Publisher"
          value={companyOrRightsholder}
          onChange={(e) => onChange({ companyOrRightsholder: e.target.value })}
          className={inputClass}
        />
      </div>
    </div>
  );
}
