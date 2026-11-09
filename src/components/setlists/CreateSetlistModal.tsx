import React, { useState } from 'react';
import { X, ListPlus } from 'lucide-react';
import { useModalA11y } from '../common/useModalA11y';

interface CreateSetlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, description: string) => Promise<void>;
}

export function CreateSetlistModal({
  isOpen,
  onClose,
  onCreate,
}: CreateSetlistModalProps): React.JSX.Element | null {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dialogRef = useModalA11y({ isOpen, onClose });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSubmitting(true);
      await onCreate(title, description);
      setTitle('');
      setDescription('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-setlist-title"
      ref={dialogRef}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/50 backdrop-blur-xs animate-in fade-in duration-150 [overscroll-behavior:contain]"
    >
      <div className="w-full max-w-md rounded-2xl bg-surface border border-warm p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          type="button"
          aria-label="Close dialog"
          className="absolute right-4 top-4 p-1 rounded-lg text-walnut hover:text-espresso min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <ListPlus className="w-5 h-5 text-terracotta" aria-hidden="true" />
          <h2 id="create-setlist-title" className="font-serif text-xl font-bold text-espresso">
            Create New Setlist
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="setlist-name" className="block text-xs font-semibold text-walnut uppercase tracking-wider mb-1">
              Setlist Title *
            </label>
            <input
              id="setlist-name"
              type="text"
              required
              autoFocus
              placeholder="e.g., Friday Campfire Jam, Sunday Acoustic Gig"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 min-h-[44px] rounded-xl bg-canvas border border-warm text-sm text-espresso focus:outline-none focus:border-terracotta"
            />
          </div>

          <div>
            <label htmlFor="setlist-desc" className="block text-xs font-semibold text-walnut uppercase tracking-wider mb-1">
              Description (Optional)
            </label>
            <textarea
              id="setlist-desc"
              rows={3}
              placeholder="Notes, venue details, or intended tuning..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-canvas border border-warm text-sm text-espresso focus:outline-none focus:border-terracotta resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-medium text-walnut hover:text-espresso hover:bg-canvas transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-terracotta text-white text-xs font-semibold hover:bg-terracotta/90 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
            >
              {isSubmitting ? 'Creating…' : 'Create Setlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
