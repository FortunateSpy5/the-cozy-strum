import React from 'react';

interface DmcaStatementAgreementProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function DmcaStatementAgreement({
  checked,
  onChange,
}: DmcaStatementAgreementProps): React.JSX.Element {
  return (
    <div className="flex items-start gap-2.5 min-h-[44px] py-1">
      <input
        id="dmca-statement"
        type="checkbox"
        name="statementOfGoodFaith"
        required
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 mt-0.5 rounded border-warm accent-terracotta cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
      />
      <label htmlFor="dmca-statement" className="text-xs text-espresso cursor-pointer select-none">
        I have a good-faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law. I swear, under penalty of perjury, that the information in this notice is accurate and that I am the copyright owner or authorized to act on behalf of the owner.
      </label>
    </div>
  );
}
