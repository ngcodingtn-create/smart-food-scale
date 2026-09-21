'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  // Read whatever the inline boot script already decided, so the button label
  // matches the page on first paint instead of flipping.
  useEffect(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    try {
      localStorage.setItem('theme', next);
    } catch {
      // Private mode or blocked storage — the toggle still works for this page.
    }
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      className="rounded-md border border-[var(--rule)] px-2.5 py-1.5 text-sm text-[var(--ink-soft)] transition-colors hover:bg-[var(--paper-sunken)] hover:text-[var(--ink)]"
    >
      {/* Rendered only once mounted, so SSR and client markup agree. */}
      {theme === null ? <span className="inline-block w-4" /> : theme === 'dark' ? '☀' : '☾'}
    </button>
  );
}
