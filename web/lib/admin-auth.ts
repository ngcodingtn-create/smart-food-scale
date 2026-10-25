import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * The password on /admin, the builder's area.
 *
 * The password is never in the code: it is `SFS_ADMIN_PASSWORD`, in
 * `web/.env.local` on the laptop (git ignores it) and in the Vercel project's
 * environment variables in production. With none set, /admin stays locked for
 * everyone, rather than open.
 *
 * Signing in sets a cookie holding an expiry time and an HMAC of it, keyed by
 * the password: nothing a visitor can forge without the password, and changing
 * the password signs everyone out. Checked by proxy.ts before any /admin page
 * renders, and again by the admin layout.
 */

export const ADMIN_COOKIE = 'sfs_admin';
export const ADMIN_DAYS = 7;

function password(): string | null {
  const value = process.env.SFS_ADMIN_PASSWORD;
  return value && value.length > 0 ? value : null;
}

export function adminConfigured(): boolean {
  return password() !== null;
}

function sign(expires: number, key: string): string {
  return createHmac('sha256', key).update(`sfs-admin-v1.${expires}`).digest('hex');
}

/** Same length and same content, compared in constant time. */
function same(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** True when `attempt` is the password. Compared through HMACs so the length does not leak. */
export function passwordMatches(attempt: string): boolean {
  const key = password();
  if (!key) return false;
  const digest = (text: string) => createHmac('sha256', 'sfs-admin-compare').update(text).digest('hex');
  return same(digest(attempt), digest(key));
}

/** A fresh cookie value, valid for ADMIN_DAYS. */
export function newSession(now = Date.now()): string {
  const key = password();
  if (!key) throw new Error('SFS_ADMIN_PASSWORD is not set.');
  const expires = now + ADMIN_DAYS * 24 * 60 * 60 * 1000;
  return `${expires}.${sign(expires, key)}`;
}

/** True for a cookie value this server signed, with the current password, not yet expired. */
export function sessionValid(value: string | undefined, now = Date.now()): boolean {
  const key = password();
  if (!key || !value) return false;
  const [expiresText, signature] = value.split('.');
  const expires = Number(expiresText);
  if (!Number.isFinite(expires) || expires < now || !signature) return false;
  return same(signature, sign(expires, key));
}
