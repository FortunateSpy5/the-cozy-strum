import React from 'react';
import { Compass, ListMusic, PlusCircle, ClipboardPaste, ArrowRight } from 'lucide-react';

const HUBS = [
  {
    href: '/explore',
    icon: Compass,
    title: 'Song Directory',
    desc: 'Browse all 243 acoustic and ukulele songs with A–Z sorting.',
    badge: '243 Tracks',
  },
  {
    href: '/setlists',
    icon: ListMusic,
    title: 'Setlists Studio',
    desc: 'Curate your favorite songs into gig sets with 2-column Stage View.',
    badge: 'Gig Ready',
  },
  {
    href: '/submit',
    icon: PlusCircle,
    title: 'Community Submission',
    desc: 'Publish acoustic tabs with LRCLIB lyrics & chord placement.',
    badge: 'Studio',
  },
  {
    href: '/import',
    icon: ClipboardPaste,
    title: 'Quick Paste Studio',
    desc: 'Paste any ASCII tab for instant chord detection and auto-scroll.',
    badge: 'Offline',
  },
];

export function PracticeHubCards(): React.JSX.Element {
  return (
    <section aria-labelledby="hub-heading" className="space-y-4 pt-4">
      <h2 id="hub-heading" className="font-serif text-lg font-bold text-espresso">
        Sanctuary Features
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {HUBS.map((hub) => {
          const Icon = hub.icon;
          return (
            <a
              key={hub.href}
              href={hub.href}
              className="group p-5 rounded-2xl bg-surface border border-warm hover:border-terracotta hover:shadow-md transition-all flex items-start gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-canvas border border-warm flex items-center justify-center text-terracotta shrink-0 group-hover:scale-105 transition-transform">
                <Icon className="w-5 h-5" aria-hidden="true" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-serif text-base font-bold text-espresso group-hover:text-terracotta transition-colors">
                    {hub.title}
                  </h3>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-canvas border border-warm text-walnut shrink-0">
                    {hub.badge}
                  </span>
                </div>
                <p className="text-xs text-walnut leading-relaxed">{hub.desc}</p>
                <div className="mt-2 text-xs font-semibold text-terracotta inline-flex items-center gap-1 group-hover:underline">
                  <span>Open</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
