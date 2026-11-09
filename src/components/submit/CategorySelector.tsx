import React from 'react';
import { SONG_CATEGORIES, type SongCategory } from '../../lib/types';

interface CategorySelectorProps {
  selectedCategories: SongCategory[];
  onChange: (categories: SongCategory[]) => void;
}

export const CategorySelector = React.memo(function CategorySelector({
  selectedCategories,
  onChange,
}: CategorySelectorProps): React.JSX.Element {
  const toggleCategory = (cat: SongCategory) => {
    const updated = selectedCategories.includes(cat)
      ? selectedCategories.filter((c) => c !== cat)
      : [...selectedCategories, cat];
    onChange(updated);
  };

  return (
    <div role="group" aria-labelledby="category-selector-label">
      <span
        id="category-selector-label"
        className="block text-xs font-semibold text-walnut uppercase tracking-wider mb-1.5"
      >
        Categories & Genres (Select all that apply)
      </span>
      <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 rounded-xl bg-canvas border border-warm/80">
        {SONG_CATEGORIES.map((cat) => {
          const isSelected = selectedCategories.includes(cat);
          return (
            <button
              key={cat}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggleCategory(cat)}
              className={`min-h-[36px] sm:min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta ${
                isSelected
                  ? 'bg-terracotta text-white shadow-2xs'
                  : 'bg-surface text-walnut hover:text-espresso border border-warm'
              }`}
            >
              {cat} {isSelected ? '✓' : '+'}
            </button>
          );
        })}
      </div>
    </div>
  );
});
