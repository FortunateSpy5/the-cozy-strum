import React from 'react';
import { Inbox, FileText, Database } from 'lucide-react';

export type AdminTab = 'submissions' | 'dmca' | 'catalog';

interface AdminNavTabsProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  pendingCount: number;
  openDmcaCount: number;
}

export function AdminNavTabs({
  activeTab,
  onSelectTab,
  pendingCount,
  openDmcaCount,
}: AdminNavTabsProps): React.JSX.Element {
  const tabs = [
    {
      id: 'submissions' as const,
      label: 'Submissions',
      icon: Inbox,
      count: pendingCount,
      badgeBg: 'bg-white text-terracotta',
    },
    {
      id: 'dmca' as const,
      label: 'DMCA Claims',
      icon: FileText,
      count: openDmcaCount,
      badgeBg: 'bg-rose-600 text-white',
    },
    {
      id: 'catalog' as const,
      label: 'Catalog & Tools',
      icon: Database,
      count: 0,
      badgeBg: '',
    },
  ];

  return (
    <div
      role="tablist"
      aria-label="Moderation console sections"
      className="flex gap-2 border-b border-warm/80 overflow-x-auto pb-1"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta ${
              isActive
                ? 'bg-terracotta text-white shadow-xs'
                : 'text-walnut hover:text-espresso hover:bg-canvas'
            }`}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-black ${tab.badgeBg}`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
