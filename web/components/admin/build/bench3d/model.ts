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
/**
 * The owner's XFW-HX711, measured from their photo of 26 October against its 2.54 mm pin pitch
 * (so about a millimetre either way): 24.6 × 16 mm, its pins soldered on, pointing down.
 */
export const HX711_AT = { x: -44, y: 14.5, z: 34 };
export const HX_BOARD = { w: 24.6, d: 16, cellPinX: -10.6, signalPinX: 10 };
/** The end towards the NodeMCU, and the far end; each counted from the back (-Z), as printed. */
export const HX_SIGNAL = ['GND', 'DT', 'SCK', 'VCC'];
export const HX_CELL = ['E+', 'E−', 'A−', 'A+', 'B−', 'B+'];
export function hxPin(name: string): V3 {
  const s = HX_SIGNAL.indexOf(name);
  if (s >= 0) return [HX711_AT.x + HX_BOARD.signalPinX, HX711_AT.y, HX711_AT.z - 3.81 + s * 2.54];
  const c = HX_CELL.indexOf(name);
  if (c < 0) throw new Error(`No HX711 pin ${name}`);
  return [HX711_AT.x + HX_BOARD.cellPinX, HX711_AT.y, HX711_AT.z - 6.35 + c * 2.54];
}

// --- the load cell: on a cone of the owner's egg carton, screwed down at its wired end -------------------
/**
 * The support the owner made (photos, 26 October): an egg carton, cups up. The cell's wired end sits
 * on the tip of one cone, a screw down through its inner hole into the cone; the label end is in the
 * air over a cup. The power bank stands on edge in the back cups, behind the wired end. Sizes are
 * judged from the photos, not measured. `h` is the cone's tip, where the cell's underside sits;
 * `rim` the cups' top edge; `pitch` the distance between cups. The cell is drawn 75 × 12.7 × 12.7 mm
 * (rig/specs.ts); the owner's is labelled 20 kg, and its exact length was not measured.
 */
export const BOOK = { x0: -220, x1: -70, z0: -55, z1: 45, h: 45, rim: 30, pitch: 50, coneZ: -5.5 };
export const CELL = { x: -120, z0: -20, z1: 55, size: 12.7 };
/** The power bank on its long edge, its face just behind the wired end. Judged from the photos. */
export const POWER_BANK = { x: -110, w: 140, h: 70, d: 25, z1: -22, y0: 8 };
/** Where a known mass sits: in a small cup taped on the free end. */
export const CUP: V3 = [CELL.x, BOOK.h + CELL.size, 45];
/** The blue 4-way connector on the cell's wires, lying on the desk, and its four jumpers' ends. */
export const CONNECTOR = { x: -58, z: 64 };
export const connectorPin = (k: number): V3 => [CONNECTOR.x - 3.81 + k * 2.54, 2.6, CONNECTOR.z + 4];

// --- the camera: the ESP32-CAM, its MB base on the desk right of the breadboard --------------------
/** Its pins as printed, each list from the microSD end; 27 × 40.5 mm, the first pin 4.4 mm from that end (owner's photo). */
export const CAM_LEFT = ['5V', 'GND', 'IO12', 'IO13', 'IO15', 'IO14', 'IO2', 'IO4'];
export const CAM_RIGHT = ['3V3', 'IO16', 'IO0', 'GND', 'VCC', 'U0R', 'U0T', 'GND'];
export const CAM_BOARD = { w: 27, l: 40.5, firstPin: 4.4 };
/** On the breadboard: lens up, its ESP32-CAM end towards the owner; 5V's column in b, the pins from row 36 to row 43. */
export const CAM_FAR_ROW = 43;
export function camHole(name: string, nth = 0): [Col, number] {
  const spots = [
    ...CAM_LEFT.flatMap((n, i) => (n === name ? [['b', CAM_FAR_ROW - i] as [Col, number]] : [])),
    ...CAM_RIGHT.flatMap((n, i) => (n === name ? [['i', CAM_FAR_ROW - i] as [Col, number]] : [])),
  ];
  if (!spots[nth]) throw new Error(`No ESP32-CAM pin ${name}`);
  return spots[nth];
}
/** The camera's middle, on the breadboard: its far pin row 4.4 mm from the microSD end. */
export const CAM_ON_BB = { x: (COL_X.b + COL_X.i) / 2, z: rowZ(CAM_FAR_ROW) - CAM_BOARD.firstPin + CAM_BOARD.l / 2, y: BB.top + 3.2 };
/** The MB base lies on the desk right of the breadboard, its USB socket away from the owner. */
export const BASE_AT = { x: 118, z: -58 };
export const BASE_SOCKET_TOP = 11.6;
/** A base socket, named as the camera pin that goes into it. Seated, the camera's microSD end is towards the owner. */
export function baseSocket(name: string, nth = 0): V3 {
  const spots = [
    ...CAM_LEFT.flatMap((n, i) => (n === name ? [[BASE_AT.x + 11.43, i] as [number, number]] : [])),
    ...CAM_RIGHT.flatMap((n, i) => (n === name ? [[BASE_AT.x - 11.43, i] as [number, number]] : [])),
  ];
  if (!spots[nth]) throw new Error(`No base socket ${name}`);
  const [x, i] = spots[nth];
  return [x, BASE_SOCKET_TOP, BASE_AT.z + CAM_BOARD.l / 2 - CAM_BOARD.firstPin - i * 2.54];
}
/** The six LEDs of the light: long leg in column j of the row, short leg in the right − rail one row on (rails skip every sixth row). */
export const LED_ROWS = [46, 49, 51, 55, 57, 61];

