/**
 * The close-up of a wiring step: the NodeMCU from above, large, with the pin
 * names printed on the owner's board, the breadboard beside it, and each wire
 * of the step made one at a time: the pin lights up, the jumper's socket goes
 * onto it, the wire runs to the breadboard, its pin goes into a hole, and what
 * that hole is joined to lights up.
 *
 * The wires come from components/workbench/wiring.ts, the same list as the
 * wiring drawing. Where each part sits on the breadboard is chosen here, as an
 * example: any free row works, and the captions say so.
 */
import type { ReactNode } from 'react';
import { NODES, type Colour, type End, type Wire } from '@/components/workbench/wiring';
import { k, ke, lerp } from './iso';
import { Label, Tag } from './parts';
import type { Beat, Box, SceneDef } from './types';

const MONO = 'var(--font-mono, ui-monospace, monospace)';
type Pt = [number, number];

// --- the NodeMCU ----------------------------------------------------------------------
// The owner keeps it upside down, pins up, so jumpers plug straight on, with the USB
// pointing away and the breadboard on its right. Seen from the back like that, each row
// keeps its side but runs the other way: the D row is next to the breadboard, with D0 at
// the far end. The front view, USB at the bottom, is kept for the plug-in step.

const MCU = { x: 30, y: 14, w: 160, h: 412 };
const PIN_TOP = 52;
const PIN_STEP = 25;
const COL_X = { left: 46, right: 174 };
const NODE_A = NODES.find((node) => node.id === 'a')!;
const FRONT_LEFT = NODE_A.board.left;
const FRONT_RIGHT = NODE_A.board.right;
const LEFT = [...FRONT_LEFT].reverse();
const RIGHT = [...FRONT_RIGHT].reverse();

function mcuPin(name: string, prefer?: 'left' | 'right'): { at: Pt; side: 'left' | 'right'; index: number } {
  const order: ('left' | 'right')[] = prefer === 'left' ? ['left', 'right'] : ['right', 'left'];
  // The pins named in wiring.ts: 3V and G are the pair between D4 and D5 in the D row; VIN is the outer row's pin by the USB.
  const wanted: Record<string, { side: 'left' | 'right'; index: number }> = { '3V': { side: 'right', index: 9 }, G: { side: 'right', index: 8 }, VIN: { side: 'left', index: 0 } };
  const fixed = wanted[name];
  if (fixed) return { at: [COL_X[fixed.side], PIN_TOP + fixed.index * PIN_STEP], ...fixed };
  for (const side of order) {
    const index = (side === 'left' ? LEFT : RIGHT).indexOf(name);
    if (index >= 0) return { at: [COL_X[side], PIN_TOP + index * PIN_STEP], side, index };
  }
  throw new Error(`No NodeMCU pin ${name}`);
}

const ORDINAL = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th', '13th', '14th', '15th'];

/** How to find a pin on the upside-down board, whose names are underneath: count from the far end. */
function between(side: 'left' | 'right', index: number) {
  const row = side === 'right' ? 'row next to the breadboard' : 'outer row';
  return `${row}, ${ORDINAL[14 - index]} pin from the far end${index === 0 ? ', by the USB' : ''}`;
}

/** The owner's way: upside down, pins up, USB away. The names are not printed on this side: they are drawn here to help. */
export function NodeMCUBack() {
  return (
    <g>
      <rect x={MCU.x + 6} y={MCU.y + 8} width={MCU.w} height={MCU.h} rx={6} fill="#000" opacity={0.25} />
      <rect x={MCU.x} y={MCU.y} width={MCU.w} height={MCU.h} rx={6} fill="#111214" stroke="#26282c" />
      <rect x={93} y={MCU.y - 6} width={34} height={14} rx={2} fill="url(#cu-can)" stroke="#8d949a" />
      <text x={110} y={200} textAnchor="middle" fontSize={11} fill="#e7e9ec" fontFamily={MONO} transform="rotate(-90 110 200)">
        NodeMcu V3
      </text>
      <text x={110} y={300} textAnchor="middle" fontSize={6.5} fill="#9aa0a6" fontFamily={MONO} transform="rotate(-90 110 300)">
        back side · pins up
      </text>
      <text x={110} y={MCU.y + MCU.h - 10} textAnchor="middle" fontSize={7} fill="#9aa0a6" fontFamily={MONO}>
        far end
      </text>
      {(['left', 'right'] as const).map((side) => (
        <g key={side}>
          <rect x={COL_X[side] - 8} y={PIN_TOP - 12} width={16} height={14 * PIN_STEP + 24} rx={2} fill="#26282c" />
          {(side === 'left' ? LEFT : RIGHT).map((name, i) => {
            const y = PIN_TOP + i * PIN_STEP;
            return (
              <g key={`${side}-${i}`}>
                <rect x={COL_X[side] - 4} y={y - 4} width={8} height={8} rx={1} fill="url(#cu-gold)" />
                <text x={side === 'left' ? COL_X.left + 12 : COL_X.right - 12} y={y + 3.5} textAnchor={side === 'left' ? 'start' : 'end'} fontSize={9.5} fill="#aeb4ba" fontFamily={MONO}>
                  {name}
                </text>
              </g>
            );
          })}
        </g>
      ))}
    </g>
  );
}

