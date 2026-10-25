import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Icon } from '@/components/icons';
import { ADMIN_COOKIE, adminConfigured, sessionValid } from '@/lib/admin-auth';
import { LoginForm } from './LoginForm';
import '@/components/admin/admin.css';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
};

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const target = next && next.startsWith('/admin') && !next.startsWith('//') ? next : '/admin/plan';
  // Already signed in: straight through.
  if (sessionValid((await cookies()).get(ADMIN_COOKIE)?.value)) redirect(target);

  return (
    <main id="content" className="admin-login">
      <div className="admin-login-card">
        <p className="admin-login-mark" aria-hidden="true">
          <Icon name="lock" size={22} />
        </p>
        <h1>Builder’s area</h1>
        <p className="admin-login-lede">The plan, the build and the tools for making the Smart Food Scale. Not part of the public site.</p>
        {adminConfigured() ? (
          <LoginForm next={target} />
        ) : (
          <p className="admin-login-error" role="alert">
            Locked: no password is set on this server. Add <code>SFS_ADMIN_PASSWORD</code> to its environment, then restart it.
          </p>
        )}
        <Link href="/" className="admin-login-back">
          Back to the public site
        </Link>
      </div>
    </main>
  );
}
