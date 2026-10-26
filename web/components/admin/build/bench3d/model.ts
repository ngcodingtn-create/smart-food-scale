/**
 * The owner's bench in 3D, as numbers: where every NodeMCU pin and breadboard hole is,
 * and the types a step's scene is written in. No three.js here, so scenes stay plain data.
 *
 * Millimetres. X: across (the breadboard is on the +X side of the NodeMCU), Y: up,
 * Z: towards the owner. The NodeMCU lies upside down, pins up, its far end towards the
 * owner (+Z) and its USB away (-Z): the way they hold it (ai-docs/EXPLAINING.md).
 */

export type V3 = [number, number, number];

// --- the NodeMCU, upside down -------------------------------------------------------------
export const PCB_TOP = 5; // it lies on its Wi-Fi module
export const PIN_TOP = PCB_TOP + 8.5;
export const ROW_X = { d: 11.43, outer: -11.43 } as const;
/** The row next to the breadboard (D) and the outer row, each counted from the far end, 1 to 15. */
export const D_ROW = ['D0', 'D1', 'D2', 'D3', 'D4', '3V', 'G', 'D5', 'D6', 'D7', 'D8', 'RX', 'TX', 'G', '3V'];
export const OUTER_ROW = ['A0', 'G', 'VU', 'S3', 'S2', 'S1', 'SC', 'S0', 'SK', 'G', '3V', 'EN', 'RST', 'G', 'VIN'];
export const pinZ = (n: number) => 17.78 - (n - 1) * 2.54;
export const ORDINAL = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th', '13th', '14th', '15th'];

// --- the breadboard, beside it --------------------------------------------------------------
export const BB = { x0: 27, width: 51, zFront: 42, length: 165, top: 9 };
export type Col = 'L+' | 'L-' | 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'R-' | 'R+';
export const COL_X: Record<Col, number> = {
  'L+': 31, 'L-': 33.54, a: 39, b: 41.54, c: 44.08, d: 46.62, e: 49.16, f: 56.78, g: 59.32, h: 61.86, i: 64.4, j: 66.94, 'R-': 72.4, 'R+': 74.94,
};
export const ROWS = 63;
/** Row 1 is at the end nearest the owner, beside the NodeMCU's far end. */
export const rowZ = (row: number) => BB.zFront - 3.5 - (row - 1) * 2.54;
export const isRail = (col: Col) => col.length === 2;

// --- the HX711, standing on its pins in front of the outer row, like the display -----------------
/** Its outline is SparkFun's reference board (rig/specs.ts), until the owner's photo shows theirs. */
export const HX711_AT = { x: -44, y: 14.5, z: 34 };
/** The end towards the NodeMCU, and the far end; each counted from the back (-Z). */
export const HX_SIGNAL = ['GND', 'DT', 'SCK', 'VCC'];
export const HX_CELL = ['E+', 'E−', 'A−', 'A+', 'B−', 'B+'];
export function hxPin(name: string): V3 {
  const s = HX_SIGNAL.indexOf(name);
  if (s >= 0) return [HX711_AT.x + 13.5, HX711_AT.y, HX711_AT.z - 3.81 + s * 2.54];
  const c = HX_CELL.indexOf(name);
  if (c < 0) throw new Error(`No HX711 pin ${name}`);
  return [HX711_AT.x - 13.5, HX711_AT.y, HX711_AT.z - 6.35 + c * 2.54];
}

// --- the load cell: on a thick book, its wired end taped down, its free end out over the edge -----
/** 75 × 12.7 × 12.7 mm, the seller's figures (rig/specs.ts). The book is any thick one. */
export const BOOK = { x0: -128, x1: -72, z0: -80, z1: 0, h: 28 };
export const CELL = { x: -100, z0: -45, z1: 30, size: 12.7 };
/** Where a known mass sits: in a small cup taped on the free end. */
export const CUP: V3 = [CELL.x, BOOK.h + CELL.size, 21];
/** The blue 4-way connector on the cell's wires, lying on the desk, and its four jumpers' ends. */
export const CONNECTOR = { x: -80, z: 56 };
export const connectorPin = (k: number): V3 => [CONNECTOR.x - 3.81 + k * 2.54, 2.6, CONNECTOR.z + 4];

// --- what a scene is made of -----------------------------------------------------------------
/** A wire's end: a NodeMCU pin, a breadboard hole, a pin of the display or of the HX711 (each standing on its plugs), or a point. */
export type End = { pin: ['d' | 'outer', number] } | { hole: [Col, number] } | { dpin: number } | { hx: string } | { at: V3 };

