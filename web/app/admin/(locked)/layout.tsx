import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { ADMIN_COOKIE, sessionValid } from '@/lib/admin-auth';

export const metadata: Metadata = {
  title: { default: 'Builder’s area', template: '%s · Builder · Smart Food Scale' },
  robots: { index: false, follow: false },
};

/** Every page behind the password. proxy.ts checks first; this checks again. */
export default async function LockedLayout({ children }: { children: React.ReactNode }) {
  if (!sessionValid((await cookies()).get(ADMIN_COOKIE)?.value)) redirect('/admin/login');
  return <AdminShell>{children}</AdminShell>;
}
