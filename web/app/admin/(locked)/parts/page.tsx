import type { Metadata } from 'next';
import Link from 'next/link';
import { Kit, KitCounts } from '@/components/workbench/KitCards';
import { KIT, type KitStatus } from '@/components/workbench/kit';

export const metadata: Metadata = { title: 'Our parts' };

// The filter tabs, in the order a builder cares about them. Each is a link, so
// a filtered view has its own address and the page stays a server page.
const FILTERS: { status?: KitStatus; label: string }[] = [
  { label: 'All' },
  { status: 'check', label: 'To check' },
  { status: 'buy', label: 'To buy' },
  { status: 'have', label: 'In hand' },
  { status: 'skip', label: 'Not needed' },
];

const isStatus = (value: string | undefined): value is KitStatus =>
  FILTERS.some((filter) => filter.status === value);

export default async function OurParts({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: asked } = await searchParams;
  const status = isStatus(asked) ? asked : undefined;

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <p className="label">Build · the parts in hand</p>
        <h1>Our parts</h1>
        <p className="admin-page-lede">
          Every part from the lab’s form and what the build adds, with a drawing, a photo of the real one, what it does and where it
          goes. The list lives in <code>web/components/workbench/kit.ts</code>.
        </p>
      </header>

      {/* The counts and the cards are styled for the site's article; .prose gives them that frame. */}
      <div className="prose">
        <KitCounts />
      </div>

      <nav className="admin-tabs" aria-label="Show parts by status">
        {FILTERS.map((filter) => {
          const count = filter.status ? KIT.filter((item) => item.status === filter.status).length : KIT.length;
          if (filter.status && count === 0) return null;
          const href = filter.status ? `/admin/parts?status=${filter.status}` : '/admin/parts';
          const current = filter.status === status;
          return (
            <Link key={filter.label} href={href} className="admin-tab" aria-current={current ? 'page' : undefined} scroll={false}>
              {filter.label}
              <span>{count}</span>
            </Link>
          );
        })}
      </nav>

      <div className="prose">
        <Kit status={status} />
      </div>
    </div>
  );
}
