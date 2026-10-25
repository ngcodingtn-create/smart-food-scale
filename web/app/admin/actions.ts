'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_COOKIE, ADMIN_DAYS, adminConfigured, newSession, passwordMatches } from '@/lib/admin-auth';

export type SignInState = { error: string | null };

/** Only somewhere inside /admin: a sign-in link must not send anyone off the site. */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === 'string' ? value : '';
  return next.startsWith('/admin') && !next.startsWith('/admin/login') && !next.startsWith('//') ? next : '/admin/plan';
}

export async function signIn(_state: SignInState, form: FormData): Promise<SignInState> {
  if (!adminConfigured()) {
    return { error: 'No password is set on this server. Add SFS_ADMIN_PASSWORD to its environment, then restart it.' };
  }
  const attempt = form.get('password');
  if (typeof attempt !== 'string' || !passwordMatches(attempt)) {
    // Slows down guessing; a person typing it wrong barely notices.
    await new Promise((resolve) => setTimeout(resolve, 900));
    return { error: 'That is not the password.' };
  }
  (await cookies()).set(ADMIN_COOKIE, newSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/admin',
    maxAge: ADMIN_DAYS * 24 * 60 * 60,
  });
  redirect(safeNext(form.get('next')));
}

export async function signOut() {
  (await cookies()).delete({ name: ADMIN_COOKIE, path: '/admin' });
  redirect('/admin/login');
}