export function NodeMCUTop({ led }: { led: boolean }) {
  return (
    <g>
      <rect x={MCU.x + 6} y={MCU.y + 8} width={MCU.w} height={MCU.h} rx={6} fill="#000" opacity={0.25} />
      <rect x={MCU.x} y={MCU.y} width={MCU.w} height={MCU.h} rx={6} fill="#1c2733" stroke="#2c3a48" />
      {/* the ESP-12 module: antenna on top, metal can below */}
      <rect x={62} y={18} width={96} height={134} rx={2} fill="#121a22" />
      <path d="M70,24 h18 v14 h-12 v-8 h20 v14 h16 v-14 h18 v14 h-12" fill="none" stroke="#c9a33c" strokeWidth={2} />
      <rect x={66} y={48} width={88} height={100} rx={2} fill="url(#cu-can)" stroke="#8d949a" />
      <text x={110} y={92} textAnchor="middle" fontSize={8} fill="#4a5258" fontFamily={MONO}>
        ESP8266MOD
      </text>
      <text x={110} y={104} textAnchor="middle" fontSize={6} fill="#4a5258" fontFamily={MONO}>
        Wi-Fi
      </text>
      {/* CH340, the USB chip */}
      <rect x={96} y={296} width={28} height={36} rx={2} fill="#0b0f13" />
      {Array.from({ length: 8 }, (_, i) => (
        <g key={i}>
          <rect x={91} y={299 + i * 4} width={5} height={1.6} fill="#b8bec3" />
          <rect x={124} y={299 + i * 4} width={5} height={1.6} fill="#b8bec3" />
        </g>
      ))}
      <text x={110} y={316} textAnchor="middle" fontSize={5} fill="#7f8a94" fontFamily={MONO}>
        CH340
      </text>
      {/* power light */}
      <circle cx={110} cy={180} r={3} fill={led ? '#5ab4ff' : '#203347'} />
      {led ? <circle cx={110} cy={180} r={8} fill="#5ab4ff" opacity={0.25} /> : null}
      {/* FLASH and RST beside the USB socket */}
      {[
        { x: 70, name: 'FLASH' },
        { x: 150, name: 'RST' },
      ].map((b) => (
        <g key={b.name}>
          <rect x={b.x - 8} y={398} width={16} height={12} rx={1.5} fill="#c9ced2" />
          <circle cx={b.x} cy={404} r={3.5} fill="#2b2d30" />
          <text x={b.x} y={394} textAnchor="middle" fontSize={5.5} fill="#e8edf1" fontFamily={MONO}>
            {b.name}
          </text>
        </g>
      ))}
      <rect x={93} y={414} width={34} height={16} rx={2} fill="url(#cu-can)" stroke="#8d949a" />
      {/* the two pin headers, with the names printed beside them */}
      {(['left', 'right'] as const).map((side) => (
        <g key={side}>
          <rect x={COL_X[side] - 8} y={PIN_TOP - 12} width={16} height={14 * PIN_STEP + 24} rx={2} fill="#0a0a0a" />
          {(side === 'left' ? FRONT_LEFT : FRONT_RIGHT).map((name, i) => {
            const y = PIN_TOP + i * PIN_STEP;
            return (
              <g key={`${side}-${i}`}>
                <rect x={COL_X[side] - 4} y={y - 4} width={8} height={8} rx={1} fill="url(#cu-gold)" />
                <rect x={COL_X[side] - 1.5} y={y - 1.5} width={3} height={3} fill="#8a6d1c" />
                <text x={side === 'left' ? COL_X.left + 12 : COL_X.right - 12} y={y + 3.5} textAnchor={side === 'left' ? 'start' : 'end'} fontSize={9.5} fill="#f2f5f7" fontFamily={MONO}>
                  {name}
                </text>
              </g>
            );
          })}
        </g>
      ))}
    </g>
  );
}

// --- the breadboard, long side down ---------------------------------------------------

const BB = { x: 248, y: 14, w: 286, h: 412 };
export const COLS: Record<string, number> = { 'L+': 266, 'L-': 282, a: 314, b: 329, c: 344, d: 359, e: 374, f: 408, g: 423, h: 438, i: 453, j: 468, 'R-': 500, 'R+': 516 };
export const ROW_TOP = 34;
export const ROW_STEP = 15;
const ROWS = 26;
const hole = (col: string, row: number): Pt => [COLS[col], ROW_TOP + row * ROW_STEP];
const RAILS = { v33: { col: 'L+', name: '3.3 V rail', colour: '#d0453c' }, gnd: { col: 'L-', name: '− rail, ground', colour: '#3b6fd0' }, v5: { col: 'R+', name: '5 V rail', colour: '#d0453c' } } as const;

function BreadboardTop() {
  const rails = ['L+', 'L-', 'R-', 'R+'];
  const main = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
  return (
    <g>
      <rect x={BB.x + 6} y={BB.y + 8} width={BB.w} height={BB.h} rx={6} fill="#000" opacity={0.22} />
      <rect x={BB.x} y={BB.y} width={BB.w} height={BB.h} rx={6} fill="#f1efe8" stroke="#d6d2c6" />
      <rect x={390} y={BB.y + 4} width={4} height={BB.h - 8} fill="#d9d5c9" />
      <rect x={BB.x + 2} y={BB.y + 4} width={50} height={BB.h - 8} rx={3} fill="#e9e6dc" />
      <rect x={484} y={BB.y + 4} width={48} height={BB.h - 8} rx={3} fill="#e9e6dc" />
      <line x1={258} y1={BB.y + 10} x2={258} y2={BB.y + BB.h - 10} stroke="#d0453c" strokeWidth={1.4} />
      <line x1={290} y1={BB.y + 10} x2={290} y2={BB.y + BB.h - 10} stroke="#3b6fd0" strokeWidth={1.4} />
      <line x1={492} y1={BB.y + 10} x2={492} y2={BB.y + BB.h - 10} stroke="#3b6fd0" strokeWidth={1.4} />
      <line x1={524} y1={BB.y + 10} x2={524} y2={BB.y + BB.h - 10} stroke="#d0453c" strokeWidth={1.4} />
      <text x={266} y={BB.y + 10} textAnchor="middle" fontSize={9} fill="#d0453c" fontWeight={700}>
        +
      </text>
      <text x={282} y={BB.y + 10} textAnchor="middle" fontSize={9} fill="#3b6fd0" fontWeight={700}>
        −
      </text>
      <text x={500} y={BB.y + 10} textAnchor="middle" fontSize={9} fill="#3b6fd0" fontWeight={700}>
        −
      </text>
      <text x={516} y={BB.y + 10} textAnchor="middle" fontSize={9} fill="#d0453c" fontWeight={700}>
        +
      </text>
      {main.map((col) => (
        <text key={col} x={COLS[col]} y={BB.y + 11} textAnchor="middle" fontSize={7} fill="#8b877b" fontFamily={MONO}>
          {col}
        </text>
      ))}
      {Array.from({ length: ROWS }, (_, row) => (
        <g key={row}>
          <text x={300} y={ROW_TOP + row * ROW_STEP + 2.5} textAnchor="middle" fontSize={6} fill="#a29e92" fontFamily={MONO}>
            {row + 1}
          </text>
          {[...main, ...(row % 6 === 5 ? [] : rails)].map((col) => {
            const [x, y] = hole(col, row);
            return <rect key={col} x={x - 2.6} y={y - 2.6} width={5.2} height={5.2} rx={0.8} fill="#3a372f" />;
          })}
        </g>
      ))}
    </g>
  );
}

function ButtonTop({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 22} y={y - 22} width={44} height={44} rx={3} fill="#000" opacity={0.25} transform="translate(4 5)" />
      <rect x={x - 22} y={y - 22} width={44} height={44} rx={3} fill="#1e1f21" />
      <circle cx={x} cy={y} r={13} fill="#3b3e42" />
      <circle cx={x - 3} cy={y - 3} r={5} fill="#55595e" />
    </g>
  );
}