// --- away from the bench --------------------------------------------------------------------------
export const PHONE_AT = { x: 150, z: 62 };
export const LAPTOP_AT = { x: 0, z: -300 };
/** The rig, alone on the desk (rig/specs.ts): the plate's eating surface. */
export const RIG_PLATE_TOP: V3 = [0, 73, -15];
/** A phone charger on the desk, its USB cable cut at the far end: where its red and black leads come out. */
export const CHARGER_AT = { x: 200, z: -10 };
export const CHARGER_LEADS: V3 = [96, 2.5, -30];

// --- what a scene is made of -----------------------------------------------------------------
/** A wire's end: a NodeMCU pin, a breadboard hole, a pin of the display or of the HX711 (each standing on its plugs), or a point. */
export type End = { pin: ['d' | 'outer', number] } | { hole: [Col, number] } | { dpin: number } | { hx: string } | { base: string; nth?: number } | { at: V3 };

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
  /** Across two holes: an electrolytic stands on its legs, its striped leg in `to`; a ceramic is a small disc. */
  | { id: string; kind: 'cap'; type: 'electrolytic' | 'ceramic'; from: [Col, number]; to: [Col, number] }
  | { id: string; kind: 'mb-base' }
  | { id: string; kind: 'esp32cam'; on: 'base' | 'breadboard' }
  | { id: string; kind: 'base-usb' }
  | { id: string; kind: 'led'; row: number }
  | { id: string; kind: 'sdcard' }
  | { id: string; kind: 'phone' }
  | { id: string; kind: 'laptop' }
  | { id: string; kind: 'charger' }
  /** A piece of the rig, from rig/specs.ts. */
  | { id: string; kind: 'rig'; piece: 'base' | 'spacer' | 'cell' | 'platform' | 'plate' | 'post' | 'camera' | 'panel' };

export type Tag = { at: End | V3; text: string; small?: string; tone?: 'you' | 'ok' | 'claude' };
export type Cam = 'bench' | 'mcu' | 'mcu-near' | 'display' | 'usb' | { rows: [number, number]; side?: 'left' | 'right' } | [V3, V3];

export type Beat = {
  title: string;
  who: 'you' | 'claude';
  text: string[];
  cam: Cam;
  /** Wires and parts that appear in this beat, one after the other. */
  add?: string[];
  /** Wires and parts already on the bench that come off in this beat. */
  remove?: string[];
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
  /** Food goes into the cup (or onto the plate), or comes off. */
  food?: 'in' | 'out';
  /** The light's LEDs and the camera's own LED shine during this beat. */
  light?: boolean;
  /** What the laptop's and the phone's screens show from this beat on. */
  laptop?: string[];
  phone?: string[];
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
  /** false: no breadboard or NodeMCU, for the rig and the steps on the laptop and phone. */
  bench?: boolean;
  /** Where masses and food go, when not the cup on the bench (the rig's plate). */
  loadAt?: V3;
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
  if ('base' in end) return baseSocket(end.base, end.nth);
  return end.at;
}

/** "row next to the breadboard, 8th pin from the far end": how to find a pin whose name is underneath. */
export function pinWords(row: 'd' | 'outer', n: number) {
  return `${row === 'd' ? 'row next to the breadboard' : 'outer row'}, ${ORDINAL[n]} pin from the far end`;
}
export const pinName = (row: 'd' | 'outer', n: number) => (row === 'd' ? D_ROW : OUTER_ROW)[n - 1];
