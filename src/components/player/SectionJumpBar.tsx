import React from 'react';
import type { ParsedLine } from '../../lib/types';
import { Bookmark } from 'lucide-react';

interface SectionJumpBarProps {
  lines: ParsedLine[];
}

export function SectionJumpBar({ lines }: SectionJumpBarProps): React.JSX.Element | null {
  const sections = React.useMemo(() => {
    return lines
      .map((line, lineIndex) => ({ line, lineIndex }))
      .filter((item) => item.line.type === 'section-header')
      .map(({ line, lineIndex }) => {
        const text = line.text.replace(/^\[|\]$/g, '').trim();
        const baseSlug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
        const uniqueId = `section-${lineIndex}-${baseSlug}`;
        return { text, uniqueId, key: uniqueId };
      });
  }, [lines]);

  if (sections.length < 2) return null;

  const handleJump = (uniqueId: string) => {
    const el = document.getElementById(uniqueId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div
      role="navigation"
      aria-label="Song sections quick jump"
      className="flex items-center gap-1.5 overflow-x-auto py-2 px-1 mb-4 scrollbar-thin text-xs"
    >
      <div className="flex items-center gap-1 text-walnut/70 shrink-0 pr-1 text-[11px] font-mono">
        <Bookmark className="w-3.5 h-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Jump:</span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {sections.map((sec) => (
          <button
            key={sec.key}
            type="button"
            onClick={() => handleJump(sec.uniqueId)}
            className="min-h-[36px] px-2.5 py-1 rounded-lg bg-surface border border-warm/80 hover:border-terracotta hover:text-terracotta text-espresso text-[11px] font-mono transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
          >
            {sec.text}
          </button>
        ))}
      </div>
    </div>
  );
}
