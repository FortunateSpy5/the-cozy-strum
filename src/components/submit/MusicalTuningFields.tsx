import React from 'react';
import type { Instrument } from '../../lib/types';

interface MusicalTuningFieldsProps {
  instrument: Instrument;
  capo: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  bpm?: number;
  onChange: (updates: {
    instrument?: Instrument;
    tuning?: string;
    capo?: number;
    difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
    bpm?: number;
  }) => void;
}

export const MusicalTuningFields = React.memo(function MusicalTuningFields({
  instrument,
  capo,
  difficulty,
  bpm,
  onChange,
}: MusicalTuningFieldsProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div>
        <label htmlFor="tab-inst" className="block text-xs font-semibold text-walnut uppercase tracking-wider mb-1">
          Instrument
        </label>
        <select
          id="tab-inst"
          name="instrument"
          value={instrument}
          onChange={(e) => {
            const inst = e.target.value as Instrument;
            onChange({
              instrument: inst,
              tuning: inst === 'ukulele' ? 'Standard Ukulele (G C E A)' : 'Standard (E A D G B E)',
            });
          }}
          className="w-full px-2.5 py-2 min-h-[44px] rounded-xl bg-canvas border border-warm text-xs sm:text-sm text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
        >
          <option value="guitar">Guitar</option>
          <option value="ukulele">Ukulele</option>
        </select>
      </div>

      <div>
        <label htmlFor="tab-capo" className="block text-xs font-semibold text-walnut uppercase tracking-wider mb-1">
          Capo Fret
        </label>
        <input
          id="tab-capo"
          name="capo"
          type="number"
          min={0}
          max={12}
          value={capo}
          onChange={(e) => {
            const val = parseInt(e.target.value || '0', 10);
            onChange({ capo: Number.isFinite(val) ? Math.max(0, Math.min(12, val)) : 0 });
          }}
          className="w-full px-2.5 py-2 min-h-[44px] rounded-xl bg-canvas border border-warm text-xs sm:text-sm text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
        />
      </div>

      <div>
        <label htmlFor="tab-diff" className="block text-xs font-semibold text-walnut uppercase tracking-wider mb-1">
          Difficulty
        </label>
        <select
          id="tab-diff"
          name="difficulty"
          value={difficulty}
          onChange={(e) =>
            onChange({
              difficulty: e.target.value as 'Beginner' | 'Intermediate' | 'Advanced',
            })
          }
          className="w-full px-2.5 py-2 min-h-[44px] rounded-xl bg-canvas border border-warm text-xs sm:text-sm text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
        >
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
      </div>

      <div>
        <label htmlFor="tab-bpm" className="block text-xs font-semibold text-walnut uppercase tracking-wider mb-1">
          BPM
        </label>
        <input
          id="tab-bpm"
          name="bpm"
          type="number"
          min={30}
          max={260}
          placeholder="e.g., 96"
          value={bpm || ''}
          onChange={(e) => {
            const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
            onChange({ bpm: val && Number.isFinite(val) ? val : undefined });
          }}
          className="w-full px-2.5 py-2 min-h-[44px] rounded-xl bg-canvas border border-warm text-xs sm:text-sm text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
        />
      </div>
    </div>
  );
});
