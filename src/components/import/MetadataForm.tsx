import React from 'react';
import type { SongMetadata, Instrument, Difficulty } from '../../lib/types';

interface MetadataFormProps {
  metadata: SongMetadata;
  onChange: (updated: Partial<SongMetadata>) => void;
}

export const MetadataForm: React.FC<MetadataFormProps> = ({ metadata, onChange }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 rounded-2xl bg-canvas border border-warm text-xs">
      <div>
        <label htmlFor="meta-title-input" className="block font-medium text-walnut mb-1">Song Title *</label>
        <input
          id="meta-title-input"
          type="text"
          value={metadata.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="e.g. Wonderwall"
          className="w-full min-h-[40px] px-3 py-1.5 rounded-lg bg-surface border border-warm text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:border-transparent"
          required
        />
      </div>

      <div>
        <label htmlFor="meta-artist-input" className="block font-medium text-walnut mb-1">Artist / Band *</label>
        <input
          id="meta-artist-input"
          type="text"
          value={metadata.artist}
          onChange={(e) => onChange({ artist: e.target.value })}
          placeholder="e.g. Oasis"
          className="w-full min-h-[40px] px-3 py-1.5 rounded-lg bg-surface border border-warm text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:border-transparent"
          required
        />
      </div>

      <div>
        <label htmlFor="meta-instrument-select" className="block font-medium text-walnut mb-1">Instrument</label>
        <select
          id="meta-instrument-select"
          value={metadata.instrument}
          onChange={(e) => onChange({ instrument: e.target.value as Instrument })}
          className="w-full min-h-[40px] px-3 py-1.5 rounded-lg bg-surface border border-warm text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:border-transparent"
        >
          <option value="guitar">6-String Guitar</option>
          <option value="ukulele">4-String Ukulele</option>
        </select>
      </div>

      <div>
        <label htmlFor="meta-capo-input" className="block font-medium text-walnut mb-1">Capo Fret (0 = None)</label>
        <input
          id="meta-capo-input"
          type="number"
          min="0"
          max="12"
          value={metadata.capo}
          onChange={(e) => onChange({ capo: parseInt(e.target.value, 10) || 0 })}
          className="w-full min-h-[40px] px-3 py-1.5 rounded-lg bg-surface border border-warm text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="meta-bpm-input" className="block font-medium text-walnut mb-1">BPM (Optional)</label>
        <input
          id="meta-bpm-input"
          type="number"
          min="30"
          max="300"
          value={metadata.bpm ?? ''}
          onChange={(e) => onChange({ bpm: e.target.value ? parseInt(e.target.value, 10) : undefined })}
          placeholder="e.g. 110"
          className="w-full min-h-[40px] px-3 py-1.5 rounded-lg bg-surface border border-warm text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="meta-difficulty-select" className="block font-medium text-walnut mb-1">Difficulty</label>
        <select
          id="meta-difficulty-select"
          value={metadata.difficulty}
          onChange={(e) => onChange({ difficulty: e.target.value as Difficulty })}
          className="w-full min-h-[40px] px-3 py-1.5 rounded-lg bg-surface border border-warm text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:border-transparent"
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="meta-strumming-input" className="block font-medium text-walnut mb-1">Strumming Pattern (Optional)</label>
        <input
          id="meta-strumming-input"
          type="text"
          value={metadata.strummingPattern ?? ''}
          onChange={(e) => onChange({ strummingPattern: e.target.value || undefined })}
          placeholder="e.g. D - D U - U D U"
          className="w-full min-h-[40px] px-3 py-1.5 rounded-lg bg-surface border border-warm text-espresso font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:border-transparent"
        />
      </div>

      <div className="flex items-center gap-2 pt-5">
        <input
          type="checkbox"
          id="fingerstyle-check"
          checked={metadata.isFingerstyle}
          onChange={(e) => onChange({ isFingerstyle: e.target.checked })}
          className="rounded accent-terracotta w-4 h-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
        />
        <label htmlFor="fingerstyle-check" className="font-medium text-walnut select-none cursor-pointer">
          Has Fingerstyle / ASCII Tab
        </label>
      </div>
    </div>
  );
};
