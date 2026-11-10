import React from 'react';
import type { ParsedLine } from '../../lib/types';
import { Bookmark } from 'lucide-react';

interface SectionJumpBarProps {
  lines: ParsedLine[];
  wrap?: boolean;
}

export function SectionJumpBar({ lines, wrap = false }: SectionJumpBarProps): React.JSX.Element | null {
  const sections = React.useMemo(() => {
    const list: Array<{ text: string; uniqueId: string; key: string }> = [];
    lines.forEach((line, lineIndex) => {
      if (line.type === 'section-header') {
        const text = line.text.replace(/^\[|\]$/g, '').trim();
        const baseSlug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
        const uniqueId = `section-${lineIndex}-${baseSlug}`;
        list.push({ text, uniqueId, key: uniqueId });
      }
    });
    return list;
  }, [lines]);

  if (sections.length < 2) return null;

  const handleJump = (uniqueId: string) => {
    const el = document.getElementById(uniqueId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav
      aria-label="Song sections navigation"
      className={
        wrap
          ? 'flex flex-wrap items-center gap-1.5 py-2 px-1 mb-3 text-xs'
          : 'flex items-center gap-1.5 overflow-x-auto py-2 px-1 mb-4 scrollbar-thin text-xs'
      }
    >
      <div className="flex items-center gap-1 text-walnut font-medium shrink-0 pr-1 text-xs font-mono">
        <Bookmark className="w-3.5 h-3.5 text-terracotta" aria-hidden="true" />
        <span className={wrap ? 'inline' : 'hidden sm:inline'}>Jump:</span>
      </div>
      <div className={wrap ? 'flex flex-wrap items-center gap-1.5' : 'flex items-center gap-1.5 shrink-0'}>
        {sections.map((sec) => (
          <button
            key={sec.key}
            type="button"
            onClick={() => handleJump(sec.uniqueId)}
            aria-label={`Jump to ${sec.text} section`}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-surface border border-warm hover:border-terracotta hover:text-terracotta text-espresso text-xs font-mono transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
          >
            {sec.text}
          </button>
        ))}
      </div>
    </nav>
  );
}
