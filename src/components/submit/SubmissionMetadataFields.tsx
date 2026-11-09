import React from 'react';
import type { TabSubmissionInput } from '../../lib/firebase/submitService';
import { CategorySelector } from './CategorySelector';
import { MusicalTuningFields } from './MusicalTuningFields';
import { VisibilitySelector } from './VisibilitySelector';

interface SubmissionMetadataFieldsProps {
  input: TabSubmissionInput;
  onChange: (updates: Partial<TabSubmissionInput>) => void;
}

const inputClass =
  'w-full px-3 py-2 min-h-[44px] rounded-xl bg-canvas border border-warm text-sm text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta';

export const SubmissionMetadataFields = React.memo(function SubmissionMetadataFields({
  input,
  onChange,
}: SubmissionMetadataFieldsProps): React.JSX.Element {
  return (
    <div className="p-5 rounded-2xl bg-surface border border-warm space-y-4">
      <h2 className="font-serif text-lg font-bold text-espresso">Song Details & Categorization</h2>

      {/* Row 1: Title & Artist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="tab-title" className="block text-xs font-semibold text-walnut uppercase tracking-wider mb-1">
            Song Title *
          </label>
          <input
            id="tab-title"
            name="title"
            type="text"
            required
            autoComplete="off"
            placeholder="e.g., Yesterday, Bela Bose, Husn"
            value={input.title}
            onChange={(e) => onChange({ title: e.target.value })}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="tab-artist" className="block text-xs font-semibold text-walnut uppercase tracking-wider mb-1">
            Artist / Band *
          </label>
          <input
            id="tab-artist"
            name="artist"
            type="text"
            required
            autoComplete="off"
            placeholder="e.g., The Beatles, Anjan Dutt, Anuv Jain"
            value={input.artist}
            onChange={(e) => onChange({ artist: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      {/* Row 2: Album & Release Year */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="tab-album" className="block text-xs font-semibold text-walnut uppercase tracking-wider mb-1">
            Album (Optional)
          </label>
          <input
            id="tab-album"
            name="album"
            type="text"
            autoComplete="off"
            placeholder="e.g., Help!, Point of Know Return"
            value={input.album || ''}
            onChange={(e) => onChange({ album: e.target.value })}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="tab-year" className="block text-xs font-semibold text-walnut uppercase tracking-wider mb-1">
            Release Year (Optional)
          </label>
          <input
            id="tab-year"
            name="releaseYear"
            type="number"
            min={1900}
            max={2099}
            autoComplete="off"
            placeholder="e.g., 1965, 1995, 2024"
            value={input.releaseYear || ''}
            onChange={(e) => {
              const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
              onChange({ releaseYear: val && Number.isFinite(val) ? val : undefined });
            }}
            className={inputClass}
          />
        </div>
      </div>

      {/* Multi-Category Selector */}
      <CategorySelector
        selectedCategories={input.categories}
        onChange={(categories) => onChange({ categories })}
      />

      {/* Instrument, Capo, Difficulty, BPM */}
      <MusicalTuningFields
        instrument={input.instrument}
        capo={input.capo}
        difficulty={input.difficulty}
        bpm={input.bpm}
        onChange={onChange}
      />

      {/* Visibility Selector */}
      <VisibilitySelector
        visibility={input.visibility}
        onChange={(visibility) => onChange({ visibility })}
      />
    </div>
  );
});
