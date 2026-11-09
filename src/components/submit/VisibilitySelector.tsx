import React from 'react';
import type { TabVisibility } from '../../lib/firebase/types';

interface VisibilitySelectorProps {
  visibility: TabVisibility;
  onChange: (visibility: TabVisibility) => void;
}

export const VisibilitySelector = React.memo(function VisibilitySelector({
  visibility,
  onChange,
}: VisibilitySelectorProps): React.JSX.Element {
  return (
    <div role="radiogroup" aria-labelledby="visibility-label" className="pt-2 border-t border-warm">
      <span
        id="visibility-label"
        className="block text-xs font-semibold text-walnut uppercase tracking-wider mb-2"
      >
        Visibility & Publishing
      </span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label
          htmlFor="visibility-public"
          className={`p-3 rounded-xl border cursor-pointer transition-colors flex items-start gap-2.5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-terracotta ${
            visibility === 'public'
              ? 'bg-canvas border-terracotta ring-1 ring-terracotta'
              : 'bg-surface border-warm hover:border-warm/80'
          }`}
        >
          <input
            id="visibility-public"
            type="radio"
            name="visibility"
            value="public"
            checked={visibility === 'public'}
            onChange={() => onChange('public')}
            className="mt-1 text-terracotta focus:ring-terracotta"
          />
          <div>
            <p className="text-xs font-bold text-espresso">Public Community Submission</p>
            <p className="text-xs text-walnut mt-0.5">
              Submitted for Admin review. Once approved, it appears in the sanctuary library for all players.
            </p>
          </div>
        </label>

        <label
          htmlFor="visibility-private"
          className={`p-3 rounded-xl border cursor-pointer transition-colors flex items-start gap-2.5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-terracotta ${
            visibility === 'private'
              ? 'bg-canvas border-terracotta ring-1 ring-terracotta'
              : 'bg-surface border-warm hover:border-warm/80'
          }`}
        >
          <input
            id="visibility-private"
            type="radio"
            name="visibility"
            value="private"
            checked={visibility === 'private'}
            onChange={() => onChange('private')}
            className="mt-1 text-terracotta focus:ring-terracotta"
          />
          <div>
            <p className="text-xs font-bold text-espresso">Private Vault Tab</p>
            <p className="text-xs text-walnut mt-0.5">
              Saved exclusively to your personal vault. Only you can view, practice, and transpose this tab.
            </p>
          </div>
        </label>
      </div>
    </div>
  );
});