/** What a series part, or a part between two holes, looks like. */
function SeriesPart({ a, b, what }: { a: Pt; b: Pt; what: string }) {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const vertical = Math.abs(b[1] - a[1]) > Math.abs(b[0] - a[0]);
  const body =
    what.includes('Ω') ? (
      <rect x={mx - (vertical ? 4 : 11)} y={my - (vertical ? 11 : 4)} width={vertical ? 8 : 22} height={vertical ? 22 : 8} rx={3} fill="#d9c08f" />
    ) : what.includes('1N') ? (
      <g>
        <rect x={mx - (vertical ? 3.5 : 9)} y={my - (vertical ? 9 : 3.5)} width={vertical ? 7 : 18} height={vertical ? 18 : 7} rx={2} fill="#c43c2c" />
        <rect x={vertical ? mx - 3.5 : a[0] < b[0] ? mx + 5 : mx - 7} y={vertical ? (a[1] > b[1] ? my - 9 : my + 5) : my - 3.5} width={vertical ? 7 : 2.5} height={vertical ? 2.5 : 7} fill="#111" />
      </g>
    ) : what.includes('µF') ? (
      <g>
        <circle cx={mx} cy={my} r={what.includes('1000') ? 9 : 6.5} fill="#1f3f73" stroke="#132a4f" />
        <path d={`M${mx - (what.includes('1000') ? 9 : 6.5)},${my} a${what.includes('1000') ? 9 : 6.5},${what.includes('1000') ? 9 : 6.5} 0 0 1 ${what.includes('1000') ? 6 : 4},-${what.includes('1000') ? 6.7 : 4.8}`} fill="none" stroke="#c9ced2" strokeWidth={2} />
        <text x={mx} y={my + 2} textAnchor="middle" fontSize={4.5} fill="#dfe7ee">
          µF
        </text>
      </g>
    ) : (
      <g>
        <circle cx={mx} cy={my} r={6} fill="#e1b84a" />
        <text x={mx} y={my + 2} textAnchor="middle" fontSize={4.5} fill="#5a4a14">
          104
        </text>
      </g>
    );
  return (
    <g>
      <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#b8bec3" strokeWidth={1.4} />
      {body}
    </g>
  );
}

/** The metal and gold the close-ups are drawn with. */
export function CloseupDefs() {
  return (
    <defs>
      <linearGradient id="cu-can" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#e3e7ea" />
        <stop offset="1" stopColor="#a9b0b6" />
      </linearGradient>
      <linearGradient id="cu-gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f3d27a" />
        <stop offset="1" stopColor="#b88a24" />
      </linearGradient>
    </defs>
  );
}

// --- a jumper -----------------------------------------------------------------------

const HEX: Record<Colour, string> = { red: '#d0453c', black: '#2a2a2a', yellow: '#e2b93b', orange: '#e08a4f', green: '#3f9b5a', blue: '#3b6fd0', violet: '#8a5cc8', grey: '#8d949a', white: '#ecebe6' };

function bend(a: Pt, b: Pt): string {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const lift = Math.min(70, 20 + Math.hypot(dx, dy) * 0.18);
  return `M${a[0]},${a[1]} C${a[0] + dx * 0.25},${a[1] + dy * 0.1 - lift} ${b[0] - dx * 0.25},${b[1] - dy * 0.1 - lift} ${b[0]},${b[1]}`;
}

/** `land` 0 to 1: the socket coming down onto the pin. `run`: the wire across. `seat`: its pin into the hole. */
function Jumper({ a, b, colour, land, run, seat, female = true }: { a: Pt; b: Pt; colour: Colour; land: number; run: number; seat: number; female?: boolean }) {
  if (land <= 0) return null;
  const c = HEX[colour];
  const lift = (1 - land) * 26;
  const d = bend(a, b);
  return (
    <g>
      {run > 0 ? (
        <>
          <path d={d} fill="none" stroke="#000" strokeOpacity={0.22} strokeWidth={4} transform="translate(5 8)" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - run} strokeLinecap="round" />
          <path d={d} fill="none" stroke={c} strokeWidth={3.4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - run} strokeLinecap="round" />
          <path d={d} fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={1} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - run} strokeLinecap="round" transform="translate(-0.8 -0.8)" />
        </>
      ) : null}
      {run >= 1 ? (
        <g transform={`translate(${b[0]} ${b[1] - (1 - seat) * 14})`}>
          <rect x={-3.2} y={-12} width={6.4} height={10} rx={1.2} fill={c} stroke="#000" strokeOpacity={0.3} />
          <rect x={-1} y={-2} width={2} height={4} fill="#c9ced2" />
        </g>
      ) : null}
      {female ? (
        <g transform={`translate(${a[0] + lift * 0.4} ${a[1] - lift}) scale(${1 + (1 - land) * 0.5})`}>
          <rect x={-5.5 + 4} y={-9 + 6} width={11} height={18} rx={1.5} fill="#000" opacity={0.25 * land} />
          <rect x={-5.5} y={-9} width={11} height={18} rx={1.5} fill="#151515" stroke="#333" />
          <rect x={-3.5} y={-7} width={7} height={2} rx={1} fill="#444" />
          <rect x={-1.5} y={-1.5} width={3} height={3} fill={c} opacity={0.8} />
        </g>
      ) : null}
    </g>
  );
}

// --- where the parts sit, as an example --------------------------------------------

type Place = {
  /** Holes the part's pins go into, by pin name. */
  pins: Record<string, Pt>;
  /** Where a jumper goes for each pin: a free hole in the same row of five. */
  jumper: Record<string, Pt>;
  /** Where a component's leg goes for each pin, when it is not the jumper's hole. */
  leg?: Record<string, Pt>;
  /** Column a series part (a resistor on the way in) stands in. */
  seriesCol?: string;
  /** How to say where it goes. */
  say: string;
  draw: () => ReactNode;
};

const at = (col: string, row: number) => hole(col, row);
const rowY = (row: number) => ROW_TOP + row * ROW_STEP;

