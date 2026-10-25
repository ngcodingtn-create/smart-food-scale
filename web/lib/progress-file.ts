import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * The owner's ticks in /admin, kept in a JSON file on the laptop as well as in
 * the browser, so they survive a closed tab, a cleared browser or another
 * browser on the same laptop, and the next Claude session can read them.
 *
 * The file is `web/data/progress.json`, one entry per browser storage key. Only
 * the laptop's own server writes it: Vercel's file system is read-only, so in
 * production the page keeps using the browser alone.
 */

export const PROGRESS_FILE = path.join(process.cwd(), 'data', 'progress.json');

/** The browser keys that are mirrored to the file. Anything else is refused. */
export const PROGRESS_KEYS = ['sfs-build-checks-v1', 'sfs-admin-plan-ticks', 'sfs-wired-v1'] as const;
export type ProgressKey = (typeof PROGRESS_KEYS)[number];

export const isProgressKey = (key: unknown): key is ProgressKey => PROGRESS_KEYS.includes(key as ProgressKey);

/** False on Vercel, where nothing written would last. */
export const progressWritable = () => !process.env.VERCEL;

type ProgressFile = { updated?: string } & Partial<Record<ProgressKey, unknown>>;

export async function readProgress(): Promise<ProgressFile> {
  try {
    const value = JSON.parse(await fs.readFile(PROGRESS_FILE, 'utf8'));
    return value && typeof value === 'object' ? (value as ProgressFile) : {};
  } catch {
    return {};
  }
}

// One write at a time, so two quick ticks cannot interleave and lose one.
let queue: Promise<unknown> = Promise.resolve();

export function writeProgress(key: ProgressKey, value: unknown): Promise<void> {
  const run = queue.then(async () => {
    const next: ProgressFile = { ...(await readProgress()), [key]: value, updated: new Date().toISOString() };
    await fs.mkdir(path.dirname(PROGRESS_FILE), { recursive: true });
    // Written beside it, then renamed over it: a crash mid-write leaves the old file whole.
    const temporary = `${PROGRESS_FILE}.tmp`;
    await fs.writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
    await fs.rename(temporary, PROGRESS_FILE);
  });
  queue = run.catch(() => undefined);
  return run;
}
