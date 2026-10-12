import Link from 'next/link';
import { Icon } from '@/components/icons';

/** The mark and wordmark, linking home. Shared by the sidebar, top bar and drawer. */
export function Brand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link href="/" className="brand" onClick={onNavigate}>
      <span className="brand-mark">
        <Icon name="scale" size={20} strokeWidth={2} />
      </span>
      <span className="brand-text">
        <span className="brand-name">Smart Food Scale</span>
        <span className="brand-sub">IoT kitchen scale</span>
      </span>
    </Link>
  );
}