const PLACES_A: Record<string, Place> = {
  oled: {
    pins: { VCC: at('e', 1), GND: at('e', 2), SCL: at('e', 3), SDA: at('e', 4) },
    jumper: { VCC: at('a', 1), GND: at('a', 2), SCL: at('a', 3), SDA: at('a', 4) },
    say: 'The display’s four pins down column e, rows 2 to 5, VCC at the top. Its screen faces you.',
    draw: () => (
      <g>
        <rect x={386} y={26} width={108} height={84} rx={4} fill="#000" opacity={0.25} transform="translate(5 6)" />
        <rect x={380} y={24} width={108} height={84} rx={4} fill="#1f4fa0" stroke="#163a78" />
        <rect x={392} y={36} width={88} height={56} rx={2} fill="#05070a" />
        <text x={398} y={50} fontSize={8} fill="#9fd8ff" fontFamily={MONO}>
          CAMERA ?
        </text>
        <text x={398} y={70} fontSize={15} fill="#9fd8ff" fontFamily={MONO}>
          0.0 g
        </text>
        <text x={398} y={86} fontSize={8} fill="#9fd8ff" fontFamily={MONO}>
          READY
        </text>
      </g>
    ),
  },
  tare: {
    pins: { leg: at('e', 7), 'opposite leg': at('f', 9) },
    jumper: { leg: at('a', 7), 'opposite leg': at('j', 9) },
    say: 'The button across the centre gap: two legs in column e, two in column f, rows 8 and 10.',
    draw: () => <ButtonTop x={391} y={rowY(8)} />,
  },
  capture: {
    pins: { leg: at('e', 11), 'opposite leg': at('f', 13) },
    jumper: { leg: at('a', 11), 'opposite leg': at('j', 13) },
    say: 'The second button across the gap, rows 12 and 14.',
    draw: () => <ButtonTop x={391} y={rowY(12)} />,
  },
  q1: {
    pins: { emitter: at('c', 15), base: at('c', 16), collector: at('c', 17) },
    jumper: { emitter: at('a', 15), base: at('a', 16), collector: at('d', 17) },
    seriesCol: 'b',
    say: 'The transistor in column c, rows 16 to 18: flat face to the left, E at the top, B in the middle, C at the bottom.',
    draw: () => <TransistorTop col="c" row={15} />,
  },
  buzzer: {
    pins: { S: at('h', 15), '−': at('h', 17) },
    jumper: { S: at('j', 15), '−': at('g', 17) },
    leg: { S: at('i', 15), '−': at('i', 17) },
    say: 'The buzzer module on the other side: S in row 16, its middle pin in 17, − in row 18.',
    draw: () => (
      <g>
        <rect x={446} y={rowY(14)} width={46} height={52} rx={3} fill="#000" opacity={0.25} transform="translate(5 6)" />
        <rect x={442} y={rowY(14)} width={46} height={52} rx={3} fill="#1e7a4c" />
        <circle cx={466} cy={rowY(16) + 2} r={18} fill="#151618" />
        <circle cx={466} cy={rowY(16) + 2} r={3} fill="#000" />
      </g>
    ),
  },
  hx711: {
    pins: { VCC: at('d', 19), GND: at('d', 20), DT: at('d', 21), SCK: at('d', 22), 'E+': at('h', 19), 'E−': at('h', 20), 'A−': at('h', 21), 'A+': at('h', 22) },
    jumper: { VCC: at('a', 19), GND: at('a', 20), DT: at('a', 21), SCK: at('a', 22), 'E+': at('j', 19), 'E−': at('j', 20), 'A−': at('j', 21), 'A+': at('j', 22) },
    leg: { VCC: at('b', 19), GND: at('b', 20) },
    say: 'The HX711 across the gap, rows 20 to 23: VCC, GND, DT, SCK in column d; E+, E−, A−, A+ in column h.',
    draw: () => (
      <g>
        <rect x={356} y={rowY(18.5)} width={88} height={64} rx={3} fill="#000" opacity={0.25} transform="translate(5 6)" />
        <rect x={352} y={rowY(18.5)} width={88} height={64} rx={3} fill="#1e7a4c" />
        <rect x={382} y={rowY(20)} width={26} height={22} fill="#111" />
        <text x={395} y={rowY(21) + 5} textAnchor="middle" fontSize={5} fill="#999" fontFamily={MONO}>
          HX711
        </text>
      </g>
    ),
  },
  cell: {
    pins: { red: [560, 360], black: [560, 368], white: [560, 376], green: [560, 384] },
    jumper: { red: [560, 360], black: [560, 368], white: [560, 376], green: [560, 384] },
    say: 'The load cell’s four wires come in from the side.',
    draw: () => <rect x={552} y={350} width={30} height={44} rx={2} fill="#d3d8db" stroke="#9aa1a6" />,
  },
};

function TransistorTop({ col, row }: { col: string; row: number }) {
  const x = COLS[col];
  return (
    <g>
      <path d={`M${x + 6},${rowY(row) - 6} a13,22 0 0 1 0,${2 * ROW_STEP + 12} z`} fill="#000" opacity={0.25} transform="translate(4 5)" />
      <path d={`M${x + 2},${rowY(row) - 6} a13,22 0 0 1 0,${2 * ROW_STEP + 12} z`} fill="#1e1f21" />
      <text x={x + 7} y={rowY(row + 1) + 3} fontSize={5} fill="#aaa" fontFamily={MONO}>
        2222
      </text>
    </g>
  );
}

// --- the camera board, for the light and the bench ------------------------------------

export const NODE_B = NODES.find((node) => node.id === 'b')!;
const CAM_LEFT = NODE_B.board.left;
const CAM_RIGHT = NODE_B.board.right;
/** The ESP32-CAM's pins are 0.9 inch apart: columns b and i, one free hole beside each (a and j). */
const camPin = (name: string, nth = 0): { pin: Pt; jumper: Pt } => {
  const li = CAM_LEFT.indexOf(name);
  const ri = CAM_RIGHT.indexOf(name);
  const all = [...(li >= 0 ? [{ side: 'left', i: li }] : []), ...(ri >= 0 ? [{ side: 'right', i: ri }] : [])];
  const found = all[nth] ?? all[0];
  if (!found) throw new Error(`No ESP32-CAM pin ${name}`);
  return found.side === 'left' ? { pin: at('b', found.i), jumper: at('a', found.i) } : { pin: at('i', found.i), jumper: at('j', found.i) };
};

/** The LEDs sit below the camera's body, which covers rows 1 to 14. */
const LED_ROW = (n: number) => 14 + n * 2;
/** The side rails have a gap every sixth row: a wire meant for one goes one row down. */
const railRow = (row: number) => (row % 6 === 5 ? row + 1 : row);

const PLACES_B: Record<string, Place> = {
  cam: {
    pins: Object.fromEntries([...CAM_LEFT, ...CAM_RIGHT].map((name) => [name, camPin(name).pin])),
    jumper: Object.fromEntries([...CAM_LEFT, ...CAM_RIGHT].map((name) => [name, camPin(name).jumper])),
    leg: { '5V': at('L+', 0), GND: at('L-', 0) },
    say: 'The camera into the breadboard, the microSD end at the top: its left pins in column b, its right pins in column i, rows 1 to 8. Its body covers the rows down to 14: nothing goes under it.',
    draw: () => <CameraTop />,
  },
  q2: {
    pins: { emitter: at('c', 18), base: at('c', 19), collector: at('c', 20) },
    jumper: { emitter: at('a', 18), base: at('a', 19), collector: at('d', 20) },
    leg: { base: at('d', 19) },
    seriesCol: 'b',
    say: 'The second transistor below the camera, in column c, rows 19 to 21: flat face to the left, E, B, C from the top.',
    draw: () => <TransistorTop col="c" row={18} />,
  },
  leds: {
    pins: { 'long legs': at('g', LED_ROW(0)), 'short legs': at('g', LED_ROW(0) + 1) },
    jumper: { 'long legs': at('j', LED_ROW(0)), 'short legs': at('j', LED_ROW(0) + 1) },
    say: 'Six white LEDs down column g, below the camera, each across two rows: long leg on top, short leg below. Rows 15 to 26.',
    draw: () => (
      <g>
        {Array.from({ length: 6 }, (_, n) => (
          <g key={n}>
            <circle cx={COLS.g + 9} cy={rowY(LED_ROW(n)) + 7.5} r={9} fill="#000" opacity={0.2} transform="translate(3 4)" />
            <circle cx={COLS.g + 9} cy={rowY(LED_ROW(n)) + 7.5} r={9} fill="#f4f6f7" stroke="#c7cdd1" />
            <circle cx={COLS.g + 7} cy={rowY(LED_ROW(n)) + 5} r={3} fill="#fff" />
            <line x1={COLS.g + 1} y1={rowY(LED_ROW(n)) + 13} x2={COLS.g + 17} y2={rowY(LED_ROW(n)) + 13} stroke="#9aa1a6" strokeWidth={1.2} />
          </g>
        ))}
      </g>
    ),
  },
  base: {
    pins: {},
    jumper: {},
    say: '',
    draw: () => null,
  },
};

