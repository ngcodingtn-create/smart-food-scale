'use client';

/**
 * The browser side of web/data/progress.json: the ticks are kept in this
 * browser's localStorage as before, and mirrored to the file on the laptop.
 *
 * On each page load, once per key, the file and this browser are merged and both
 * get the result, so a tick made in either is never lost. Where the file cannot
 * be written (production) or reached, everything stays in the browser, as it was.
 */

type Entries = Record<string, unknown>;
const isEntries = (value: unknown): value is Entries => !!value && typeof value === 'object' && !Array.isArray(value);

const join = (x: unknown[], y: unknown[]) => [...new Set([...x, ...y])].sort((p, q) => (typeof p === 'number' && typeof q === 'number' ? p - q : String(p).localeCompare(String(q))));

/** A list (the wires made) is joined. Per entry: lists of ticked checks are joined; otherwise the file's value, else the browser's. */
function merge(file: unknown, browser: unknown): Entries | unknown[] {
  if (Array.isArray(file) || Array.isArray(browser)) return join(Array.isArray(file) ? file : [], Array.isArray(browser) ? browser : []);
  const a = isEntries(file) ? file : {};
  const b = isEntries(browser) ? browser : {};
  const out: Entries = { ...b, ...a };
  for (const key of Object.keys(b)) {
    if (Array.isArray(a[key]) && Array.isArray(b[key])) {
      out[key] = join(a[key] as unknown[], b[key] as unknown[]);
    } else if (a[key] === false && b[key] === true) {
      out[key] = true;
    }
  }
  return out;
}

const URL = '/admin/api/progress';

type Remote = { writable: boolean; data: Record<string, unknown> } | null;

let remote: Promise<Remote> | null = null;
const fetchRemote = (): Promise<Remote> =>
  (remote ??= fetch(URL, { cache: 'no-store' })
    .then((response) => (response.ok ? (response.json() as Promise<Remote>) : null))
    .catch(() => null));

const synced = new Map<string, Promise<void>>();

/** Brings this browser's copy of `key` in line with the file. Resolves when done; never throws. */
export function syncWithFile(key: string): Promise<void> {
  let run = synced.get(key);
  if (!run) {
    run = fetchRemote().then((found) => {
      if (!found?.writable) return;
      const saved = found.data[key];
      try {
        const local = JSON.parse(localStorage.getItem(key) ?? 'null');
        const merged = merge(saved, local);
        localStorage.setItem(key, JSON.stringify(merged));
        if (JSON.stringify(merged) !== JSON.stringify(saved ?? (Array.isArray(merged) ? [] : {}))) saveToFile(key, merged);
      } catch {
        // No storage in this browser: the page keeps what it has in memory.
      }
    });
    synced.set(key, run);
  }
  return run;
}

/** Saves `value` under `key` in the file. Fire and forget: the browser already has it. */
export function saveToFile(key: string, value: unknown) {
  const body = JSON.stringify({ key, value });
  fetchRemote().then((found) => {
    if (!found?.writable) return;
    fetch(URL, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {
      // The laptop's server is not reachable: the tick is still in this browser.
    });
  });
}
