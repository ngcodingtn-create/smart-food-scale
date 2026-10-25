import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE, sessionValid } from '@/lib/admin-auth';

/**
 * Keeps /admin behind its password. Everything under /admin except the sign-in
 * page needs a valid session cookie; without one, the visitor is sent to
 * sign in and brought back afterwards. The admin layout checks again.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === '/admin/login') return NextResponse.next();

  if (!sessionValid(request.cookies.get(ADMIN_COOKIE)?.value)) {
    const login = new URL('/admin/login', request.url);
    login.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
