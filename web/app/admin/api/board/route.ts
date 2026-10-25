import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { ADMIN_COOKIE, sessionValid } from '@/lib/admin-auth';
import { askBoard, boardReachable, isBoardAction } from '@/lib/board';

/**
 * GET /admin/api/board?do=i2c: one command to the NodeMCU on the laptop's USB, for the
 * live wiring page (see lib/board.ts). Behind the admin password; laptop only.
 */
export async function GET(request: NextRequest) {
  if (!sessionValid((await cookies()).get(ADMIN_COOKIE)?.value)) return Response.json({ error: 'sign in' }, { status: 401 });
  if (!boardReachable()) return Response.json({ error: 'The board is on the laptop: open this page on localhost.' }, { status: 503 });
  const action = request.nextUrl.searchParams.get('do');
  if (!isBoardAction(action)) return Response.json({ error: 'unknown command' }, { status: 400 });
  const result = await askBoard(action);
  return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
}