/**
 * The ESP32-CAM from above, as on the owner's board: 27 × 40.5 mm, so it covers the
 * breadboard down to row 14. The microSD slot is at the top edge with the lens folded
 * over it, then the ribbon, the camera connector, the white LED, and "ESP32-CAM".
 */
export const CAM_BOX = { x: COLS.b - 13, y: rowY(0) - 24, w: COLS.i - COLS.b + 26, h: 220 };

export function CameraTop() {
  const { x, y, w, h } = CAM_BOX;
  const label = { fontSize: 7, fill: '#f2f5f7', fontFamily: MONO, paintOrder: 'stroke', stroke: '#1d2732', strokeWidth: 2.6, strokeLinejoin: 'round' } as const;
  return (
    <g>
      <rect x={x + 5} y={y + 6} width={w} height={h} rx={4} fill="#000" opacity={0.25} />
      <rect x={x} y={y} width={w} height={h} rx={4} fill="#1d2732" stroke="#2c3a48" />
      {/* the microSD slot, open at the top edge */}
      <rect x={x + 32} y={y} width={86} height={76} rx={2} fill="url(#cu-can)" stroke="#8d949a" />
      <rect x={x + 36} y={y} width={78} height={3} fill="#6f777d" />
      {/* the lens, folded over the slot, and its ribbon */}
      <rect x={x + 54} y={y + 80} width={30} height={34} fill="#c9873a" />
      <rect x={x + 46} y={y + 23} width={50} height={50} rx={3} fill="#111" />
      <circle cx={x + 71} cy={y + 48} r={17} fill="#1b1b1b" stroke="#333" />
      <circle cx={x + 71} cy={y + 48} r={8} fill="#1f3350" />
      <circle cx={x + 68} cy={y + 45} r={2.2} fill="#7fa6d8" />
      {/* the camera connector, the LED, the name */}
      <rect x={x + 27} y={y + 123} width={96} height={32} rx={2} fill="#ecebe6" />
      <rect x={x + 32} y={y + 128} width={86} height={8} fill="#3a3a3a" />
      <rect x={x + 129} y={y + 149} width={17} height={17} rx={1.5} fill="#fff6d8" stroke="#c9c2a5" />
      <text x={x + w / 2} y={y + 210} textAnchor="middle" fontSize={11} fontWeight={700} fill="#f2f5f7" fontFamily={MONO}>
        ESP32-CAM
      </text>
      {CAM_LEFT.map((name, i) => (
        <g key={`l${i}`}>
          <rect x={COLS.b - 3.5} y={rowY(i) - 3.5} width={7} height={7} rx={1} fill="url(#cu-gold)" />
          <text x={COLS.b + 7} y={rowY(i) + 3} {...label}>
            {name}
          </text>
        </g>
      ))}
      {CAM_RIGHT.map((name, i) => (
        <g key={`r${i}`}>
          <rect x={COLS.i - 3.5} y={rowY(i) - 3.5} width={7} height={7} rx={1} fill="url(#cu-gold)" />
          <text x={COLS.i - 7} y={rowY(i) + 3} textAnchor="end" {...label}>
            {name}
          </text>
        </g>
      ))}
    </g>
  );
}

/** The ESP32-CAM-MB base, empty, on the desk to the left: its sockets carry the same names as the camera's pins. */
const BASE_SOCKET = (name: string): Pt => {
  const li = CAM_LEFT.indexOf(name);
  if (li >= 0) return [62, 96 + li * 26];
  return [158, 96 + CAM_RIGHT.indexOf(name) * 26];
};

export function BaseTop({ led }: { led: boolean }) {
  return (
    <g>
      <rect x={46} y={58} width={140} height={300} rx={6} fill="#000" opacity={0.25} />
      <rect x={40} y={52} width={140} height={300} rx={6} fill="#1b1d20" stroke="#2c2f33" />
      <text x={110} y={72} textAnchor="middle" fontSize={8} fill="#cfd5d9" fontFamily={MONO}>
        ESP32-CAM-MB
      </text>
      {[...CAM_LEFT, ...CAM_RIGHT].map((name, i) => {
        const [x, y] = BASE_SOCKET(name);
        const left = i < CAM_LEFT.length;
        return (
          <g key={`${name}-${i}`}>
            <rect x={x - 6} y={y - 6} width={12} height={12} rx={1.5} fill="#0a0a0a" stroke="#333" />
            <rect x={x - 2} y={y - 2} width={4} height={4} fill="#444" />
            <text x={left ? x + 11 : x - 11} y={y + 3} textAnchor={left ? 'start' : 'end'} fontSize={7.5} fill="#f2f5f7" fontFamily={MONO}>
              {name}
            </text>
          </g>
        );
      })}
      <rect x={92} y={300} width={36} height={14} rx={2} fill="#2a2d31" />
      {[
        { x: 66, name: 'IO0' },
        { x: 154, name: 'RST' },
      ].map((b) => (
        <g key={b.name}>
          <rect x={b.x - 8} y={312} width={16} height={12} rx={1.5} fill="#c9ced2" />
          <circle cx={b.x} cy={318} r={3.5} fill="#2b2d30" />
        </g>
      ))}
      <circle cx={110} cy={286} r={3} fill={led ? '#ff5a4a' : '#40201d'} />
      <rect x={93} y={336} width={34} height={16} rx={2} fill="url(#cu-can)" stroke="#8d949a" />
    </g>
  );
}

/** Wires the bench needs that the finished scale does not: the camera off its base, still powered and heard through it. */
const BENCH_B: Wire[] = [
  { id: 'x-base-5v', from: { part: 'base', pin: '5V' }, to: { part: 'v5L', pin: 'rail' }, colour: 'red', say: 'From the base’s 5V socket to the left + rail: that rail is now 5 V.' },
  { id: 'x-base-gnd', from: { part: 'base', pin: 'GND' }, to: { part: 'gnd', pin: 'rail' }, colour: 'black', say: 'From the base’s GND socket to the left − rail.' },
  { id: 'x-cam-5v', from: { part: 'v5L', pin: 'rail' }, to: { part: 'cam', pin: '5V' }, colour: 'red', say: 'The 5 V rail to the camera’s 5V pin.' },
  { id: 'x-cam-gnd', from: { part: 'gnd', pin: 'rail' }, to: { part: 'cam', pin: 'GND' }, colour: 'black', say: 'The − rail to the camera’s GND, the one beside 5V.' },
  { id: 'x-base-u0r', from: { part: 'base', pin: 'U0R' }, to: { part: 'cam', pin: 'U0R' }, colour: 'yellow', say: 'The base’s U0R socket to the camera’s U0R pin: the laptop talks to the camera through it.' },
  { id: 'x-base-u0t', from: { part: 'base', pin: 'U0T' }, to: { part: 'cam', pin: 'U0T' }, colour: 'green', say: 'The base’s U0T socket to the camera’s U0T pin: the camera answers through it.' },
  { id: 'x-bridge', from: { part: 'v5L', pin: 'rail' }, to: { part: 'v5R', pin: 'rail' }, colour: 'red', say: 'Join the left + rail to the right + rail at the bottom: the LEDs take their 5 V from that side.' },
];

