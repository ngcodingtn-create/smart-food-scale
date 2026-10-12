'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { findPage } from '@/lib/nav';

/**
 * Where this page sits, above its title. It matters most for the pages that
 * are not in the sidebar, and on a phone, where the sidebar is out of sight.
 */
export function Breadcrumb() {
  const pathname = usePathname();
  const page = findPage(pathname);

  // The overview has its own masthead; an unknown path is the 404 page.
  if (!page || pathname === '/') return null;

  const { group } = page;
  const linkGroup = group.href && group.href !== pathname;

  return (
    <nav aria-label="Breadcrumb">
      <ol className="crumbs label">
        <li>
          <Link href="/">Overview</Link>
        </li>
        <li>{linkGroup ? <Link href={group.href!}>{group.label}</Link> : group.label}</li>
      </ol>
    </nav>
  );
}
