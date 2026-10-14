/**
 * Reading Node A's serial line, and the arithmetic of calibration.
 *
 * The line format is the firmware's (firmware/node-a-scale/README.md):
 *   R raw=<counts> net=<counts> g=<grams> stable=<0|1>     every reading
 *   E <event> key=value ...                                 everything else
 * No imports, so it can be checked from Node directly.
 */

export type Reading = { raw: number; net: number; grams: number | null; stable: boolean };
export type Event = { name: string; fields: Record<string, string>; text: string };
export type Line = { kind: 'reading'; reading: Reading } | { kind: 'event'; event: Event } | { kind: 'other'; text: string };

function fields(words: string[]) {
  const out: Record<string, string> = {};
  for (const word of words) {
    const at = word.indexOf('=');
    if (at > 0) out[word.slice(0, at)] = word.slice(at + 1);
  }
  return out;
}

export function parseLine(text: string): Line {
  const words = text.trim().split(/\s+/);
  if (words[0] === 'R') {
    const f = fields(words.slice(1));
    const raw = Number(f.raw);
    const net = Number(f.net);
    if (Number.isFinite(raw) && Number.isFinite(net)) {
      const grams = Number(f.g);
      return { kind: 'reading', reading: { raw, net, grams: Number.isFinite(grams) ? grams : null, stable: f.stable === '1' } };
    }
  }
  if (words[0] === 'E' && words.length > 1) {
    return { kind: 'event', event: { name: words[1], fields: fields(words.slice(2)), text: words.slice(1).join(' ') } };
  }
  return { kind: 'other', text };
}

export function median(values: number[]) {
  if (!values.length) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = sorted.length >> 1;
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/** One calibration point: a known mass, and the counts the scale gave for it after tare. */
export type Point = { grams: number; counts: number };

/**
 * A straight line through zero: counts = slope × grams. Through zero because the
 * scale is tared first, so no load means no counts. Least squares:
 * slope = Σ(g·c) / Σ(g²). For each point, also what the fitted scale would show,
 * and how far that is from the true mass.
 */
export function fitThroughZero(points: Point[]) {
  const usable = points.filter((point) => point.grams > 0);
  if (usable.length < 2) return null;
  const slope = usable.reduce((sum, p) => sum + p.grams * p.counts, 0) / usable.reduce((sum, p) => sum + p.grams * p.grams, 0);
  const rows = usable.map((point) => {
    const shown = point.counts / slope;
    return { ...point, shown, error: shown - point.grams };
  });
  const worst = Math.max(...rows.map((row) => Math.abs(row.error)));
  return { slope, rows, worst };
}