/** The finished scale's supply, for the power step: a charger's two leads. */
const SUPPLY_B: Wire[] = [
  { id: 'x-supply-5v', from: { part: 'supply', pin: '+' }, to: { part: 'v5L', pin: 'rail' }, colour: 'red', kind: 'lead', say: 'The charger’s + lead (5 V) to the left + rail.' },
  { id: 'x-supply-gnd', from: { part: 'supply', pin: '−' }, to: { part: 'gnd', pin: 'rail' }, colour: 'black', kind: 'lead', say: 'The charger’s − lead to the − rail.' },
];

// --- one node's bench ---------------------------------------------------------------------

type Rail = { col: string; name: string; colour: string; detail: string };
type BoardPin = { at: Pt; detail: string; title: string; female: boolean };

type Setup = {
  wires: Wire[];
  places: Record<string, Place>;
  name: (part: string) => string;
  rail: (part: string, near: Pt) => Rail | null;
  /** A board off the breadboard whose pins the wires start from: the NodeMCU, or the camera's base. */
  board?: { part: string; find: (pin: string) => BoardPin };
  drawBoard: (led: boolean) => ReactNode;
  usb: Pt;
  supply?: Pt;
};

const SETUP_A: Setup = {
  wires: NODE_A.groups.flatMap((group) => group.wires),
  places: PLACES_A,
  name: (part) => NODE_A.parts.find((p) => p.id === part)?.name ?? part,
  rail: (part) => {
    const r = RAILS[part as keyof typeof RAILS];
    return r ? { ...r, detail: 'the whole line is joined' } : null;
  },
  board: {
    part: 'mcu',
    find: (name) => {
      const pin = mcuPin(name);
      return { at: pin.at, title: `NodeMCU ${name}`, detail: between(pin.side, pin.index), female: true };
    },
  },
  drawBoard: () => <NodeMCUBack />,
  usb: [110, 4],
};

const SETUP_B: Setup = {
  wires: [...NODE_B.groups.flatMap((group) => group.wires), ...BENCH_B, ...SUPPLY_B],
  places: PLACES_B,
  name: (part) => (part === 'base' ? 'Base' : NODE_B.parts.find((p) => p.id === part)?.name ?? part),
  rail: (part, near) => {
    if (part === 'gnd') return { col: 'L-', name: '− rail, ground', colour: '#3b6fd0', detail: 'the whole line is joined' };
    if (part === 'v5L' || (part === 'v5' && near[0] < 390)) return { col: 'L+', name: '5 V rail', colour: '#d0453c', detail: 'the whole line is joined' };
    if (part === 'v5R' || part === 'v5') return { col: 'R+', name: '5 V rail, right', colour: '#d0453c', detail: 'joined to the left one by the bridge' };
    if (part === 'common') return { col: 'R-', name: 'LED common line', colour: '#3b6fd0', detail: 'used here to join the short legs, not ground' };
    return null;
  },
  board: {
    part: 'base',
    find: (name) => ({ at: BASE_SOCKET(name), title: `Base ${name}`, detail: 'its socket, the same name as the camera’s pin', female: false }),
  },
  drawBoard: (led) => <BaseTop led={led} />,
  usb: [110, 360],
};

// --- the scene ------------------------------------------------------------------------

type Glow = { kind: 'rail'; rail: Rail } | { kind: 'row'; row: number; half: 'left' | 'right' } | { kind: 'pin' };
type End3 = { at: Pt; jumper: Pt; leg: Pt; title: string; detail: string; female?: boolean; glow?: Glow };

const FULL: Box = [0, 0, 590, 468];

function fit(points: Pt[], minW = 230): Box {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  let x0 = Math.min(...xs) - 50;
  const x1 = Math.max(...xs) + 50;
  let y0 = Math.min(...ys) - 60;
  const y1 = Math.max(...ys) + 40;
  let w = Math.max(minW, x1 - x0);
  const h = Math.max(w / 1.26, y1 - y0);
  w = h * 1.26;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  if (w >= FULL[2]) return FULL;
  x0 = Math.max(FULL[0], Math.min(cx - w / 2, FULL[2] - w));
  y0 = Math.max(FULL[1] - 20, Math.min(cy - h / 2, FULL[3] - h + 20));
  return [x0, y0, w, h];
}

function rowOf(y: number) {
  return Math.max(0, Math.min(ROWS - 1, Math.round((y - ROW_TOP) / ROW_STEP)));
}

function resolve(setup: Setup, end: End, other: End): End3 {
  if (setup.board && end.part === setup.board.part) {
    const pin = setup.board.find(end.pin);
    return { at: pin.at, jumper: pin.at, leg: pin.at, title: pin.title, detail: pin.detail, female: pin.female, glow: { kind: 'pin' } };
  }
  if (end.part === 'supply') {
    const p: Pt = end.pin === '+' ? [210, 448] : [222, 452];
    return { at: p, jumper: p, leg: p, title: `Charger ${end.pin}`, detail: 'its lead', female: false };
  }
  const near: Pt =
    setup.board && other.part === setup.board.part ? setup.board.find(other.pin).at : setup.places[other.part]?.jumper[other.pin] ?? (other.part === 'v5R' ? [520, 400] : [0, 380]);
  const rail = setup.rail(end.part, near);
  if (rail) {
    let row = rowOf(near[1]);
    if (row % 6 === 5) row += 1;
    // The bridge and the charger's leads each get rail holes of their own, clear of the light's.
    if (end.part === 'v5R' || (other.part === 'v5R' && end.part === 'v5L')) row = 25;
    if (other.part === 'supply') row = 21;
    const h = hole(rail.col, row);
    return { at: h, jumper: h, leg: h, title: rail.name, detail: rail.detail, glow: { kind: 'rail', rail } };
  }
  const place = setup.places[end.part];
  if (!place) throw new Error(`No place for ${end.part}`);
  const pinAt = place.pins[end.pin];
  const jumper = place.jumper[end.pin];
  if (!pinAt || !jumper) throw new Error(`No hole for ${end.part} ${end.pin}`);
  const row = rowOf(jumper[1]);
  const half = jumper[0] < 390 ? 'left' : 'right';
  const leg = place.leg?.[end.pin] ?? [half === 'left' ? COLS.b : COLS.i, jumper[1]];
  const name = setup.name(end.part);
  return { at: pinAt, jumper, leg, title: `${name} ${end.pin}`, detail: `row ${row + 1}, joined to its ${end.pin}`, glow: end.part === 'cell' ? undefined : { kind: 'row', row, half } };
}