export type WireSpec = {
  id: string;
  from: End;
  to: End;
  colour: string;
  /** What is on each end: f, a socket pushed onto a pin; m, a pin pushed into a hole. */
  ends: 'ff' | 'fm' | 'mm' | 'mf';
  /** How high it arches, to keep wires apart. */
  lift?: number;
};

export type PartSpec =
  | { id: string; kind: 'display'; lit?: boolean }
  | { id: string; kind: 'button'; rows: [number, number] }
  | { id: string; kind: 'transistor'; col: Col; row: number }
  | { id: string; kind: 'resistor'; from: [Col, number]; to: [Col, number]; bands: string[] }
  | { id: string; kind: 'diode'; from: [Col, number]; to: [Col, number] }
  | { id: string; kind: 'buzzer'; col: Col; row: number }
  /** `bare`: no pins yet; `pins` adds the two strips alone. */
  | { id: string; kind: 'hx711'; bare?: boolean }
  | { id: string; kind: 'hx-pins' }
  /** On the book, or lying on the desk where the book will go. */
  | { id: string; kind: 'loadcell'; onBook?: boolean }
  | { id: string; kind: 'book' }
  | { id: string; kind: 'tape' }
  | { id: string; kind: 'cup' }
  /** Across two holes: the 10 µF stands on its legs, its striped leg in `to`; the 100 nF is a small disc. */
  | { id: string; kind: 'cap'; type: 'electrolytic' | 'ceramic'; from: [Col, number]; to: [Col, number] };

export type Tag = { at: End | V3; text: string; small?: string; tone?: 'you' | 'ok' | 'claude' };
export type Cam = 'bench' | 'mcu' | 'mcu-near' | 'display' | 'usb' | { rows: [number, number]; side?: 'left' | 'right' } | [V3, V3];

export type Beat = {
  title: string;
  who: 'you' | 'claude';
  text: string[];
  cam: Cam;
  /** Wires and parts that appear in this beat, one after the other. */
  add?: string[];
  /** A pulsing ring round this pin or hole. */
  ring?: End;
  tags?: Tag[];
  /** The USB plug: pulled out, pushed in, or left as it is. */
  usb?: 'out' | 'in';
  /** The display's screen switches on. */
  screen?: boolean;
  /** What the display shows from this beat on: top line, the number, the bottom line. */
  lines?: [string, string, string];
  /** A finger presses here: `tap` lets go at once, `hold` stays down to the end of the beat. */
  press?: { at: End | V3; how: 'tap' | 'hold' | 'press' };
  /** A known mass goes into the cup, or comes out. */
  mass?: 'in' | 'out';
  T?: number;
};

export type BenchScene = {
  /** What is on the bench before the first beat. */
  parts: PartSpec[];
  wires: WireSpec[];
  /** Added in the beats, in order. */
  newParts?: PartSpec[];
  newWires?: WireSpec[];
  beats: Beat[];
  /** The same content as plain cards under the scene. */
  cards?: { title: string; text: string; colour?: string }[];
  usbStartsIn?: boolean;
};

/** Where the display stands once it is wired straight to the NodeMCU, screen up, on its four plugs. */
export const DISPLAY = { x: 14, y: 14.5, z: 52 };
export const displayPin = (k: number): V3 => [DISPLAY.x - 3.81 + k * 2.54, DISPLAY.y, DISPLAY.z - 12];

/** A point for an end, at the height the wire leaves it. */
export function endPoint(end: End): V3 {
  if ('pin' in end) return [ROW_X[end.pin[0]], PIN_TOP, pinZ(end.pin[1])];
  if ('hole' in end) return [COL_X[end.hole[0]], BB.top, rowZ(end.hole[1])];
  if ('dpin' in end) return displayPin(end.dpin);
  if ('hx' in end) return hxPin(end.hx);
  return end.at;
}

/** "row next to the breadboard, 8th pin from the far end": how to find a pin whose name is underneath. */
export function pinWords(row: 'd' | 'outer', n: number) {
  return `${row === 'd' ? 'row next to the breadboard' : 'outer row'}, ${ORDINAL[n]} pin from the far end`;
}
export const pinName = (row: 'd' | 'outer', n: number) => (row === 'd' ? D_ROW : OUTER_ROW)[n - 1];
