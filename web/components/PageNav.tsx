'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FLAT_NAV } from '@/lib/nav';

/** Previous / next links in sidebar order, at the foot of every page. */
export function PageNav() {
  const pathname = usePathname();
  const index = FLAT_NAV.findIndex((item) => item.href === pathname);

  if (index === -1) return null;

  const previous = index > 0 ? FLAT_NAV[index - 1] : null;
  const next = index < FLAT_NAV.length - 1 ? FLAT_NAV[index + 1] : null;

  if (!previous && !next) return null;

  return (
    <nav
      aria-label="Previous and next page"
      className="mt-16 grid gap-3 border-t border-[var(--rule)] pt-6 sm:grid-cols-2"
    >
      {previous ? (
        <Link
          href={previous.href}
          className="group rounded-lg border border-[var(--rule)] px-4 py-3 transition-colors hover:border-[var(--accent)]"
        >
          <span className="block text-xs text-[var(--ink-faint)]">← Previous</span>
          <span className="block text-sm font-medium text-[var(--ink)] group-hover:text-[var(--accent-ink)]">
            {previous.label}
          </span>
        </Link>
      ) : (
        <span />
      )}

      {next ? (
        <Link
          href={next.href}
          className="group rounded-lg border border-[var(--rule)] px-4 py-3 text-right transition-colors hover:border-[var(--accent)] sm:col-start-2"
        >
          <span className="block text-xs text-[var(--ink-faint)]">Next →</span>
          <span className="block text-sm font-medium text-[var(--ink)] group-hover:text-[var(--accent-ink)]">
            {next.label}
          </span>
        </Link>
      ) : null}
    </nav>
  );
}
