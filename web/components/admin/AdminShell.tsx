'use client';

import Link from 'next/link';
import { signOut } from '@/app/admin/actions';
import { Icon } from '@/components/icons';
import { MobileBar, Sidebar, type SidebarParts } from '@/components/Sidebar';
import { ThemeSwitch } from '@/components/ThemeToggle';
import { ADMIN_NAV } from '@/lib/admin-nav';
import { MilestoneBadge } from './build/Stepper';
import './admin.css';

function AdminBrand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link href="/admin/plan" className="admin-brand" onClick={onNavigate}>
      <span className="admin-brand-mark" aria-hidden="true">
        <Icon name="scale" size={18} />
      </span>
      <span className="admin-brand-text">
        <strong>Smart Food Scale</strong>
        <span className="admin-badge">
          <Icon name="lock" size={11} />
          Builder
        </span>
      </span>
    </Link>
  );
}

function AdminFoot() {
  return (
    <div className="sidebar-foot">
      <form action={signOut}>
        <button type="submit" className="admin-signout">
          <Icon name="logout" size={15} />
          Sign out
        </button>
      </form>
      <ThemeSwitch />
    </div>
  );
}

const PARTS: SidebarParts = {
  groups: ADMIN_NAV,
  label: 'Builder’s area',
  head: (onNavigate) => <AdminBrand onNavigate={onNavigate} />,
  foot: <AdminFoot />,
  extra: (item) => (item.href.startsWith('/admin/build/') ? <MilestoneBadge href={item.href} /> : null),
};

/** The frame of /admin: its own sidebar, the same look as the public site. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <Sidebar {...PARTS} />
      <div className="shell-main">
        <MobileBar {...PARTS} />
        <main id="content" tabIndex={-1} className="admin-main outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
