import { cookies } from 'next/headers';
import { ADMIN_COOKIE, sessionValid } from '@/lib/admin-auth';
import { isProgressKey, progressWritable, readProgress, writeProgress } from '@/lib/progress-file';

/**
 * The owner's ticks, mirrored to web/data/progress.json (see lib/progress-file.ts).
 * GET returns every saved key; PUT { key, value } saves one. Behind the admin
 * password: proxy.ts checks, and so does this.
 */

async function signedIn() {
  return sessionValid((await cookies()).get(ADMIN_COOKIE)?.value);
}

export async function GET() {
  if (!(await signedIn())) return Response.json({ error: 'sign in' }, { status: 401 });
  const { updated, ...data } = await readProgress();
  return Response.json({ writable: progressWritable(), updated: updated ?? null, data }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PUT(request: Request) {
  if (!(await signedIn())) return Response.json({ error: 'sign in' }, { status: 401 });
  if (!progressWritable()) return Response.json({ error: 'read-only here: the browser keeps the ticks' }, { status: 503 });
  let body: { key?: unknown; value?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'not JSON' }, { status: 400 });
  }
  if (!isProgressKey(body.key)) return Response.json({ error: 'unknown key' }, { status: 400 });
  if (!body.value || typeof body.value !== 'object') return Response.json({ error: 'value must be an object' }, { status: 400 });
  try {
    await writeProgress(body.key, body.value);
  } catch {
    return Response.json({ error: 'could not write the file' }, { status: 500 });
  }
  return Response.json({ ok: true });
}
