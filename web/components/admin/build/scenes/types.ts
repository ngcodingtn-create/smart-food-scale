import type { ReactNode } from 'react';

/** One line of the caption under a scene, from `at` seconds. */
export type Beat = { at: number; text: string; who?: 'you' | 'claude' };

export type SceneDef = {
  /** Length of one loop, in seconds. */
  T: number;
  beats: Beat[];
  draw: (t: number) => ReactNode;
  /** SVG viewBox, if not the desk's. */
  view?: string;
  /** A moving view: the viewBox at time t, to follow the action. */
  camera?: (t: number) => Box;
};

export type Box = [number, number, number, number];
export const DESK_BOX: Box = [-115, -85, 300, 238];
export const DESK_VIEW = DESK_BOX.join(' ');
/** The laptop, the NodeMCU and the breadboard together. */
export const BENCH_BOX: Box = [-95, -78, 384, 305];

/** A camera that eases between boxes: [time, box] pairs in order. */
export function pan(keys: [number, Box][]) {
  return (t: number): Box => {
    let i = 0;
    while (i < keys.length - 1 && t >= keys[i + 1][0]) i++;
    const [t0, a] = keys[i];
    const next = keys[i + 1];
    if (!next) return a;
    const [t1, b] = next;
    const span = Math.min(0.9, t1 - t0);
    const raw = Math.min(1, Math.max(0, (t - (t1 - span)) / span));
    const p = raw < 0.5 ? 2 * raw * raw : 1 - (-2 * raw + 2) ** 2 / 2;
    return a.map((v, j) => v + (b[j] - v) * p) as Box;
  };
}