type Sub = { a: Pt; b: Pt; kind: 'jumper' | 'part'; colour: Colour; through?: string };
type Planned = { wire: Wire; a: End3; b: End3; start: number; kind: 'jumper' | 'lead' | 'part'; subs?: Sub[] };

/** The six LEDs: one resistor each from the 5 V rail, and each short leg to the common line, then the line to the collector. */
function ledSubs(wire: Wire, setup: Setup): Sub[] | undefined {
  if (wire.id === 'b-light-leds') {
    return Array.from({ length: 6 }, (_, n) => ({ a: hole('R+', LED_ROW(n)), b: hole('j', LED_ROW(n)), kind: 'part' as const, colour: 'red' as Colour, through: '100 Ω' }));
  }
  if (wire.id === 'b-light-collector') {
    const collector = setup.places.q2.jumper.collector;
    return [
      ...Array.from({ length: 6 }, (_, n) => ({ a: hole('j', LED_ROW(n) + 1), b: hole('R-', railRow(LED_ROW(n) + 1)), kind: 'jumper' as const, colour: 'blue' as Colour })),
      { a: collector, b: hole('R-', rowOf(collector[1])), kind: 'jumper' as const, colour: 'blue' as Colour },
    ];
  }
  return undefined;
}

const PER_WIRE = 5;
const INTRO = 2.2;
/** Labels near the breadboard's edges lean inwards, so they stay in the frame. */
const edge = (x: number) => (x > 470 ? -55 : x < 290 ? 30 : 0);

