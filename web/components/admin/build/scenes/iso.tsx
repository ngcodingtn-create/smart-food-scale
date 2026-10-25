/**
 * A small isometric kit for the step scenes: a projection, solid blocks,
 * cylinders, and transforms that put flat drawings on a block's faces.
 *
 * World: x runs right-down, y runs left-down, z up. Faces at larger x and y
 * face the viewer, so draw things in order of x + y, back to front.
 */
import type { ReactNode } from 'react';

export const C = Math.cos(Math.PI / 6);
export const S = 0.5;
export type V = [number, number];

export const P = (x: number, y: number, z = 0): V => [(x - y) * C, (x + y) * S - z];
const pts = (...v: V[]) => v.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' ');

/** Three tones per material: the top, the face towards the left, the face towards the right. */
export type Mat = { top: string; left: string; right: string };
export const MAT = {
  desk: { top: '#c8a57a', left: '#a7845b', right: '#8f714e' },
  board: { top: '#22303f', left: '#16202b', right: '#111922' },
  black: { top: '#2b2d30', left: '#1c1e20', right: '#151618' },
  blue: { top: '#2459b3', left: '#1b4590', right: '#163a78' },
  green: { top: '#1e7a4c', left: '#175f3b', right: '#134f31' },
  white: { top: '#f3f1ea', left: '#d9d6cc', right: '#c5c2b7' },
  silver: { top: '#d3d7da', left: '#adb3b8', right: '#979ea4' },
  alu: { top: '#dde1e4', left: '#bcc2c7', right: '#a7adb2' },
  laptop: { top: '#454b53', left: '#33383e', right: '#2a2e33' },
  phone: { top: '#2f3237', left: '#222428', right: '#1b1d20' },
  wood: { top: '#e2c9a0', left: '#c6aa7e', right: '#b09369' },
  copper: { top: '#e08a4f', left: '#c0703c', right: '#a85f31' },
  food: { top: '#d9923f', left: '#b87530', right: '#a06528' },
} satisfies Record<string, Mat>;

export function Slab({ x, y, z = 0, w, d, h, m, opacity }: { x: number; y: number; z?: number; w: number; d: number; h: number; m: Mat; opacity?: number }) {
  return (
    <g opacity={opacity}>
      <polygon points={pts(P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h))} fill={m.left} />
      <polygon points={pts(P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h))} fill={m.right} />
      <polygon points={pts(P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h))} fill={m.top} />
    </g>
  );
}

/** An upright cylinder standing on (x, y, z). */
export function Cyl({ x, y, z = 0, r, h, m, opacity }: { x: number; y: number; z?: number; r: number; h: number; m: Mat; opacity?: number }) {
  const [cx, cy] = P(x, y, z);
  const rx = r * C * Math.SQRT2;
  const ry = r * S * Math.SQRT2;
  const top = cy - h;
  return (
    <g opacity={opacity}>
      <path d={`M${cx - rx},${cy} A${rx},${ry} 0 0 0 ${cx + rx},${cy} L${cx + rx},${top} L${cx - rx},${top} Z`} fill={m.left} />
      <ellipse cx={cx} cy={top} rx={rx} ry={ry} fill={m.top} />
    </g>
  );
}

const matrix = (a: number, b: number, c: number, d: number, [e, f]: V) => `matrix(${a} ${b} ${c} ${d} ${e.toFixed(1)} ${f.toFixed(1)})`;

/** Draw flat on a horizontal face: u along x, v along y, from (x, y, z). */
export function OnTop({ x, y, z, children }: { x: number; y: number; z: number; children: ReactNode }) {
  return <g transform={matrix(C, S, -C, S, P(x, y, z))}>{children}</g>;
}

/** Draw on an upright face that looks left-down (the plane y = const): u along x, v downwards from height z. */
export function OnFront({ x, y, z, children }: { x: number; y: number; z: number; children: ReactNode }) {
  return <g transform={matrix(C, S, 0, 1, P(x, y, z))}>{children}</g>;
}

/** Draw on an upright face that looks right-down (the plane x = const): u towards smaller y, v downwards. */
export function OnSide({ x, y, z, children }: { x: number; y: number; z: number; children: ReactNode }) {
  return <g transform={matrix(C, -S, 0, 1, P(x, y, z))}>{children}</g>;
}

// --- time ---------------------------------------------------------------------

export const clamp = (v: number) => Math.min(1, Math.max(0, v));
/** 0 before `start`, 1 after `start + span`, linear in between. */
export const k = (t: number, start: number, span: number) => clamp((t - start) / span);
export const smooth = (p: number) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);
/** Like k, eased. */
export const ke = (t: number, start: number, span: number) => smooth(k(t, start, span));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
/** True between start and end. */
export const during = (t: number, start: number, end: number) => t >= start && t < end;

/** Something arriving from above: shift and fade. */
export function Drop({ t, at, from = 40, children }: { t: number; at: number; from?: number; children: ReactNode }) {
  const p = ke(t, at, 0.6);
  if (p <= 0) return null;
  return (
    <g transform={`translate(0 ${(-(1 - p) * from).toFixed(1)})`} opacity={k(t, at, 0.3)}>
      {children}
    </g>
  );
}

/** Things in screen space that fade in at `at`. */
export function Appear({ t, at, children, out }: { t: number; at: number; out?: number; children: ReactNode }) {
  let o = k(t, at, 0.3);
  if (out !== undefined) o *= 1 - k(t, out, 0.3);
  if (o <= 0) return null;
  return <g opacity={o}>{children}</g>;
}
