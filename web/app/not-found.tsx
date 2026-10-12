import Link from 'next/link';
import { Icon } from '@/components/icons';

export const metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <>
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
    </>
  );
}