/** variant: "a:ids|earlier-ids" or "b:…", comma separated. */
export function closeupScene(variant: string): SceneDef {
  const [nodeId, rest = ''] = variant.includes(':') ? variant.split(/:(.*)/s) : ['a', variant];
  const setup = nodeId === 'b' ? SETUP_B : SETUP_A;
  const [now, earlier = ''] = rest.split('|');
  const byId = (id: string) => setup.wires.find((wire) => wire.id === id);
  const current = now.split(',').filter(Boolean).map(byId).filter(Boolean) as Wire[];
  const done = earlier.split(',').filter(Boolean).map(byId).filter(Boolean) as Wire[];
  const partsOf = (list: Wire[]) => [...new Set(list.flatMap((w) => [w.from.part, w.to.part]).filter((p) => p in setup.places && setup.places[p].say))];
  const oldParts = partsOf(done);
  const newParts = partsOf(current).filter((p) => !oldParts.includes(p));
  const placeT = newParts.length ? 2.8 : 0;
  const powerStep = current.some((w) => w.id === 'x-supply-5v');
  const usbAway = setup.usb[1] < 100 ? -1 : 1;

  const boardPart = setup.board?.part;
  const orient = (w: Wire): [End, End] => (w.to.part === boardPart || w.to.part === 'supply' ? [w.to, w.from] : [w.from, w.to]);
  const plan: Planned[] = current.map((wire, i) => {
    const [x, y] = orient(wire);
    return { wire, a: resolve(setup, x, y), b: resolve(setup, y, x), start: INTRO + placeT + i * PER_WIRE, kind: wire.kind ?? 'jumper', subs: ledSubs(wire, setup) };
  });
  const past: Planned[] = done.map((wire) => {
    const [x, y] = orient(wire);
    return { wire, a: resolve(setup, x, y), b: resolve(setup, y, x), start: -1, kind: wire.kind ?? 'jumper', subs: ledSubs(wire, setup) };
  });
  const end = INTRO + placeT + plan.length * PER_WIRE;
  const T = end + 3.4;
  const unplug = powerStep ? 'Unplug the camera’s base from the laptop: from now on the charger powers it.' : 'USB out first. Always: nothing is wired with power on.';
  const replug = powerStep ? 'Plug the charger into the wall. Claude cannot see this board any more: watch it start.' : 'USB back in, then tell Claude. Claude checks the board from the laptop.';

  const beats: Beat[] = [
    { at: 0, text: unplug, who: 'you' },
    ...(newParts.length ? [{ at: INTRO, text: newParts.map((p) => setup.places[p].say).join(' '), who: 'you' as const }] : []),
    ...plan.map((p) => ({ at: p.start, text: p.wire.say, who: 'you' as const })),
    { at: end, text: replug, who: 'you' },
  ];

  const camera = (t: number): Box => {
    const keys: [number, Box][] = [
      [0, fit([setup.usb], 260)],
      [INTRO - 0.4, fit([setup.usb], 260)],
    ];
    if (newParts.length) keys.push([INTRO + 0.5, fit(newParts.flatMap((p) => Object.values(setup.places[p].pins)), 300)]);
    for (const p of plan) {
      const pts = p.subs ? p.subs.flatMap((s) => [s.a, s.b]) : [p.a.at, p.b.jumper];
      keys.push([p.start + 0.5, fit(p.subs ? pts : [p.a.at], 240)]);
      keys.push([p.start + 1.6, fit(pts, 260)]);
      keys.push([p.start + 3.2, fit(p.subs ? pts : [p.b.jumper], 240)]);
    }
    keys.push([end + 0.8, FULL]);
    let i = 0;
    while (i < keys.length - 1 && t >= keys[i + 1][0]) i++;
    const [t0, a] = keys[i];
    const next = keys[i + 1];
    if (!next) return a;
    const [t1, b] = next;
    const span = Math.min(0.9, t1 - t0);
    const p = ke(t, t1 - span, span);
    return a.map((v, j) => lerp(v, b[j], p)) as Box;
  };

  const series = (p: Planned): { mid: Pt; to: Pt } | null => {
    if (!p.wire.through || p.kind === 'part') return null;
    const place = setup.places[p.wire.to.part] ?? setup.places[p.wire.from.part];
    const col = place?.seriesCol ?? 'b';
    return { mid: [COLS[col], p.b.jumper[1] - 3 * ROW_STEP], to: [COLS[col], p.b.jumper[1]] };
  };

  const drawWire = (p: Planned, land: number, run: number, seat: number, key: string, past = false) => {
    if (p.subs) {
      return (
        <g key={key}>
          {p.subs.map((s, n) => {
            const q = Math.min(1, Math.max(0, run * p.subs!.length - n));
            if (q <= 0) return null;
            return s.kind === 'part' ? (
              <g key={n} opacity={q}>
                <SeriesPart a={s.a} b={s.b} what={s.through ?? ''} />
              </g>
            ) : (
              <Jumper key={n} a={s.a} b={s.b} colour={s.colour} land={1} run={q} seat={q >= 1 ? 1 : 0} female={false} />
            );
          })}
          {p.wire.id === 'b-light-collector' && run > 0.5 && !past ? <Label at={hole('R-', 22)} text="this − line: the LEDs’ common, not ground" dx={-60} dy={30} size={8} /> : null}
        </g>
      );
    }
    if (p.kind === 'part') {
      return land > 0 ? (
        <g key={key} opacity={land} transform={`translate(0 ${-(1 - land) * 20})`}>
          <SeriesPart a={p.a.leg} b={p.b.leg} what={p.wire.through ?? ''} />
        </g>
      ) : null;
    }
    const s = series(p);
    if (s) {
      return (
        <g key={key}>
          <Jumper a={p.a.jumper} b={s.mid} colour={p.wire.colour} land={land} run={run} seat={seat} female={p.a.female} />
          {seat > 0 ? <SeriesPart a={s.mid} b={s.to} what={p.wire.through!} /> : null}
        </g>
      );
    }
    return <Jumper key={key} a={p.a.jumper} b={p.b.jumper} colour={p.wire.colour} land={land} run={run} seat={seat} female={p.a.female} />;
  };

  const rowGlow = (g: Glow | undefined, o: number) =>
    g?.kind === 'row' ? <rect x={(g.half === 'left' ? COLS.a : COLS.f) - 6} y={rowY(g.row) - 6} width={COLS.e - COLS.a + 12} height={12} rx={6} fill="#e08a4f" opacity={0.4 * o} /> : null;
  const railGlow = (g: Glow | undefined, o: number) =>
    g?.kind === 'rail' ? <rect x={COLS[g.rail.col] - 5} y={ROW_TOP - 8} width={10} height={(ROWS - 1) * ROW_STEP + 16} rx={5} fill={g.rail.colour} opacity={0.35 * o} /> : null;

  return {
    T,
    beats,
    camera,
    draw: (t) => {
      const usb = t < end ? 1 - ke(t, 0.4, 1.2) : powerStep ? 0 : ke(t, end + 0.2, 0.8);
      const glowing = plan.find((p) => t >= p.start + 3.1 && t < p.start + PER_WIRE + 0.2);
      const pinNow = plan.find((p) => t >= p.start && t < p.start + 1.8);
      const o = glowing ? k(t, glowing.start + 3.1, 0.3) : 0;
      const showSupply = powerStep || done.some((w) => w.id === 'x-supply-5v');
      return (
        <>
          <CloseupDefs />
          <rect x={-200} y={-200} width={1000} height={900} fill="#b48c5e" />
          <BreadboardTop />
          {glowing && !glowing.subs ? (
            <>
              {railGlow(glowing.b.glow, o)}
              {railGlow(glowing.a.glow, o)}
              {rowGlow(glowing.b.glow, o)}
              {rowGlow(glowing.a.glow, o)}
            </>
          ) : null}
          {oldParts.map((p) => (
            <g key={p}>{setup.places[p].draw()}</g>
          ))}
          {newParts.map((p) => {
            const q = ke(t, INTRO, 0.8);
            return q > 0 ? (
              <g key={p} opacity={q} transform={`translate(${(1 - q) * 8} ${-(1 - q) * 30})`}>
                {setup.places[p].draw()}
              </g>
            ) : null;
          })}
          {setup.drawBoard(usb > 0.95 && t > end)}
          {showSupply ? (
            <g>
              <rect x={190} y={440} width={50} height={28} rx={4} fill="#f3f1ea" stroke="#c5c2b7" />
              <text x={215} y={458} textAnchor="middle" fontSize={7} fill="#333">
                5 V 2 A
              </text>
            </g>
          ) : (
            // The cable leaves away from the board: down for the camera's base, up for the upside-down NodeMCU.
            <g transform={`translate(0 ${(1 - usb) * 60 * usbAway})`} opacity={0.35 + usb * 0.65}>
              <rect x={setup.usb[0] - 12} y={setup.usb[1] - 7} width={24} height={14} rx={2} fill="#2a2d31" />
              <rect x={setup.usb[0] - 6} y={usbAway > 0 ? setup.usb[1] + 4 : setup.usb[1] - 64} width={12} height={60} fill="#1f2124" />
            </g>
          )}
          {past.map((p) => (
            <g key={p.wire.id} opacity={0.75}>
              {drawWire(p, 1, 1, 1, p.wire.id, true)}
            </g>
          ))}
          {plan.map((p) => drawWire(p, ke(t, p.start + 0.6, 0.9), ke(t, p.start + 1.6, 1.4), ke(t, p.start + 3, 0.4), p.wire.id))}
          {pinNow && pinNow.a.glow?.kind === 'pin'
            ? (() => {
                // Centred over the pin, but never past the left edge of the frame: the board's left pins are near it.
                const [px, py] = pinNow.a.at;
                const half = Math.max(pinNow.a.title.length * 3.2, pinNow.a.detail.length * 2.1) + 4;
                const lx = Math.max(px + (px < 110 ? -10 : 10), FULL[0] + half);
                return (
                  <g>
                    <circle cx={px} cy={py} r={9 + Math.sin(t * 8) * 2} fill="none" stroke="#e08a4f" strokeWidth={2.4} />
                    <Label at={[px, py - 10]} text={pinNow.a.title} dy={-22} dx={lx - px} tone="accent" size={11} />
                    <text x={lx} y={py - 46} textAnchor="middle" fontSize={7.5} fill="var(--ink, #222)" paintOrder="stroke" stroke="var(--paper, #fff)" strokeWidth={2.4}>
                      {pinNow.a.detail}
                    </text>
                  </g>
                );
              })()
            : null}
          {glowing && !glowing.subs ? (
            <g opacity={o}>
              <Label at={glowing.b.jumper} text={glowing.b.title} dx={edge(glowing.b.jumper[0])} dy={-26} tone="accent" size={10.5} />
              <text x={glowing.b.jumper[0] + edge(glowing.b.jumper[0])} y={glowing.b.jumper[1] - 44} textAnchor="middle" fontSize={7.5} fill="var(--ink, #222)" paintOrder="stroke" stroke="var(--paper, #fff)" strokeWidth={2.4}>
                {glowing.b.detail}
              </text>
            </g>
          ) : null}
          {t < INTRO ? <Tag at={[setup.usb[0], setup.usb[1] - 50 * usbAway]} text={powerStep ? 'base off the laptop' : 'USB out'} tone="you" size={9} /> : null}
          {t > end + 0.6 ? <Tag at={powerStep ? [215, 428] : [setup.usb[0], setup.usb[1] - 50 * usbAway]} text={powerStep ? 'charger in' : 'USB in · tell Claude'} tone="you" size={9} /> : null}
          {t > end + 1.2 && !showSupply ? (
            <text x={290} y={442} textAnchor="middle" fontSize={7} fill="var(--ink, #222)" opacity={0.75} paintOrder="stroke" stroke="var(--paper, #fff)" strokeWidth={2}>
              Rows here are an example: any free row works, as long as each wire meets its part in the same row of five.
            </text>
          ) : null}
        </>
      );
    },
  };
}

/** The bench wires of the off-the-base step, in the order they are made. */
export const BENCH_B_IDS = BENCH_B.map((wire) => wire.id);
export const SUPPLY_B_IDS = SUPPLY_B.map((wire) => wire.id);
