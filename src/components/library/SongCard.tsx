import React from 'react';
import { Guitar, Music, Download, Trash2, Gauge, Heart } from 'lucide-react';
import type { TabItem } from '../../lib/types';
import { generateMarkdownWithFrontmatter, downloadMarkdownFile } from '../../lib/storage/exportMd';

interface SongCardProps {
  tab: TabItem;
  isFavorited?: boolean;
  onToggleFavorite?: (id: string) => void;
  onDeleteCustom?: (id: string) => void;
}

export const SongCard = React.memo<SongCardProps>(function SongCard({
  tab,
  isFavorited = false,
  onToggleFavorite,
  onDeleteCustom,
}) {
  const isGuitar = tab.instrument === 'guitar';
  const tabUrl = tab.isCustom
    ? `/player?slug=${encodeURIComponent(tab.slug)}${tab.id ? `&id=${encodeURIComponent(tab.id)}` : ''}`
    : `/tab?id=${encodeURIComponent(tab.id || tab.slug)}`;

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (tab.content) {
      const md = generateMarkdownWithFrontmatter(tab, tab.content);
      downloadMarkdownFile(`${tab.slug}.md`, md);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Remove "${tab.title}" from browser library?`) && onDeleteCustom) {
      onDeleteCustom(tab.id ?? tab.slug);
    }
  };

  return (
    <article
      className="group flex flex-col justify-between p-5 rounded-2xl bg-surface border border-warm hover:border-terracotta hover:shadow-md transition-[border-color,box-shadow] relative overflow-hidden focus-within:ring-2 focus-within:ring-terracotta"
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isGuitar
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
            }`}
          >
            {isGuitar ? (
              <Guitar className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <Music className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            {isGuitar ? 'Guitar' : 'Ukulele'}
          </span>

          <div className="flex items-center gap-1.5">
            {tab.isCustom && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-terracotta/10 text-terracotta border border-terracotta/20">
                Custom
              </span>
            )}
            <span className="text-[11px] font-mono text-walnut uppercase px-2 py-0.5 rounded bg-canvas border border-warm">
              {tab.difficulty}
            </span>
            {onToggleFavorite && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleFavorite(tab.id ?? tab.slug);
                }}
                className="relative z-10 p-1 rounded-lg text-walnut/60 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                aria-label={`${isFavorited ? 'Remove from' : 'Add to'} favorites: ${tab.title}`}
              >
                <Heart
                  className={`w-3.5 h-3.5 ${
                    isFavorited ? 'fill-current text-rose-600 dark:text-rose-400' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>
            )}
          </div>
        </div>

        {/* Title & Artist */}
        <h3 className="font-serif text-lg font-bold text-espresso group-hover:text-terracotta transition-colors line-clamp-1">
          <a
            href={tabUrl}
            className="focus-visible:outline-none after:absolute after:inset-0 after:z-0"
            aria-label={`${tab.title} by ${tab.artist}, ${isGuitar ? 'guitar' : 'ukulele'} tab`}
          >
            {tab.title}
          </a>
        </h3>
        <p className="text-sm text-walnut font-medium line-clamp-1 mb-2.5 flex items-center gap-1.5">
          <span>{tab.artist}</span>
          {tab.releaseYear && <span className="text-xs text-walnut/70">({tab.releaseYear})</span>}
        </p>

        {tab.categories && tab.categories.length > 0 ? (
          <div className="flex flex-wrap gap-1 mb-3">
            {tab.categories.slice(0, 2).map((cat) => (
              <span key={cat} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-terracotta/10 text-terracotta border border-terracotta/20">
                {cat}
              </span>
            ))}
          </div>
        ) : tab.category ? (
          <p className="text-xs text-terracotta/90 font-medium mb-3">
            {tab.category}
          </p>
        ) : null}

        {/* Technical specs pill row */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-walnut/90 font-mono">
          {tab.capo > 0 && (
            <span className="px-2 py-0.5 rounded bg-canvas border border-warm">
              Capo {tab.capo}
            </span>
          )}
          {tab.bpm && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-canvas border border-warm">
              <Gauge className="w-3 h-3" aria-hidden="true" />
              {tab.bpm} BPM
            </span>
          )}
          {tab.isFingerstyle && (
            <span className="px-2 py-0.5 rounded bg-canvas border border-warm text-terracotta">
              Fingerstyle
            </span>
          )}
        </div>
      </div>

      {/* Footer / Custom Tab Actions */}
      <div className="mt-4 pt-3 border-t border-warm flex items-center justify-between text-xs text-walnut">
        <span className="truncate max-w-[150px]">{tab.tuning}</span>
        {tab.isCustom && (
          <div className="flex items-center gap-1 relative z-10">
            <button
              onClick={handleDownload}
              type="button"
              title={`Download ${tab.title} markdown`}
              aria-label={`Download ${tab.title} markdown for Git collection`}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-canvas hover:text-terracotta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta transition-colors"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              onClick={handleDelete}
              type="button"
              title={`Delete ${tab.title} from browser library`}
              aria-label={`Delete ${tab.title} from browser library`}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </article>
  );
});
