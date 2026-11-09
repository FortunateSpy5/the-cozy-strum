import React, { useEffect, useState } from 'react';
import { Sun, Flame } from 'lucide-react';
import { saveUserPrefs } from '../../lib/storage/tabStorage';

export const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const darkActive = document.documentElement.classList.contains('dark');
    setIsDark(darkActive);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);

    if (nextDark) {
      document.documentElement.classList.add('dark');
      saveUserPrefs({ theme: 'campfire' });
    } else {
      document.documentElement.classList.remove('dark');
      saveUserPrefs({ theme: 'parchment' });
    }
  };

  if (!mounted) {
    return (
      <div className="w-11 h-11 rounded-full bg-surface border border-warm flex items-center justify-center opacity-0" />
    );
  }

  const label = isDark ? 'Switch to Parchment Light Mode' : 'Switch to Campfire Dark Mode';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] min-w-[44px] rounded-full bg-surface border border-warm hover:border-terracotta text-xs font-medium transition-colors shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2"
      title={label}
      aria-label={label}
      aria-pressed={isDark}
    >
      {isDark ? (
        <>
          <Flame className="w-4 h-4 text-amber-500 fill-amber-500/20" aria-hidden="true" />
          <span className="hidden sm:inline text-walnut dark:text-cream/80">Campfire</span>
        </>
      ) : (
        <>
          <Sun className="w-4 h-4 text-amber-600" aria-hidden="true" />
          <span className="hidden sm:inline text-walnut">Parchment</span>
        </>
      )}
    </button>
  );
};
