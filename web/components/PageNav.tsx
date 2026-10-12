'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/icons';
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
    <nav aria-label="Previous and next page" className="pagenav">
      {previous ? (
        <Link href={previous.href} data-dir="previous">
          <span className="pagenav-dir label">
            <Icon name="arrow-left" size={13} />
            Previous
          </span>
          <span className="pagenav-title">{previous.label}</span>
        </Link>
      ) : null}

      {next ? (
        <Link href={next.href} data-dir="next">
          <span className="pagenav-dir label">
            Next
            <Icon name="arrow-right" size={13} />
          </span>
          <span className="pagenav-title">{next.label}</span>
        </Link>
      ) : null}
    </nav>
  );
}
