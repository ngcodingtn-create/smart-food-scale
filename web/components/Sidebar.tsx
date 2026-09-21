'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NAV } from '@/lib/nav';

const BADGE_TONE: Record<string, string> = {
  done: 'text-emerald-700 dark:text-emerald-400 border-emerald-600/25 bg-emerald-600/8',
  wip: 'text-amber-700 dark:text-amber-400 border-amber-600/25 bg-amber-600/8',
  todo: 'text-slate-600 dark:text-slate-400 border-slate-500/25 bg-slate-500/8',
  alert: 'text-rose-700 dark:text-rose-400 border-rose-600/25 bg-rose-600/8',
};

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Documentation">
      {NAV.map((group) => (
        <div key={group.label} className="mb-6">
          <h2 className="mb-2 px-3 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
            {group.label}
          </h2>
          <ul className="space-y-px">
            {group.items.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={[
                      'flex items-center justify-between gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
                      active
                        ? 'bg-[var(--accent-soft)] font-semibold text-[var(--accent-ink)]'
                        : 'text-[var(--ink-soft)] hover:bg-[var(--paper-sunken)] hover:text-[var(--ink)]',
                    ].join(' ')}
                  >
                    <span>{item.label}</span>
                    {item.badge ? (
                      <span
                        className={`shrink-0 rounded border px-1.5 py-px text-[0.62rem] font-semibold uppercase tracking-wide ${
                          BADGE_TONE[item.badge.tone]
                        }`}
                      >
                        {item.badge.text}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function Sidebar() {
  return (
    <aside className="scrollbar-slim sticky top-16 hidden h-[calc(100dvh-4rem)] w-64 shrink-0 overflow-y-auto border-r border-[var(--rule)] py-8 pr-2 lg:block">
      <NavList />
    </aside>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer on navigation, and lock scroll while it is open.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Close navigation' : 'Open navigation'}
        className="rounded-md border border-[var(--rule)] px-2.5 py-1.5 text-sm text-[var(--ink-soft)] hover:bg-[var(--paper-sunken)] lg:hidden"
      >
        {open ? '✕' : '☰'}
      </button>

      {open ? (
        <div className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto border-t border-[var(--rule)] bg-[var(--paper)] px-4 py-6 lg:hidden">
          <NavList onNavigate={() => setOpen(false)} />
        </div>
      ) : null}
    </>
  );
}
