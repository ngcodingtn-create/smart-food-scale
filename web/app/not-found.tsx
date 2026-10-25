import Link from 'next/link';
import { Icon } from '@/components/icons';
import { SiteShell } from '@/components/SiteShell';

export const metadata = { title: 'Page not found' };

// Rendered under the root layout alone, so it brings the site's frame itself.
export default function NotFound() {
  return (
    <SiteShell>
      <p className="lost-readout" aria-hidden="true">
        0.0 g <small>nothing on the scale</small>
      </p>
      <h1>Page not found</h1>
      <p>
        That page isn&apos;t here. The project is mid-build, so a link may point at
        something not written yet.
      </p>
      <p>
        The <Link href="/deliverables">status board</Link> lists what exists and what
        doesn&apos;t. Otherwise, try the sidebar.
      </p>
      <p>
        <Link href="/" className="btn btn-primary">
          Back to the overview
          <Icon name="arrow-right" size={16} />
        </Link>
      </p>
    </SiteShell>
  );
}
