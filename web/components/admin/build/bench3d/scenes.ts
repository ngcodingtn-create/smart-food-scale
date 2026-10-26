import { DIM } from '@/components/rig/specs';
import { BOOK, CELL, CHARGER_LEADS, COL_X, CONNECTOR, CUP, LED_ROWS, RIG_PLATE_TOP, connectorPin, pinName, pinWords, rowZ, BB, type BenchScene, type Col, type PartSpec, type V3, type WireSpec } from './model';

/**
 * Every step that has its 3D explanation, keyed `milestone/step`. Drawn from the owner's
 * bench as their photos showed it (ai-docs/EXPLAINING.md): the NodeMCU upside down, its
 * 3V and G taken from the outer row, the display wired straight to the D row.
 * Steps without an entry keep their 2.5D scene until they get one.
 */

const pin = (row: 'd' | 'outer', n: number) => ({ pin: [row, n] as ['d' | 'outer', number] });
const say = (row: 'd' | 'outer', n: number) => ({ text: `${pinName(row, n)}`, small: pinWords(row, n) });

// What the owner's bench has, step by step.
const RAILS: WireSpec[] = [
  { id: 'rail-g', from: pin('outer', 10), to: { hole: ['L-', 22] }, colour: 'grey', ends: 'fm' },
  { id: 'rail-3v', from: pin('outer', 11), to: { hole: ['L+', 21] }, colour: 'teal', ends: 'fm' },
  { id: 'rail-5v', from: pin('outer', 3), to: { hole: ['R+', 27] }, colour: 'purple', ends: 'fm', lift: 26 },
];
const DISPLAY_WIRES: WireSpec[] = [
  { id: 'disp-vcc', from: { dpin: 0 }, to: pin('d', 6), colour: 'red', ends: 'ff' },
  { id: 'disp-gnd', from: { dpin: 1 }, to: pin('d', 7), colour: 'black', ends: 'ff' },
  { id: 'disp-scl', from: { dpin: 2 }, to: pin('d', 2), colour: 'green', ends: 'ff' },
  { id: 'disp-sda', from: { dpin: 3 }, to: pin('d', 3), colour: 'blue', ends: 'ff' },
];
const GROUND_BRIDGE: WireSpec = { id: 'gnd-bridge', from: { hole: ['L-', 3] }, to: { hole: ['R-', 3] }, colour: 'black', ends: 'mm', lift: 14 };
const BUTTON: WireSpec[] = [
  { id: 'btn-d5', from: pin('d', 8), to: { hole: ['a', 8] }, colour: 'white', ends: 'fm' },
  { id: 'btn-gnd', from: { hole: ['j', 10] }, to: { hole: ['R-', 10] }, colour: 'black', ends: 'mm', lift: 6 },
];
const BUZZER: WireSpec[] = [
  { id: 'buz-d8', from: pin('d', 11), to: { hole: ['a', 14] }, colour: 'yellow', ends: 'fm' },
  { id: 'buz-e', from: { hole: ['a', 16] }, to: { hole: ['L-', 16] }, colour: 'black', ends: 'mm', lift: 5 },
  { id: 'buz-c', from: { hole: ['d', 18] }, to: { hole: ['f', 18] }, colour: 'blue', ends: 'mm', lift: 8 },
  { id: 'buz-s', from: { hole: ['g', 16] }, to: { hole: ['R+', 24] }, colour: 'red', ends: 'mm', lift: 16 },
];

const CHECK = 'Claude reads the board from the laptop. The live page, Wire it, live, shows the same.';

// Milestone 1, finished: what is on the bench when milestone 2 starts.
const M1_PARTS: PartSpec[] = [
  { id: 'display', kind: 'display', lit: true },
  { id: 'button', kind: 'button', rows: [8, 10] },
  { id: 'q1', kind: 'transistor', col: 'c', row: 16 },
  { id: 'r1k', kind: 'resistor', from: ['b', 14], to: ['b', 17], bands: ['brown', 'black', 'red'] },
  { id: 'buzzer', kind: 'buzzer', col: 'j', row: 16 },
  { id: 'diode', kind: 'diode', from: ['h', 16], to: ['h', 18] },
];
const M1_WIRES: WireSpec[] = [...RAILS, ...DISPLAY_WIRES, GROUND_BRIDGE, ...BUTTON, ...BUZZER];

// Milestone 2: the HX711 standing on its sockets left of the NodeMCU, the cell on a book further left.
const HX: PartSpec = { id: 'hx711', kind: 'hx711' };
const HX_WIRES: WireSpec[] = [
  { id: 'hx-gnd', from: { hx: 'GND' }, to: { hole: ['L-', 5] }, colour: 'black', ends: 'fm', lift: 18 },
  { id: 'hx-vcc', from: { hx: 'VCC' }, to: { hole: ['L+', 5] }, colour: 'red', ends: 'fm', lift: 22 },
  { id: 'hx-dt', from: { hx: 'DT' }, to: pin('d', 9), colour: 'yellow', ends: 'ff', lift: 26 },
  { id: 'hx-sck', from: { hx: 'SCK' }, to: pin('d', 10), colour: 'orange', ends: 'ff', lift: 30 },
];
/** One electrolytic (the owner's 100 µF 25 V): no ceramics in the kit, and the HX711 board has its own. */
const HX_CAPS: PartSpec[] = [{ id: 'c10u', kind: 'cap', type: 'electrolytic', from: ['L+', 7], to: ['L-', 7] }];
const MOUNT: PartSpec[] = [{ id: 'book', kind: 'book' }, { id: 'cell', kind: 'loadcell' }, { id: 'tape', kind: 'tape' }, { id: 'cup', kind: 'cup' }];
// Each HX711 pin, the cell's wire it needs, and the jumper that carries that wire out of the blue
// connector (the owner's photos, 26 October): red → yellow, black → red, white → brown, green → green.
const CELL_PINS = [['E+', 'red', 'yellow'], ['E−', 'black', 'red'], ['A−', 'white', 'brown'], ['A+', 'green', 'green']] as const;
const CELL_WIRES: WireSpec[] = CELL_PINS.map(([name, wire, jumper], k) => ({ id: `cw-${wire}`, from: { at: connectorPin(k) }, to: { hx: name }, colour: jumper, ends: 'mf', lift: 10 + k * 2 }));
const M2_PARTS: PartSpec[] = [...M1_PARTS, HX, ...HX_CAPS, ...MOUNT];
const M2_WIRES: WireSpec[] = [...M1_WIRES, ...HX_WIRES, ...CELL_WIRES];

// Where to look.
const CAM_HX: [V3, V3] = [[-112, 62, 112], [-44, 8, 34]];
const CAM_CELL: [V3, V3] = [[-200, 130, 140], [-95, 40, -25]];
const CAM_FREE_END: [V3, V3] = [[-165, 105, 115], [-100, 58, 15]];
const CAM_HX_RAILS: [V3, V3] = [[-8, 105, 150], [-6, 6, 26]];
const CAM_E_PINS: [V3, V3] = [[-120, 58, 120], [-62, 6, 42]];
const CAM_LEFT: [V3, V3] = [[-55, 165, 200], [-35, 0, -5]];
/** The top of the button, for a finger. */
const BUTTON_TOP: V3 = [(COL_X.e + COL_X.f) / 2, BB.top + 7.4, (rowZ(8) + rowZ(10)) / 2];
// --- milestones 3 to 9: the camera on its base, then on the far half of the breadboard ---------
const LAPTOP: PartSpec = { id: 'laptop', kind: 'laptop' };
const PHONE: PartSpec = { id: 'phone', kind: 'phone' };
const BASE: PartSpec = { id: 'base', kind: 'mb-base' };
const BASE_USB: PartSpec = { id: 'base-usb', kind: 'base-usb' };
const CAM_ON_BASE: PartSpec = { id: 'cam-base', kind: 'esp32cam', on: 'base' };
const CAM_BB: PartSpec = { id: 'cam', kind: 'esp32cam', on: 'breadboard' };
const M3_PARTS: PartSpec[] = [...M2_PARTS, LAPTOP, BASE, CAM_ON_BASE, BASE_USB];

/** For the light, the right − rail becomes the LEDs' common line: the ground bridge comes out, the button's ground moves left. */
const BTN_GND_LEFT: WireSpec = { id: 'btn-gnd-l', from: { hole: ['j', 10] }, to: { hole: ['L-', 11] }, colour: 'black', ends: 'mm', lift: 16 };
const M4_A_WIRES: WireSpec[] = [...RAILS, ...DISPLAY_WIRES, BUTTON[0], BTN_GND_LEFT, ...BUZZER, ...HX_WIRES, ...CELL_WIRES];
/** The camera, off its base, fed and heard through it: 5V and GND, U0R and U0T, and its ground joined to the scale's. */
const BASE_WIRES: WireSpec[] = [
  { id: 'x-base-5v', from: { base: '5V' }, to: { hole: ['a', 43] }, colour: 'red', ends: 'mm', lift: 26 },
  { id: 'x-base-gnd', from: { base: 'GND' }, to: { hole: ['j', 40] }, colour: 'black', ends: 'mm', lift: 14 },
  { id: 'x-base-u0r', from: { base: 'U0R' }, to: { hole: ['j', 38] }, colour: 'yellow', ends: 'mm', lift: 18 },
  { id: 'x-base-u0t', from: { base: 'U0T' }, to: { hole: ['j', 37] }, colour: 'green', ends: 'mm', lift: 22 },
  { id: 'x-gnd-link', from: { hole: ['a', 42] }, to: { hole: ['L-', 41] }, colour: 'black', ends: 'mm', lift: 6 },
];
const Q2: PartSpec = { id: 'q2', kind: 'transistor', col: 'c', row: 47 };
const R470: PartSpec = { id: 'r470', kind: 'resistor', from: ['b', 46], to: ['b', 48], bands: ['yellow', 'purple', 'brown'] };
const R10K: PartSpec = { id: 'r10k', kind: 'resistor', from: ['a', 48], to: ['L-', 49], bands: ['brown', 'black', 'orange'] };
const LIGHT_WIRES: WireSpec[] = [
  { id: 'x-io13', from: { hole: ['a', 40] }, to: { hole: ['a', 46] }, colour: 'purple', ends: 'mm', lift: 8 },
  { id: 'x-emitter', from: { hole: ['a', 47] }, to: { hole: ['L-', 47] }, colour: 'black', ends: 'mm', lift: 6 },
  { id: 'x-collector', from: { hole: ['d', 49] }, to: { hole: ['R-', 59] }, colour: 'blue', ends: 'mm', lift: 12 },
];
const LEDS: PartSpec[] = LED_ROWS.flatMap((row): PartSpec[] => [
  { id: `r100-${row}`, kind: 'resistor', from: ['R+', row], to: ['j', row], bands: ['brown', 'black', 'brown'] },
  { id: `led-${row}`, kind: 'led', row },
]);
const M4_PARTS: PartSpec[] = [...M2_PARTS, LAPTOP, BASE, BASE_USB, CAM_BB, Q2, R470, R10K, ...LEDS];
const M4_WIRES: WireSpec[] = [...M4_A_WIRES, ...BASE_WIRES, ...LIGHT_WIRES];

const CAM_BASE_VIEW: [V3, V3] = [[150, 70, 40], [118, 8, -58]];
const CAM_LAPTOP: [V3, V3] = [[30, 205, 20], [0, 118, -405]];
const CAM_PHONE: [V3, V3] = [[165, 195, 150], [150, 0, 58]];
const CAM_FAR_HALF: [V3, V3] = [[150, 140, 30], [55, 0, -75]];
const CAM_CAM_BB: [V3, V3] = [[120, 85, -10], [53, 9, -55]];
const CAM_LIGHT: [V3, V3] = [[130, 95, -50], [56, 9, -118]];
const CAM_LIGHT_LEFT: [V3, V3] = [[-15, 80, -55], [42, 9, -100]];
const CAM_WHOLE: [V3, V3] = [[60, 260, 260], [10, 0, -60]];
const holeTag = (col: Col, row: number) => ({ hole: [col, row] as [Col, number] });

// The rig, from rig/specs.ts, alone on the desk.
const RIG_PIECES: PartSpec[] = (['base', 'spacer', 'cell', 'platform', 'plate', 'post', 'camera', 'panel'] as const).map((piece) => ({ id: `rig-${piece}`, kind: 'rig', piece }));
const CAM_RIG: [V3, V3] = [[320, 300, 420], [0, 120, -20]];
const CAM_RIG_LOW: [V3, V3] = [[210, 150, 240], [0, 45, -15]];
const CAM_RIG_HIGH: [V3, V3] = [[300, 520, 260], [0, 330, -50]];
const CAM_RIG_FRONT: [V3, V3] = [[60, 140, 260], [0, 50, 90]];
const RIG_BUTTON_TOP: V3 = [27, 38 + 3.6 + 3, 101];

const FREE_END: V3 = [CELL.x, BOOK.h + CELL.size, 27];
/** The cup's front rim, where a finger presses. */
const CUP_RIM: V3 = [CUP[0], CUP[1] + 10, CUP[2] + 8];
const CUP_TAG: V3 = [CUP[0], CUP[1] + 16, CUP[2]];

export const BENCH_SCENES: Record<string, BenchScene> = {
  'm1-scale-brain/port': {
    parts: [],
    wires: [],
    usbStartsIn: false,
    beats: [
      { title: 'Your NodeMCU, upside down', who: 'you', text: ['Pins up, the USB socket at the far side, away from you. The breadboard on its right.'], cam: 'bench', tags: [{ at: [0, 6, -38], text: 'USB socket', small: 'away from you' }] },
      { title: 'Plug the USB in', who: 'you', text: ['Push the micro-USB plug straight into the socket until it stops. It only goes in one way up.', 'The other end into the laptop.'], cam: 'usb', usb: 'in', tags: [{ at: [0, 8, -42], text: 'push it all the way in', tone: 'you' }] },
      { title: 'Claude finds the port', who: 'claude', text: ['Claude looks for the board on USB: a CH340 on COM5. Nothing for you to do.'], cam: 'bench', tags: [{ at: [0, 20, 0], text: 'COM5 · CH340', tone: 'ok' }] },
    ],
    cards: [{ title: 'Not found?', text: 'Push the plug in harder: a plug not fully in is the usual cause. Some cables only charge: try another.' }],
  },
  'm1-scale-brain/flash': {
    parts: [],
    wires: [],
    beats: [
      { title: 'Claude flashes the pretend scale', who: 'claude', text: ['From the laptop, over the USB. About a minute. You do nothing.'], cam: 'bench', tags: [{ at: [0, 20, 0], text: 'flashing…', small: 'node-a-nodemcu-sim', tone: 'claude' }] },
      { title: 'It starts', who: 'claude', text: ['Claude reads its first line: E boot node=a … simulated=1. The pretend scale reads 0.0 g.'], cam: 'bench', tags: [{ at: [0, 20, 0], text: 'E boot node=a', small: 'it answers', tone: 'ok' }] },
    ],
  },
  'm1-scale-brain/rails': {
    parts: [],
    wires: [],
    newWires: RAILS,
    beats: [
      { title: 'USB out', who: 'you', text: ['Always first: nothing is wired with the power on.'], cam: 'bench', usb: 'out' },
      { title: '3V → the left + rail', who: 'you', add: ['rail-3v'], ring: pin('outer', 11), text: [`Outer row, the 11th pin from the far end: that is 3V.`, 'A female–male jumper: socket on the pin, its pin into the left + rail (the red line).'], cam: 'mcu', tags: [{ at: pin('outer', 11), ...say('outer', 11), tone: 'you' }] },
      { title: 'G → the left − rail', who: 'you', add: ['rail-g'], ring: pin('outer', 10), text: ['The pin before it, the 10th: that is G, ground.', 'Into the left − rail (the blue line).'], cam: 'mcu', tags: [{ at: pin('outer', 10), ...say('outer', 10), tone: 'you' }] },
      { title: 'VU → the right + rail', who: 'you', add: ['rail-5v'], ring: pin('outer', 3), text: ['Outer row, the 3rd pin from the far end: VU, the USB’s 5 V. Not VIN, by the USB: on this board VIN gives no 5 V on USB.', 'Across to the right + rail. Keep the two + rails apart: 3.3 V on the left, 5 V on the right.'], cam: 'bench', tags: [{ at: pin('outer', 3), ...say('outer', 3), tone: 'you' }] },
      { title: 'USB in', who: 'claude', usb: 'in', text: ['Claude restarts the board: it still starts, so nothing is short-circuited.'], cam: 'bench' },
    ],
    cards: [
      { title: '3V → left + rail', text: 'Outer row, 11th pin from the far end.', colour: 'teal' },
      { title: 'G → left − rail', text: 'Outer row, 10th pin from the far end.', colour: 'grey' },
      { title: 'VU → right + rail', text: 'Outer row, the 3rd pin from the far end.', colour: 'purple' },
    ],
  },
  'm1-scale-brain/display': {
    parts: [],
    wires: RAILS,
    newParts: [{ id: 'display', kind: 'display' }],
    newWires: DISPLAY_WIRES,
    beats: [
      { title: 'USB out', who: 'you', text: ['The display is wired straight to the NodeMCU: no breadboard in its way.'], cam: 'bench', usb: 'out' },
      { title: 'Four sockets onto the display', who: 'you', add: ['display'], text: ['Hold it screen up: its four long pins point down.', 'A female–female jumper’s socket onto each: VCC, GND, SCL, SDA. Stand it in front of the NodeMCU.'], cam: 'display', tags: [{ at: [14, 20, 40], text: 'a socket on each pin', small: 'VCC GND SCL SDA', tone: 'you' }] },
      { title: 'VCC → 6th pin', who: 'you', add: ['disp-vcc'], ring: pin('d', 6), text: ['Row next to the breadboard, the 6th pin from the far end: 3V.'], cam: 'mcu', tags: [{ at: pin('d', 6), text: 'VCC → 6th pin', small: 'that pin is 3V', tone: 'you' }] },
      { title: 'GND → 7th pin', who: 'you', add: ['disp-gnd'], ring: pin('d', 7), text: ['The next pin, the 7th: G.'], cam: 'mcu', tags: [{ at: pin('d', 7), text: 'GND → 7th pin', small: 'that pin is G', tone: 'you' }] },
      { title: 'SCL → 2nd pin', who: 'you', add: ['disp-scl'], ring: pin('d', 2), text: ['Back towards the far end: the 2nd pin, D1.'], cam: 'mcu', tags: [{ at: pin('d', 2), text: 'SCL → 2nd pin', small: 'that pin is D1', tone: 'you' }] },
      { title: 'SDA → 3rd pin', who: 'you', add: ['disp-sda'], ring: pin('d', 3), text: ['The 3rd pin, next to it: D2.'], cam: 'mcu', tags: [{ at: pin('d', 3), text: 'SDA → 3rd pin', small: 'that pin is D2', tone: 'you' }] },
      { title: 'USB in: it lights up', who: 'claude', usb: 'in', screen: true, text: ['CAMERA ?, 0.0 g, READY.', `${CHECK} It found the display: found=3c.`], cam: 'bench', tags: [{ at: [14, 26, 52], text: 'CAMERA ?  0.0 g  READY', tone: 'ok' }] },
    ],
    cards: [
      { title: 'VCC → 6th pin', text: 'Row next to the breadboard, from the far end. That pin is 3V.', colour: 'red' },
      { title: 'GND → 7th pin', text: 'That pin is G.', colour: 'black' },
      { title: 'SCL → 2nd pin', text: 'That pin is D1.', colour: 'green' },
      { title: 'SDA → 3rd pin', text: 'That pin is D2.', colour: 'blue' },
    ],
  },
  'm1-scale-brain/tare': {
    parts: [{ id: 'display', kind: 'display', lit: true }],
    wires: [...RAILS, ...DISPLAY_WIRES],
    newParts: [{ id: 'button', kind: 'button', rows: [8, 10] }],
    newWires: [GROUND_BRIDGE, ...BUTTON],
    beats: [
      { title: 'USB out', who: 'you', text: ['Nothing is wired with the power on.'], cam: 'bench', usb: 'out', screen: false },
      { title: 'Ground on both sides', who: 'you', add: ['gnd-bridge'], text: ['A male–male jumper from the left − rail to the right − rail, near the end by you (row 3).', 'Now ground is on both sides of the breadboard.'], cam: { rows: [1, 6] }, tags: [{ at: { hole: ['L-', 3] }, text: 'left − rail', tone: 'you' }, { at: { hole: ['R-', 3] }, text: 'right − rail', tone: 'you' }] },
      { title: 'The button across the gap', who: 'you', add: ['button'], text: ['Its legs in columns e and f, rows 8 and 10: it sits across the middle gap.', 'Press it down until it sits flat.'], cam: { rows: [6, 12] }, tags: [{ at: { hole: ['e', 9] }, text: 'across the middle gap', small: 'rows 8 and 10', tone: 'you' }] },
      { title: 'D5 → the button’s row 8', who: 'you', add: ['btn-d5'], ring: pin('d', 8), text: ['Row next to the breadboard, the 8th pin from the far end: D5.', 'A female–male jumper: socket on D5, its pin into row 8, column a: the same row as the button’s leg.'], cam: 'mcu', tags: [{ at: pin('d', 8), text: '8th pin', small: 'that pin is D5', tone: 'you' }, { at: { hole: ['a', 8] }, text: 'row 8, column a' }] },
      { title: 'The opposite leg to ground', who: 'you', add: ['btn-gnd'], ring: { hole: ['j', 10] }, text: ['The diagonally opposite leg is in row 10 on the right. From row 10, column j, to the right − rail.'], cam: { rows: [7, 12], side: 'right' }, tags: [{ at: { hole: ['j', 10] }, text: 'row 10, column j → − rail', tone: 'you' }] },
      { title: 'USB in, hold, then click', who: 'claude', usb: 'in', screen: true, text: ['Hold the button 5 s: the display counts down, then TARE OK.', 'Then click it once: NOTHING ON IT. ' + CHECK], cam: 'bench', tags: [{ at: [52.97, 22, 18], text: 'hold 5 s, then click', tone: 'you' }] },
    ],
    cards: [
      { title: 'Ground bridge', text: 'Left − rail → right − rail, row 3. Male–male.', colour: 'black' },
      { title: 'Button', text: 'Across the middle gap, columns e and f, rows 8 and 10.' },
      { title: 'D5 → row 8', text: 'Row next to the breadboard, 8th pin from the far end → row 8, column a.', colour: 'white' },
      { title: 'Row 10 → − rail', text: 'From row 10, column j, to the right − rail.', colour: 'black' },
    ],
  },
  'm1-scale-brain/buzzer': {
    parts: [{ id: 'display', kind: 'display', lit: true }, { id: 'button', kind: 'button', rows: [8, 10] }],
    wires: [...RAILS, ...DISPLAY_WIRES, GROUND_BRIDGE, ...BUTTON],
    newParts: [
      { id: 'q1', kind: 'transistor', col: 'c', row: 16 },
      { id: 'r1k', kind: 'resistor', from: ['b', 14], to: ['b', 17], bands: ['brown', 'black', 'red'] },
      { id: 'buzzer', kind: 'buzzer', col: 'j', row: 16 },
      { id: 'diode', kind: 'diode', from: ['h', 16], to: ['h', 18] },
    ],
    newWires: BUZZER,
    beats: [
      { title: 'USB out', who: 'you', text: ['Nothing is wired with the power on.'], cam: 'bench', usb: 'out', screen: false },
      { title: 'The transistor', who: 'you', add: ['q1'], text: ['Column c, rows 16, 17, 18, its flat face towards the middle gap.', 'Looking at the flat face, legs down, the left leg is E: it goes in row 16, the row whose wire goes to the − rail. Then B in 17, C in 18.'], cam: { rows: [13, 19] }, tags: [{ at: { hole: ['c', 17] }, text: 'E · B · C', small: 'rows 16 · 17 · 18 · flat face to the gap', tone: 'you' }] },
      { title: 'The 1 kΩ resistor', who: 'you', add: ['r1k'], text: ['Column b, from row 14 to row 17: its far end joins the base’s row.', 'Bands brown, black, red: 1 kΩ.'], cam: { rows: [12, 19] }, tags: [{ at: { hole: ['b', 14] }, text: 'row 14' }, { at: { hole: ['b', 17] }, text: 'row 17: the base', tone: 'you' }] },
      { title: 'D8 → row 14', who: 'you', add: ['buz-d8'], ring: pin('d', 11), text: ['Row next to the breadboard, the 11th pin from the far end: D8.', 'Socket on D8, its pin into row 14, column a.'], cam: 'mcu', tags: [{ at: pin('d', 11), text: '11th pin', small: 'that pin is D8', tone: 'you' }] },
      { title: 'Emitter to ground', who: 'you', add: ['buz-e'], text: ['From row 16, column a, to the left − rail.'], cam: { rows: [13, 19] }, tags: [{ at: { hole: ['a', 16] }, text: 'row 16 → − rail', tone: 'you' }] },
      { title: 'The buzzer module', who: 'you', add: ['buzzer'], text: ['Its three pins down column j, rows 16, 17, 18: S at row 16, − at row 18. Its board hangs out over the right edge.', 'The + on the buzzer is on the S side.'], cam: { rows: [13, 20], side: 'right' }, tags: [{ at: { hole: ['j', 16] }, text: 'S', small: 'row 16' }, { at: { hole: ['j', 18] }, text: '−', small: 'row 18' }] },
      { title: 'Collector → buzzer −', who: 'you', add: ['buz-c'], text: ['From row 18, column d, across the gap to row 18, column f: the buzzer’s − row.'], cam: { rows: [14, 20] }, tags: [{ at: { hole: ['d', 18] }, text: 'C, row 18' }, { at: { hole: ['f', 18] }, text: 'buzzer −, row 18', tone: 'you' }] },
      { title: 'S → the 5 V rail', who: 'you', add: ['buz-s'], text: ['From row 16, column g, to the right + rail at row 24, past the buzzer’s board: the 5 V from VU.'], cam: { rows: [14, 25], side: 'right' }, tags: [{ at: { hole: ['g', 16] }, text: 'S row 16', tone: 'you' }, { at: { hole: ['R+', 24] }, text: '+ rail, 5 V' }] },
      { title: 'The diode across it', who: 'you', add: ['diode'], text: ['The 1N4148 in column h, from row 16 to row 18.', 'Its black band at row 16, towards S.'], cam: { rows: [14, 19], side: 'right' }, tags: [{ at: { hole: ['h', 16] }, text: 'band towards S', tone: 'you' }] },
      { title: 'USB in: a beep', who: 'claude', usb: 'in', screen: true, text: ['Claude sends “beep” from the laptop: you hear a short beep.', CHECK], cam: 'bench', tags: [{ at: [74, 26, -4], text: 'beep', tone: 'ok' }] },
    ],
    cards: [
      { title: 'Transistor', text: 'Column c, rows 16–18, flat face towards the gap. E (left leg, looking at the flat face) in row 16, the ground row.' },
      { title: '1 kΩ', text: 'Column b, row 14 to row 17.' },
      { title: 'D8 → row 14', text: 'Row next to the breadboard, 11th pin from the far end.', colour: 'yellow' },
      { title: 'Row 16 → left − rail', text: 'The emitter to ground.', colour: 'black' },
      { title: 'Buzzer module', text: 'Column j: S row 16, − row 18; its board over the right edge.' },
      { title: 'Row 18 d → row 18 f', text: 'Collector to the buzzer’s −.', colour: 'blue' },
      { title: 'Row 16 g → right + rail, row 24', text: 'S to 5 V.', colour: 'red' },
      { title: '1N4148', text: 'Column h, row 16 to row 18, band at row 16.' },
    ],
  },
  'm1-scale-brain/bench': {
    parts: [
      { id: 'display', kind: 'display', lit: true },
      { id: 'button', kind: 'button', rows: [8, 10] },
      { id: 'q1', kind: 'transistor', col: 'c', row: 16 },
      { id: 'r1k', kind: 'resistor', from: ['b', 14], to: ['b', 17], bands: ['brown', 'black', 'red'] },
      { id: 'buzzer', kind: 'buzzer', col: 'j', row: 16 },
      { id: 'diode', kind: 'diode', from: ['h', 16], to: ['h', 18] },
    ],
    wires: [...RAILS, ...DISPLAY_WIRES, GROUND_BRIDGE, ...BUTTON, ...BUZZER],
    beats: [
      { title: 'The scale’s brain, whole', who: 'you', text: ['Everything from milestone 1 on the bench. Leave the USB in.'], cam: 'bench' },
      { title: 'Claude runs the whole test', who: 'claude', screen: true, text: ['Pretend plate 420 g, tare, pretend food 150 g, a photo: the display shows each, the buzzer beeps.', 'Claude reads PASS for each part.'], cam: 'bench', tags: [{ at: [14, 26, 52], text: '150.0 g', small: 'NO CAMERA: right, for now', tone: 'ok' }] },
    ],
  },

  // --- milestone 2, real weight ------------------------------------------------------------------
  'm2-real-weight/meet-hx711': {
    parts: M1_PARTS,
    wires: M1_WIRES,
    newParts: [HX, { id: 'cell', kind: 'loadcell', onBook: false }],
    beats: [
      { title: 'The HX711', who: 'you', add: ['hx711'], text: ['A small green board: it turns the load cell’s tiny signal into a number for the NodeMCU.', 'Read the names printed beside its pins: GND, DT, SCK, VCC on one end; E+, E−, A−, A+, B−, B+ on the other.'], cam: CAM_HX, tags: [{ at: { hx: 'SCK' }, text: 'GND DT SCK VCC', small: 'to the NodeMCU', tone: 'you' }, { at: { hx: 'A−' }, text: 'E+ E− A− A+ B− B+', small: 'to the load cell', tone: 'you' }, { at: [-44, 30, 20], text: 'your XFW-HX711', small: 'its pins already soldered on' }] },
      { title: 'The load cell', who: 'you', add: ['cell'], text: ['The aluminium bar: it bends a hair under weight. The label on one end, “20Kg ↓”, says what it carries and the way the weight must push.', 'Its four wires, red, black, white, green, leave near the other end and run into the blue connector; four jumpers leave it: yellow, red, brown, green.'], cam: [[-160, 50, 140], [-95, 4, 14]], tags: [{ at: [CELL.x, 18, CELL.z1], text: '20Kg ↓', small: 'the label end' }, { at: [CONNECTOR.x, 9, CONNECTOR.z], text: 'blue connector', small: 'four jumpers leave it', tone: 'you' }] },
      { title: 'A photo of the connector', who: 'you', text: ['Your HX711 is drawn from your photos. One more on Bench Photos: the blue connector, close, every wire colour showing on both sides.', 'Claude then gives each jumper its real colour, before you wire anything.'], cam: CAM_LEFT, tags: [{ at: [-44, 26, 34], text: 'the HX711', small: 'photographed: done', tone: 'ok' }, { at: [CONNECTOR.x, 14, CONNECTOR.z], text: 'the connector', small: 'a photo, please', tone: 'you' }] },
    ],
    cards: [
      { title: 'HX711', text: 'GND DT SCK VCC to the NodeMCU; E+ E− A− A+ to the cell; B− B+ unused.' },
      { title: 'Load cell', text: 'Red, black, white, green, through the blue connector to four jumpers with sockets.' },
      { title: 'Photos', text: 'The HX711 from above; the blue connector close. On Bench Photos.' },
    ],
  },
  'm2-real-weight/headers': {
    parts: M1_PARTS,
    wires: M1_WIRES,
    newParts: [{ id: 'hx711', kind: 'hx711', bare: true }, { id: 'hx-pins', kind: 'hx-pins' }],
    beats: [
      { title: 'Yours: already done', who: 'you', add: ['hx711'], text: ['Your XFW-HX711 came with both pin strips soldered on: nothing to do here. Go on to the next step.', 'For a board that comes with only holes: the strips are soldered in at the lab.'], cam: CAM_HX, tags: [{ at: [-30, 18, 34], text: '4 holes', small: 'GND DT SCK VCC' }, { at: [-58, 18, 34], text: '6 holes', small: 'E+ to B+' }] },
      { title: 'The two strips, soldered', who: 'you', add: ['hx-pins'], text: ['A strip of 4 pins in the GND to VCC holes, a strip of 6 in the E+ to B+ holes, their long side down.', 'Each pin soldered on top, at the lab. Ask the technician if you have not soldered before.'], cam: CAM_HX, tags: [{ at: [-44, 24, 34], text: 'solder each pin on top', small: 'at the lab', tone: 'you' }] },
    ],
  },
  'm2-real-weight/hx711-wires': {
    parts: [...M1_PARTS, HX],
    wires: M1_WIRES,
    newParts: HX_CAPS,
    newWires: HX_WIRES,
    beats: [
      { title: 'USB out', who: 'you', text: ['Nothing is wired with the power on.'], cam: 'bench', usb: 'out', screen: false },
      { title: 'GND → the left − rail', who: 'you', add: ['hx-gnd'], ring: { hx: 'GND' }, text: ['A female–male jumper: socket on the HX711’s GND, its pin into the left − rail (the blue line), beside row 5.'], cam: CAM_HX_RAILS, tags: [{ at: { hx: 'GND' }, text: 'GND', tone: 'you' }, { at: { hole: ['L-', 5] }, text: 'left − rail', small: 'beside row 5' }] },
      { title: 'VCC → the left + rail', who: 'you', add: ['hx-vcc'], ring: { hx: 'VCC' }, text: ['Socket on VCC, its pin into the left + rail (the red line), beside row 5: the 3.3 V rail.', 'Never the + rail on the right: that one is 5 V.'], cam: CAM_HX_RAILS, tags: [{ at: { hx: 'VCC' }, text: 'VCC', tone: 'you' }, { at: { hole: ['L+', 5] }, text: 'left + rail, 3.3 V', small: 'not the right one' }] },
      { title: 'DT → 9th pin', who: 'you', add: ['hx-dt'], ring: pin('d', 9), text: ['A female–female jumper: DT to the row next to the breadboard, the 9th pin from the far end: D6.'], cam: 'mcu', tags: [{ at: pin('d', 9), text: 'DT → 9th pin', small: 'that pin is D6', tone: 'you' }] },
      { title: 'SCK → 10th pin', who: 'you', add: ['hx-sck'], ring: pin('d', 10), text: ['SCK to the next pin, the 10th: D7.'], cam: 'mcu', tags: [{ at: pin('d', 10), text: 'SCK → 10th pin', small: 'that pin is D7', tone: 'you' }] },
      { title: 'The capacitor', who: 'you', add: ['c10u'], text: ['One electrolytic across the left + and − rails, beside row 7: your 100 µF 25 V, or a 10 µF if one of yours reads that.', 'Its striped leg in the − rail. No small ceramic needed: the HX711 board has its own, beside its chip.'], cam: [[20, 88, 48], [33, 9, 21]], tags: [{ at: { hole: ['L-', 7] }, text: '100 µF', small: 'stripe in the − rail', tone: 'you' }] },
      { title: 'USB in', who: 'claude', usb: 'in', screen: true, text: ['Claude restarts the board and reads its boot line: it still starts, so nothing is short-circuited.'], cam: 'bench', tags: [{ at: [0, 20, 0], text: 'E boot node=a', small: 'it still starts', tone: 'ok' }] },
    ],
    cards: [
      { title: 'GND → left − rail', text: 'Female–male, beside row 5.', colour: 'black' },
      { title: 'VCC → left + rail', text: 'The 3.3 V rail, beside row 5. Never the 5 V rail.', colour: 'red' },
      { title: 'DT → 9th pin', text: 'Row next to the breadboard: D6. Female–female.', colour: 'yellow' },
      { title: 'SCK → 10th pin', text: 'Row next to the breadboard: D7. Female–female.', colour: 'orange' },
      { title: 'One electrolytic', text: 'Your 100 µF (or a 10 µF) across the left rails, beside row 7. Its stripe in the − rail.' },
    ],
  },
  'm2-real-weight/bench-mount': {
    parts: [...M1_PARTS, HX, ...HX_CAPS],
    wires: [...M1_WIRES, ...HX_WIRES],
    newParts: MOUNT,
    beats: [
      { title: 'Your round box', who: 'you', add: ['book'], text: ['Your round box, firm, on the desk left of the HX711. Any box or thick book that does not squash will do.'], cam: CAM_CELL },
      { title: 'The cell on it', who: 'you', add: ['cell'], text: ['The end its wires come out of on the box. The label end, “20Kg ↓”, out over the edge, in the air: about 3 cm out, at least.', 'Threaded holes up; the label’s arrow points down.'], cam: CAM_CELL, tags: [{ at: [CELL.x, BOOK.h + 18, CELL.z1], text: '20Kg ↓ end', small: 'out in the air', tone: 'you' }, { at: [CELL.x, BOOK.h + 22, -38], text: 'wired end', small: 'on the box' }] },
      { title: 'Hold the wired end down', who: 'you', add: ['tape'], text: ['Two strips of strong tape over the wired end, pressed down onto the box, then something heavy on top, like your power bank.', 'That end must not move at all. Lying loose, the bar only rocks: the readings mean nothing.'], cam: CAM_CELL, tags: [{ at: [CELL.x, BOOK.h + 40, -40], text: 'tape + something heavy', small: 'that end must not move', tone: 'you' }] },
      { title: 'A cup on the free end', who: 'you', add: ['cup'], text: ['Tape a small, light cup on the free end: the masses go in it.', 'Nothing else may touch the free end: not the book, not a wire.'], cam: CAM_FREE_END, tags: [{ at: CUP_TAG, text: 'a small light cup', small: 'touches nothing else', tone: 'you' }] },
    ],
    cards: [
      { title: 'Fixed end', text: 'The wired end, taped hard to a thick book.' },
      { title: 'Free end', text: 'Out in the air, the arrow pointing down, a small cup on top.' },
    ],
  },
  'm2-real-weight/cell-wires': {
    parts: [...M1_PARTS, HX, ...HX_CAPS, ...MOUNT],
    wires: [...M1_WIRES, ...HX_WIRES],
    newWires: CELL_WIRES,
    beats: [
      { title: 'USB out', who: 'you', text: ['Nothing is wired with the power on.'], cam: 'bench', usb: 'out', screen: false },
      ...CELL_PINS.map(([name, wire, jumper], k) => ({
        title: `${jumper[0].toUpperCase()}${jumper.slice(1)} jumper → ${name}`,
        who: 'you' as const,
        add: [`cw-${wire}`],
        ring: { hx: name },
        text: [`The ${jumper} jumper carries the cell’s ${wire} wire: its socket onto ${name}.`, ...(k === 1 ? ['Careful: the red jumper is not E+. It carries the black wire.'] : []), ...(k === 3 ? ['B− and B+ stay empty.'] : [])],
        cam: CAM_E_PINS,
        tags: [{ at: { hx: name }, text: `${jumper} → ${name}`, small: `the cell’s ${wire}`, tone: 'you' as const }],
      })),
      { title: 'USB in', who: 'claude', usb: 'in', screen: true, text: ['Claude restarts the board: it still starts. The real scale goes on in the next step.'], cam: 'bench' },
    ],
    cards: CELL_PINS.map(([name, wire, jumper]) => ({ title: `${jumper} jumper → ${name}`, text: `It carries the cell’s ${wire} wire.`, colour: jumper })),
  },
  'm2-real-weight/flash-real': {
    parts: M2_PARTS,
    wires: M2_WIRES,
    beats: [
      { title: 'Claude flashes the real scale', who: 'claude', text: ['From the laptop, over the USB: the image that reads the load cell. You do nothing.'], cam: CAM_LEFT, tags: [{ at: [0, 20, 0], text: 'flashing…', small: 'node-a-nodemcu', tone: 'claude' }] },
      { title: 'Raw counts, not grams yet', who: 'claude', lines: ['CAMERA ?', 'raw …', 'NOT CALIBRATED'], text: ['The display shows raw counts and NOT CALIBRATED: right, until the calibration.', 'Claude reads the counts from the laptop: they move a little on their own. That is the cell, alive.'], cam: 'display', tags: [{ at: [14, 26, 52], text: 'NOT CALIBRATED', small: 'right, for now', tone: 'ok' }] },
    ],
  },
  'm2-real-weight/sign': {
    parts: M2_PARTS,
    wires: M2_WIRES,
    beats: [
      { title: 'Hands off', who: 'claude', lines: ['CAMERA ?', 'raw …', 'NOT CALIBRATED'], text: ['Claude reads the counts with nothing on the cell.'], cam: CAM_FREE_END },
      { title: 'Press the cup down', who: 'you', press: { at: CUP_RIM, how: 'press' }, text: ['When Claude says “now”: press the cup down gently with one finger, then let go.'], cam: CAM_FREE_END, T: 3.4, tags: [{ at: [CUP_RIM[0], CUP_RIM[1] + 34, CUP_RIM[2]], text: 'press gently', small: 'then let go', tone: 'you' }] },
      { title: 'Up, or down?', who: 'claude', ring: { hx: 'A−' }, text: ['Rose: done. Fell, with the cell held as in step 2.4: USB out, swap the brown and green jumpers on A− and A+, USB in, and press again.'], cam: CAM_E_PINS, tags: [{ at: { hx: 'A−' }, text: 'brown on A−' }, { at: { hx: 'A+' }, text: 'green on A+', small: 'swap only if Claude says' }] },
    ],
  },
  'm2-real-weight/calibrate': {
    parts: M2_PARTS,
    wires: M2_WIRES,
    beats: [
      { title: 'Empty cup', who: 'claude', lines: ['CAMERA ?', 'raw …', 'NOT CALIBRATED'], text: ['Claude zeroes the scale with the cup empty.'], cam: CAM_FREE_END },
      { title: 'A known mass in', who: 'you', mass: 'in', text: ['Put a known mass in the cup and tell Claude its weight in grams.', 'A calibration mass from the lab, or something you weighed on a kitchen scale.'], cam: CAM_FREE_END, tags: [{ at: CUP_TAG, text: 'a known mass', small: 'say its grams', tone: 'you' }] },
      { title: 'Steady counts', who: 'claude', text: ['Claude reads the counts until they are steady, for that mass.'], cam: CAM_FREE_END, tags: [{ at: CUP_TAG, text: 'hands off', small: 'until Claude says' }] },
      { title: 'The next one', who: 'you', mass: 'out', text: ['Take it out; then the next mass, when Claude asks. Three to five of them, light to heavy.'], cam: CAM_FREE_END },
      { title: 'Saved on the board', who: 'claude', lines: ['CAMERA ?', '0.0 g', 'READY'], text: ['Claude works out the counts per gram and saves it on the board. Then it checks each mass again: each within a gram or two.'], cam: 'display', tags: [{ at: [14, 26, 52], text: '0.0 g', small: 'grams now', tone: 'ok' }] },
    ],
  },
  'm2-real-weight/by-hand': {
    parts: M2_PARTS,
    wires: M2_WIRES,
    beats: [
      { title: 'Hold the button', who: 'you', press: { at: BUTTON_TOP, how: 'hold' }, lines: ['CAMERA ?', '0.0 g', 'HOLD: TARE IN 3 s'], text: ['Cup empty. Hold the button down: the display counts down 5, 4, 3, 2, 1.'], cam: [[60, 70, 120], [30, 8, 30]], T: 4, tags: [{ at: [BUTTON_TOP[0], BUTTON_TOP[1] + 30, BUTTON_TOP[2]], text: 'hold it', small: '5 seconds', tone: 'you' }] },
      { title: 'TARE OK', who: 'you', lines: ['CAMERA ?', '0.0 g', 'TARE OK'], text: ['At 0: a short beep and TARE OK. Let go.'], cam: 'display', tags: [{ at: [14, 26, 52], text: 'TARE OK', tone: 'ok' }] },
      { title: 'A known mass in', who: 'you', mass: 'in', lines: ['CAMERA ?', '150.0 g', 'TARE OK'], text: ['Put a known mass in the cup: the display shows its weight.'], cam: CAM_LEFT, tags: [{ at: [14, 26, 52], text: '150.0 g', small: 'with a 150 g mass, for example', tone: 'ok' }] },
      { title: 'Click: PHOTO', who: 'you', press: { at: BUTTON_TOP, how: 'tap' }, lines: ['CAMERA ?', '150.0 g', 'NO CAMERA'], text: ['Click the button once, quickly: that is PHOTO.', 'NO CAMERA and a long low beep: right, there is no camera yet.'], cam: [[60, 70, 120], [30, 8, 30]], tags: [{ at: [14, 26, 52], text: 'NO CAMERA', small: 'right, for now', tone: 'ok' }] },
      { title: 'Claude checks', who: 'claude', text: ['Claude reads E tare for the hold, and E capture with the grams for the click.'], cam: 'bench', tags: [{ at: [0, 20, 0], text: 'E capture g=150.0', small: 'for a 150 g mass', tone: 'ok' }] },
    ],
  },

  // --- milestone 3, the camera online ------------------------------------------------------------
  'm3-camera/flash-camera': {
    parts: [...M2_PARTS, LAPTOP],
    wires: M2_WIRES,
    newParts: [BASE, CAM_ON_BASE, BASE_USB],
    beats: [
      { title: 'The base on the desk', who: 'you', add: ['base'], text: ['The ESP32-CAM-MB base, right of the breadboard: its micro-USB socket away from you, the IO0 and RST buttons beside it.'], cam: CAM_BASE_VIEW, tags: [{ at: [118, 14, -76], text: 'micro-USB', small: 'away from you' }, { at: [118, 18, -50], text: 'two rows of sockets', small: 'the camera’s pins go in' }] },
      { title: 'The camera onto it', who: 'you', add: ['cam-base'], text: ['Lens up, its microSD end towards you. Line its pins up with the sockets, then press it down evenly until it sits flat.'], cam: CAM_BASE_VIEW, tags: [{ at: [118, 30, -46], text: 'lens up', small: 'microSD end towards you', tone: 'you' }] },
      { title: 'USB into the base', who: 'you', add: ['base-usb'], text: ['A data cable from the base’s micro-USB to the laptop. The NodeMCU stays plugged in.'], cam: [[170, 90, 0], [110, 5, -100]], tags: [{ at: [118, 14, -86], text: 'into the laptop', tone: 'you' }] },
      { title: 'Claude flashes the camera', who: 'claude', laptop: ['Flashing the camera', 'board.py flash node-b-camera', 'E boot node=b fw=0.1.0 psram=1 camera=1 card=0', 'E wifi not-set'], text: ['From the laptop: Claude flashes it and reads its first lines. camera=1: the camera answered. card=0: no microSD yet, right for now.'], cam: CAM_LAPTOP },
    ],
  },
  'm3-camera/hotspot': {
    parts: M3_PARTS,
    wires: M2_WIRES,
    newParts: [PHONE],
    beats: [
      { title: 'Your phone', who: 'you', add: ['phone'], phone: ['Settings', 'Mobile hotspot', 'off'], text: ['Open the phone’s settings, at its mobile hotspot.'], cam: CAM_PHONE },
      { title: 'Hotspot on, 2.4 GHz', who: 'you', phone: ['Mobile hotspot', 'ON', 'Band: 2.4 GHz', 'iPhone: Maximise', 'compatibility'], text: ['Turn it on. Its band must be 2.4 GHz: the camera cannot see 5 GHz.', 'On an iPhone: Maximise compatibility.'], cam: CAM_PHONE },
      { title: 'The laptop joins it', who: 'you', laptop: ['Wi-Fi', 'Your hotspot: connected'], text: ['On the laptop, join the hotspot like any Wi-Fi.'], cam: CAM_LAPTOP },
      { title: 'Claude checks', who: 'claude', laptop: ['Wi-Fi', 'Your hotspot: connected', 'Claude: on the hotspot', 'the laptop’s address found'], text: ['Claude checks the laptop is on the hotspot and finds its address there.'], cam: CAM_LAPTOP },
    ],
  },
  'm3-camera/backend': {
    parts: [...M3_PARTS, PHONE],
    wires: M2_WIRES,
    beats: [
      { title: 'Claude starts the server', who: 'claude', laptop: ['Terminal: the server', 'Running on 0.0.0.0:8000', 'reachable from the hotspot'], text: ['Claude starts the server in a Terminal tab, where the camera can reach it.'], cam: CAM_LAPTOP },
      { title: 'Allow it', who: 'you', laptop: ['Windows Security', 'Python wants the network', 'Private networks: ticked', '[ Allow access ]'], text: ['If Windows asks about Python and the network: tick Private networks, then Allow access.'], cam: CAM_LAPTOP },
      { title: 'Open it on the phone', who: 'you', phone: ['Browser', 'http://<laptop>:8000/docs', 'Smart Food Scale API', 'it answers'], text: ['Claude gives you an address. Open it in the phone’s browser: the server’s page opens.'], cam: CAM_PHONE },
    ],
  },
  'm3-camera/wifi': {
    parts: [...M3_PARTS, PHONE],
    wires: M2_WIRES,
    beats: [
      { title: 'The bench page', who: 'you', laptop: ['Workbench · Bench', '[ Connect a board ]', 'pick the camera’s port'], text: ['When Claude says: on the laptop’s bench page, press Connect a board and pick the camera’s port.'], cam: CAM_LAPTOP },
      { title: 'Name, password, address', who: 'you', laptop: ['Wi-Fi name: your hotspot', 'Password: ••••••••', 'Server: the address Claude gave', '[ Save and connect ]'], text: ['Type the hotspot’s name and its password, paste the server address, press Save and connect.', 'Only you type the password: never in the chat.'], cam: CAM_LAPTOP },
      { title: 'Wi-Fi up', who: 'claude', laptop: ['E wifi up ch=6 ip=192.168.x.y', '[ Disconnect ]'], text: ['The camera says Wi-Fi up (the channel and address are your hotspot’s). Press Disconnect, so Claude can use the board again.'], cam: CAM_LAPTOP },
    ],
  },
  'm3-camera/test-photo': {
    parts: [...M3_PARTS, PHONE],
    wires: M2_WIRES,
    beats: [
      { title: 'Something to look at', who: 'you', press: { at: [118, 42, -50], how: 'hold' }, text: ['The lens looks up: hold your hand, or anything, above it.'], cam: [[180, 115, 55], [118, 22, -55]], T: 3, tags: [{ at: [118, 30, -46], text: 'the lens', small: 'looking up' }] },
      { title: 'A test photo', who: 'claude', laptop: ['> shoot 150', 'E photo bytes=… ms=…', 'E upload g=150.0 status=201 outcome=saved', 'A meal in the server: 150 g'], text: ['Claude asks the camera for a test photo with 150 g, and checks the meal arrived in the server.'], cam: CAM_LAPTOP },
    ],
  },

  // --- milestone 4, the light: the camera moves to the far half of the breadboard ----------------
  'm4-light/make-room': {
    parts: M3_PARTS,
    wires: M2_WIRES,
    newWires: [BTN_GND_LEFT],
    beats: [
      { title: 'Both USB cables out', who: 'you', usb: 'out', remove: ['base-usb'], screen: false, text: ['Nothing is wired with the power on: the NodeMCU’s cable and the base’s.'], cam: 'bench' },
      { title: 'The far half, free', who: 'you', text: ['The camera and the light go on the far half of the breadboard, rows 29 to 63. Anything of yours there: send Claude a photo first.'], cam: CAM_FAR_HALF, tags: [{ at: holeTag('e', 30), text: 'row 29', small: 'from here…' }, { at: holeTag('e', 62), text: 'row 63', small: '…to the end', tone: 'you' }] },
      { title: 'The ground bridge out', who: 'you', remove: ['gnd-bridge'], ring: holeTag('R-', 3), text: ['Pull out the wire between the two − rails, near you (row 3).', 'The right − rail is about to become the LEDs’ own line.'], cam: { rows: [1, 6] }, tags: [{ at: holeTag('R-', 3), text: 'out', tone: 'you' }] },
      { title: 'The button’s ground, moved', who: 'you', remove: ['btn-gnd'], add: ['btn-gnd-l'], ring: holeTag('L-', 11), text: ['The wire from the button’s row 10, column j: its rail end out of the right − rail, into the left − rail beside row 11. The button still works as before.'], cam: [[30, 100, 75], [48, 6, 15]], tags: [{ at: holeTag('L-', 11), text: 'left − rail', small: 'beside row 11', tone: 'you' }] },
    ],
    cards: [
      { title: 'Ground bridge', text: 'Out.' },
      { title: 'Button’s ground', text: 'Row 10 column j → left − rail, beside row 11.', colour: 'black' },
    ],
  },
  'm4-light/off-the-base': {
    parts: [...M2_PARTS, LAPTOP, BASE, CAM_ON_BASE],
    wires: M4_A_WIRES,
    usbStartsIn: false,
    newParts: [CAM_BB, { id: 'base-usb-2', kind: 'base-usb' }],
    newWires: BASE_WIRES,
    beats: [
      { title: 'The camera off its base', who: 'you', remove: ['cam-base'], text: ['Pull the camera straight up off its base. The base stays where it is.'], cam: CAM_BASE_VIEW, screen: false },
      { title: 'Into the breadboard', who: 'you', add: ['cam'], text: ['Lens up, its ESP32-CAM end towards you, across the middle gap: its 5V column in column b, its 3V3 column in column i.', 'Its pins in rows 36 to 43, 5V and 3V3 in row 43. Press it in evenly.'], cam: CAM_CAM_BB, tags: [{ at: holeTag('a', 43), text: '5V, row 43', small: 'column b' }, { at: holeTag('j', 43), text: '3V3, row 43', small: 'column i' }] },
      { title: 'Base 5V → row 43', who: 'you', add: ['x-base-5v'], ring: { base: '5V' }, text: ['A male–male jumper: one end into the base’s 5V socket, the other into column a, row 43: the camera’s 5V row.'], cam: CAM_FAR_HALF, tags: [{ at: { base: '5V' }, text: 'base 5V', tone: 'you' }, { at: holeTag('a', 43), text: 'row 43, column a' }] },
      { title: 'Base GND → row 40', who: 'you', add: ['x-base-gnd'], ring: { base: 'GND' }, text: ['From the base’s GND socket, next to 5V, to column j, row 40: one of the camera’s GND rows.'], cam: CAM_FAR_HALF, tags: [{ at: { base: 'GND' }, text: 'base GND', tone: 'you' }, { at: holeTag('j', 40), text: 'row 40, column j' }] },
      { title: 'U0R and U0T', who: 'you', add: ['x-base-u0r', 'x-base-u0t'], text: ['Base U0R to column j, row 38. Base U0T to column j, row 37. The same names at both ends: through them the laptop talks to the camera.'], cam: CAM_FAR_HALF, tags: [{ at: holeTag('j', 38), text: 'U0R, row 38' }, { at: holeTag('j', 37), text: 'U0T, row 37' }] },
      { title: 'One ground for both', who: 'you', add: ['x-gnd-link'], ring: holeTag('a', 42), text: ['From column a, row 42 (the camera’s other GND) to the left − rail, beside row 41. The camera and the scale now share ground.'], cam: CAM_LIGHT_LEFT, tags: [{ at: holeTag('a', 42), text: 'row 42 → left − rail', tone: 'you' }] },
      { title: 'Both USB cables in', who: 'claude', usb: 'in', screen: true, add: ['base-usb-2'], laptop: ['E boot node=b fw=0.1.0 psram=1 camera=1 card=0', 'E wifi up ch=6 ip=192.168.x.y'], text: ['Claude reads the camera: it still starts and joins the hotspot, off its base.'], cam: CAM_WHOLE },
    ],
    cards: [
      { title: 'Camera', text: 'Lens up, its name towards you: 5V column in b, 3V3 column in i, rows 36–43.' },
      { title: 'Base 5V → a43', text: 'Male–male.', colour: 'red' },
      { title: 'Base GND → j40', text: 'Male–male.', colour: 'black' },
      { title: 'U0R → j38, U0T → j37', text: 'Male–male, same names at both ends.', colour: 'yellow' },
      { title: 'a42 → left − rail', text: 'One ground for both boards.', colour: 'black' },
    ],
  },
  'm4-light/light-wires': {
    parts: [...M2_PARTS, LAPTOP, BASE, BASE_USB, CAM_BB],
    wires: [...M4_A_WIRES, ...BASE_WIRES],
    newParts: [Q2, R470, R10K, { id: 'base-usb-2', kind: 'base-usb' }],
    newWires: LIGHT_WIRES,
    beats: [
      { title: 'Both USB cables out', who: 'you', usb: 'out', remove: ['base-usb'], screen: false, text: ['Nothing is wired with the power on.'], cam: CAM_WHOLE },
      { title: 'The transistor', who: 'you', add: ['q2'], text: ['The second 2N2222A: column c, rows 47, 48, 49, its flat face towards the middle gap.', 'Looking at the flat face, legs down, the left leg is E: row 47. Then B in 48, C in 49.'], cam: CAM_LIGHT_LEFT, tags: [{ at: holeTag('c', 48), text: 'E · B · C', small: 'rows 47 · 48 · 49 · flat face to the gap', tone: 'you' }] },
      { title: 'IO13 down to row 46', who: 'you', add: ['x-io13'], ring: holeTag('a', 40), text: ['A male–male jumper from column a, row 40 (the camera’s IO13 row) to column a, row 46.'], cam: CAM_LIGHT_LEFT, tags: [{ at: holeTag('a', 40), text: 'IO13, row 40', tone: 'you' }, { at: holeTag('a', 46), text: 'row 46' }] },
      { title: '470 Ω to the base', who: 'you', add: ['r470'], text: ['The 470 Ω (yellow, violet, brown) from column b, row 46 to column b, row 48: the transistor’s middle leg.'], cam: CAM_LIGHT_LEFT, tags: [{ at: holeTag('b', 47), text: '470 Ω', small: 'rows 46 → 48', tone: 'you' }] },
      { title: '10 kΩ to ground', who: 'you', add: ['r10k'], text: ['The 10 kΩ (brown, black, orange) from column a, row 48 to the left − rail: it keeps the light off unless the camera says.'], cam: CAM_LIGHT_LEFT, tags: [{ at: holeTag('a', 48), text: '10 kΩ', small: 'row 48 → − rail', tone: 'you' }] },
      { title: 'Emitter to ground', who: 'you', add: ['x-emitter'], text: ['From column a, row 47 to the left − rail.'], cam: CAM_LIGHT_LEFT, tags: [{ at: holeTag('a', 47), text: 'row 47 → − rail', tone: 'you' }] },
      { title: 'Collector to the LEDs’ line', who: 'you', add: ['x-collector'], ring: holeTag('R-', 59), text: ['From column d, row 49, across the gap, to the right − rail beside row 59: from now on, the LEDs’ common line.'], cam: CAM_LIGHT, tags: [{ at: holeTag('R-', 59), text: 'right − rail', small: 'beside row 59', tone: 'you' }] },
    ],
    cards: [
      { title: 'Transistor', text: 'Column c, rows 47–49, flat face to the gap: E 47, B 48, C 49.' },
      { title: 'a40 → a46', text: 'IO13 down. Male–male.', colour: 'purple' },
      { title: '470 Ω', text: 'b46 → b48.' },
      { title: '10 kΩ', text: 'a48 → left − rail.' },
      { title: 'a47 → left − rail', text: 'The emitter to ground.', colour: 'black' },
      { title: 'd49 → right − rail, row 59', text: 'The collector to the LEDs’ line.', colour: 'blue' },
    ],
  },
  'm4-light/leds': {
    parts: [...M2_PARTS, LAPTOP, BASE, BASE_USB, CAM_BB, Q2, R470, R10K],
    wires: [...M4_A_WIRES, ...BASE_WIRES, ...LIGHT_WIRES],
    usbStartsIn: false,
    newParts: [...LEDS, { id: 'base-usb-2', kind: 'base-usb' }],
    beats: [
      { title: 'USB cables stay out', who: 'you', remove: ['base-usb'], screen: false, text: ['Both cables still out.'], cam: CAM_LIGHT },
      { title: 'The first: its 100 Ω', who: 'you', add: ['r100-46'], text: ['A 100 Ω (brown, black, brown) from the right + rail to column j, row 46.'], cam: CAM_LIGHT, tags: [{ at: holeTag('j', 46), text: '100 Ω', small: '+ rail → j46', tone: 'you' }] },
      { title: 'The first LED', who: 'you', add: ['led-46'], text: ['The LED’s long leg in column i, row 46; its short leg bent into the right − rail, beside row 47.'], cam: CAM_LIGHT, tags: [{ at: holeTag('i', 46), text: 'long leg, i46' }, { at: holeTag('R-', 47), text: 'short leg', small: '− rail, row 47', tone: 'you' }] },
      { title: 'Five more, the same way', who: 'you', add: LED_ROWS.slice(1).flatMap((row) => [`r100-${row}`, `led-${row}`]), text: ['Rows 49, 51, 55, 57 and 61: each its own 100 Ω from the + rail to column j, and its LED, long leg in column i, short leg in the − rail one row on.', 'The rails skip a hole every sixth row: that is why the rows are uneven.'], cam: CAM_LIGHT, T: 5 },
      { title: 'Both USB cables in', who: 'claude', usb: 'in', screen: true, add: ['base-usb-2'], text: ['The LEDs’ 5 V comes from the right + rail, so the NodeMCU’s cable must be in too.'], cam: CAM_WHOLE },
    ],
    cards: [
      { title: 'Six times', text: '100 Ω from the right + rail to column j; LED long leg in column i, short leg in the − rail one row on.' },
      { title: 'Rows', text: '46, 49, 51, 55, 57, 61.' },
    ],
  },
  'm4-light/light-on': {
    parts: M4_PARTS,
    wires: M4_WIRES,
    beats: [
      { title: 'Light on', who: 'claude', light: true, laptop: ['> light on', 'E light on'], text: ['Claude sends the camera “light on”: all six LEDs light, and the camera’s own.'], cam: CAM_LIGHT, T: 3.4, tags: [{ at: [70, 30, -100], text: 'all six?', small: 'tell Claude', tone: 'you' }] },
      { title: 'Light off', who: 'claude', laptop: ['> light on', 'E light on', '> light off', 'E light off'], text: ['Then “light off”: all out.'], cam: CAM_LIGHT },
    ],
  },

  // --- milestone 5, both boards together ------------------------------------------------------
  'm5-together/find': {
    parts: M4_PARTS,
    wires: M4_WIRES,
    beats: [
      { title: 'Both boards on', who: 'you', text: ['Both USB cables in; the camera on the hotspot.'], cam: CAM_WHOLE },
      { title: 'The scale finds the camera', who: 'claude', lines: ['CAMERA ch 6', '0.0 g', 'READY'], laptop: ['> find', 'E link found ch=6 mac=…'], text: ['Claude sends the scale “find”: it looks for the camera by radio and shows its channel.'], cam: 'display', tags: [{ at: [14, 26, 52], text: 'CAMERA ch 6', small: 'the channel is your hotspot’s', tone: 'ok' }] },
    ],
  },
  'm5-together/meal-test': {
    parts: M4_PARTS,
    wires: M4_WIRES,
    beats: [
      { title: 'Hold to tare', who: 'you', press: { at: BUTTON_TOP, how: 'hold' }, lines: ['CAMERA ch 6', '0.0 g', 'HOLD: TARE IN 3 s'], text: ['Cup empty: hold the button 5 s.'], cam: [[60, 70, 120], [30, 8, 30]], T: 4 },
      { title: 'TARE OK', who: 'you', lines: ['CAMERA ch 6', '0.0 g', 'TARE OK'], text: ['A short beep, TARE OK. Let go.'], cam: 'display' },
      { title: 'Food in', who: 'you', food: 'in', lines: ['CAMERA ch 6', '150.0 g', 'TARE OK'], text: ['Put some food in the cup: the display shows its weight.'], cam: CAM_FREE_END, tags: [{ at: CUP_TAG, text: 'food', small: '150 g, for example', tone: 'you' }] },
      { title: 'Click: the photo', who: 'you', press: { at: BUTTON_TOP, how: 'tap' }, light: true, lines: ['CAMERA ch 6', '150.0 g', 'SENT'], text: ['Click the button once: the light flashes, the camera takes the photo, the grams go with it. SENT.'], cam: CAM_WHOLE, T: 3.4 },
      { title: 'SAVED', who: 'claude', lines: ['CAMERA ch 6', '150.0 g', 'SAVED'], laptop: ['E result seq=1 outcome=saved', 'A meal in the server: 150 g, with its photo'], text: ['A moment later: SAVED. Claude checks the meal in the server, photo and grams.'], cam: 'display', tags: [{ at: [14, 26, 52], text: 'SAVED', tone: 'ok' }] },
    ],
  },

  // --- milestones 6 to 8: on the laptop and the phone -----------------------------------------
  'm6-server/accounts': {
    bench: false,
    parts: [LAPTOP, PHONE],
    wires: [],
    beats: [
      { title: 'Supabase', who: 'you', laptop: ['supabase.com', 'New project', 'Region: US East, close to Vercel’s'], text: ['A free Supabase project: the database, sign-in and the photos. Its region close to Vercel’s, US East.'], cam: CAM_LAPTOP },
      { title: 'Vercel', who: 'you', laptop: ['vercel.com', 'New project: the same GitHub repository', 'Root directory: backend'], text: ['A second Vercel project on the same repository, its root folder backend: it puts the server online.'], cam: CAM_LAPTOP },
      { title: 'Gemini', who: 'you', laptop: ['Google AI Studio', 'Create API key'], text: ['A Gemini key from Google AI Studio: it names the dish in each photo.'], cam: CAM_LAPTOP },
      { title: 'Expo', who: 'you', phone: ['Expo Go', 'installed'], laptop: ['expo.dev', 'Sign up'], text: ['An Expo account, and the Expo Go app on your phone: the app runs in it while it is built.'], cam: CAM_PHONE },
      { title: 'The secrets stay yours', who: 'you', laptop: ['Vercel · Environment variables', 'SUPABASE_SERVICE_KEY  ••••', 'GEMINI_API_KEY  ••••'], text: ['You paste the keys yourself into Vercel’s environment variables page. Never in the chat, never in the app.'], cam: CAM_LAPTOP },
    ],
  },
  'm6-server/server-v2': {
    bench: false,
    parts: [LAPTOP],
    wires: [],
    beats: [{ title: 'Claude writes it', who: 'claude', laptop: ['Server version 2', 'accounts · pairing codes', 'the “to name” inbox · photos', 'then its tests, run'], text: ['Claude writes the server’s second version: accounts, the scale’s pairing, the meals waiting to be named, the photos. Then runs its tests.'], cam: CAM_LAPTOP }],
  },
  'm6-server/deploy': {
    bench: false,
    parts: [LAPTOP],
    wires: [],
    beats: [
      { title: 'Online', who: 'claude', laptop: ['Vercel · backend', 'Deploying…', 'https://….vercel.app'], text: ['Claude puts the server online: it gets its https address.'], cam: CAM_LAPTOP },
      { title: 'It answers', who: 'claude', laptop: ['https://….vercel.app/docs', 'it answers'], text: ['Claude checks the address answers.'], cam: CAM_LAPTOP },
    ],
  },
  'm6-server/fake-scale': {
    bench: false,
    parts: [LAPTOP],
    wires: [],
    beats: [{ title: 'A meal without hardware', who: 'claude', laptop: ['fake scale', 'a photo and 150 g, sent as your paired scale', 'saved under your account'], text: ['Claude sends a meal as if it came from your scale: the app can be built and shown with no board plugged in.'], cam: CAM_LAPTOP }],
  },
  'm7-app/expo-go': {
    bench: false,
    parts: [LAPTOP, PHONE],
    wires: [],
    beats: [
      { title: 'The QR code', who: 'claude', laptop: ['npx expo start', 'a QR code ▦', 'scan it with Expo Go'], text: ['Claude starts the app on the laptop: a QR code appears.'], cam: CAM_LAPTOP },
      { title: 'Scan it', who: 'you', phone: ['Expo Go', 'Scan QR code'], text: ['In Expo Go, scan the QR code.'], cam: CAM_PHONE },
      { title: 'The app opens', who: 'you', phone: ['Bienvenue', 'Smart Food Scale', '[ Connexion ]', '[ Inscription ]'], text: ['The app opens on your phone.'], cam: CAM_PHONE },
    ],
  },
  'm7-app/sign-in': {
    bench: false,
    parts: [PHONE],
    wires: [],
    beats: [
      { title: 'Inscription', who: 'you', phone: ['Inscription', 'e-mail', 'mot de passe', '[ Créer mon compte ]'], text: ['Your e-mail and a password, typed on the phone. Then the e-mail’s confirmation link.'], cam: CAM_PHONE },
      { title: 'Objectifs', who: 'you', phone: ['Objectifs', 'âge · sexe · taille', 'poids · activité', 'objectif', 'calories du jour: estimation'], text: ['Your goals: from them, a daily calorie target, marked as an estimate, and yours to change.'], cam: CAM_PHONE },
    ],
  },
  'm7-app/today': {
    bench: false,
    parts: [PHONE],
    wires: [],
    beats: [{ title: 'Aujourd’hui', who: 'you', phone: ['Aujourd’hui', '◯ kcal, against your target', 'protéines · glucides · lipides', 'les repas du jour', 'pesé: measured on the scale'], text: ['The day at a glance: a ring for the calories, three bars, the meals as cards. “Pesé” marks grams measured on the scale.'], cam: CAM_PHONE }],
  },
  'm7-app/to-name': {
    bench: false,
    parts: [PHONE],
    wires: [],
    beats: [
      { title: 'À nommer', who: 'you', phone: ['À nommer', 'a meal Gemini could not name', 'chercher un plat…'], text: ['A meal Gemini could not name waits here.'], cam: CAM_PHONE },
      { title: 'Pick the dish', who: 'you', phone: ['À nommer', 'couscous', '→ its numbers appear'], text: ['Search our dishes, pick it: its numbers appear, flagged as estimates.'], cam: CAM_PHONE },
    ],
  },
  'm8-pairing/portal': {
    parts: [...M4_PARTS, PHONE],
    wires: M4_WIRES,
    beats: [
      { title: 'Ajouter ma balance', who: 'you', phone: ['Balance', '[ Ajouter ma balance ]', 'code: 6 characters', 'valid 15 minutes'], text: ['In the app: Ajouter ma balance. A six-character pairing code appears, valid 15 minutes.'], cam: CAM_PHONE },
      { title: 'The camera’s own network', who: 'you', phone: ['Wi-Fi', 'Balance-Setup-XXXX', '[ Join ]'], text: ['With no Wi-Fi it knows, the camera opens its own network, Balance-Setup-…. Join it from the phone’s Wi-Fi settings.'], cam: CAM_PHONE },
    ],
  },
  'm8-pairing/pair': {
    parts: [...M4_PARTS, PHONE],
    wires: M4_WIRES,
    beats: [
      { title: 'The setup page', who: 'you', phone: ['Balance-Setup', 'your Wi-Fi: pick it', 'password: ••••••', 'pairing code: ······', '[ Enregistrer ]'], text: ['A page opens by itself. Pick your Wi-Fi, type its password and the pairing code, save. Up to three networks are kept.'], cam: CAM_PHONE },
      { title: 'Balance connectée', who: 'you', phone: ['Balance', 'Balance connectée'], text: ['The camera goes online, sends the code; the app says Balance connectée.'], cam: CAM_PHONE },
    ],
  },
  'm8-pairing/real-meal': {
    parts: [...M4_PARTS, PHONE],
    wires: M4_WIRES,
    beats: [
      { title: 'Hold to tare', who: 'you', press: { at: BUTTON_TOP, how: 'hold' }, lines: ['CAMERA ch 6', '0.0 g', 'HOLD: TARE IN 3 s'], text: ['Cup empty: hold the button 5 s, TARE OK.'], cam: [[60, 70, 120], [30, 8, 30]], T: 4 },
      { title: 'Food, click', who: 'you', food: 'in', lines: ['CAMERA ch 6', '150.0 g', 'SENT'], light: true, text: ['Food in the cup, then a click: the light, the photo, the grams.'], cam: CAM_WHOLE, T: 3.4 },
      { title: 'In the app', who: 'you', phone: ['Aujourd’hui', 'the meal: its photo', '150 g · pesé', 'its dish and kcal'], text: ['The meal appears in the app, weighed, photographed, named.'], cam: CAM_PHONE },
    ],
  },

  // --- milestone 9, the finished scale ----------------------------------------------------------
  'm9-finish/card': {
    parts: M4_PARTS,
    wires: M4_WIRES,
    newParts: [{ id: 'sd', kind: 'sdcard' }, { id: 'base-usb-2', kind: 'base-usb' }],
    beats: [
      { title: 'Format it', who: 'you', laptop: ['The microSD card', 'Format: FAT32', '[ Start ]'], text: ['In the laptop, through a card reader: format the microSD card as FAT32. That erases it.'], cam: CAM_LAPTOP },
      { title: 'Both USB cables out', who: 'you', usb: 'out', remove: ['base-usb'], screen: false, text: ['Nothing goes in with the power on.'], cam: CAM_WHOLE },
      { title: 'Into the camera', who: 'you', add: ['sd'], text: ['Contacts down, into the slot at the camera’s far end, under the lens, until it clicks.'], cam: [[95, 55, -120], [53, 14, -72]], tags: [{ at: [53, 24, -80], text: 'the slot', small: 'far end, under the lens', tone: 'you' }] },
      { title: 'card=1', who: 'claude', usb: 'in', screen: true, add: ['base-usb-2'], laptop: ['E boot node=b fw=0.1.0 psram=1 camera=1 card=1'], text: ['Claude restarts the camera: card=1, it sees the card.'], cam: CAM_LAPTOP },
      { title: 'Hotspot off: kept', who: 'you', phone: ['Mobile hotspot', 'off'], lines: ['CAMERA ch 6', '150.0 g', 'QUEUED'], text: ['Turn the hotspot off, then take a photo (hold to tare, food, click): QUEUED, kept on the card.'], cam: 'display', tags: [{ at: [14, 26, 52], text: 'QUEUED', small: 'kept on the card', tone: 'ok' }] },
      { title: 'Hotspot on: sent', who: 'claude', phone: ['Mobile hotspot', 'ON'], laptop: ['> flush', 'E upload … outcome=saved'], text: ['Hotspot back on: Claude has the camera send what it kept. Saved.'], cam: CAM_LAPTOP },
    ],
  },
  'm9-finish/power': {
    parts: M4_PARTS,
    wires: M4_WIRES,
    newParts: [{ id: 'charger', kind: 'charger' }],
    newWires: [
      { id: 'x-cam-5v', from: { hole: ['a', 43] }, to: { hole: ['R+', 44] }, colour: 'red', ends: 'mm', lift: 24 },
      { id: 'lead-5v', from: { at: CHARGER_LEADS }, to: { hole: ['R+', 31] }, colour: 'red', ends: 'mm', lift: 8 },
      { id: 'lead-gnd', from: { at: CHARGER_LEADS }, to: { hole: ['L-', 31] }, colour: 'black', ends: 'mm', lift: 30 },
    ],
    beats: [
      { title: 'Both USB cables out', who: 'you', usb: 'out', remove: ['base-usb'], screen: false, text: ['The laptop’s USB comes out for good: from now on the charger feeds both boards. Never both at once.'], cam: CAM_WHOLE },
      { title: 'The base off', who: 'you', remove: ['x-base-5v', 'x-base-gnd', 'x-base-u0r', 'x-base-u0t', 'base'], text: ['Its four wires out; the base goes back in the box. It is only needed to flash the camera again.'], cam: CAM_FAR_HALF },
      { title: 'The camera’s 5 V from the rail', who: 'you', add: ['x-cam-5v'], text: ['A male–male jumper from column a, row 43 (the camera’s 5V row) to the right + rail, beside row 44: the same 5 V as the scale and the LEDs.'], cam: CAM_FAR_HALF, tags: [{ at: holeTag('R+', 44), text: 'right + rail', small: 'beside row 44', tone: 'you' }] },
      { title: 'The charger’s two leads', who: 'you', add: ['charger', 'lead-5v', 'lead-gnd'], text: ['A 5 V 2 A phone charger, its USB cable’s far end cut and its red and black wires stripped. Check with a multimeter which is 5 V before going on.', '5 V into the right + rail, ground into the left − rail, both beside row 31.'], cam: [[170, 150, 110], [80, 0, -10]], T: 3.4, tags: [{ at: holeTag('R+', 31), text: '5 V → right + rail' }, { at: holeTag('L-', 31), text: 'ground → left − rail' }] },
      { title: 'Plug the charger in', who: 'you', screen: true, lines: ['CAMERA ch 6', '0.0 g', 'READY'], text: ['The display lights and finds the camera; a click works as before. Both boards now run from the charger.', 'The 1000 µF capacitors go in when the boards are soldered into the rig.'], cam: CAM_WHOLE },
    ],
  },
  'm9-finish/rig': {
    bench: false,
    parts: [],
    wires: [],
    newParts: RIG_PIECES,
    beats: [
      { title: 'The base', who: 'you', add: ['rig-base'], text: [`The base: ${DIM.base.width} × ${DIM.base.depth} mm on four feet, its walls ${26} mm high, the front box for the display and the button.`, 'The design’s numbers (/rig); the materials are yours to choose with the FabLab.'], cam: CAM_RIG },
      { title: 'The fixed spacer', who: 'you', add: ['rig-spacer'], text: [`A ${DIM.cell.bottom - 12} mm spacer, ${DIM.cell.mount} mm left of the middle: the cell’s fixed end is screwed onto it.`, 'Under the free end, a stop screw a millimetre short of the cell: it stops an overload.'], cam: CAM_RIG_LOW },
      { title: 'The cell, arrow down', who: 'you', add: ['rig-cell'], text: ['The cell moves from the book into the rig: its wired end screwed onto the spacer, the arrow on its side pointing down.'], cam: CAM_RIG_LOW },
      { title: 'Riser and platform', who: 'you', add: ['rig-platform'], text: [`A riser on the free end, then the ${DIM.platform.diameter} mm platform: it touches nothing but the cell.`], cam: CAM_RIG_LOW },
      { title: 'The plate', who: 'you', add: ['rig-plate'], text: [`The ${DIM.plate.diameter} mm plate on the platform.`], cam: CAM_RIG },
      { title: 'Post and arm', who: 'you', add: ['rig-post'], text: [`The post at the back, ${DIM.arm.postLength} mm; the arm reaching ${DIM.arm.reach} mm over the plate.`], cam: CAM_RIG_HIGH },
      { title: 'Camera and light, looking down', who: 'you', add: ['rig-camera'], text: [`The camera under the arm’s end, lens down, ${DIM.camera.lensBottom - DIM.plate.surface} mm above the plate; the six LEDs in a ring around it.`], cam: CAM_RIG_HIGH },
      { title: 'Display and button in front', who: 'you', add: ['rig-panel'], text: ['The display and the one button in the front box. The NodeMCU and the HX711 inside the base; the camera’s wires up the post.', 'Soldered now, with the 1000 µF capacitors at the camera’s 5V and GND.'], cam: CAM_RIG },
    ],
  },
  'm9-finish/recalibrate': {
    bench: false,
    parts: RIG_PIECES,
    wires: [],
    loadAt: RIG_PLATE_TOP,
    beats: [
      { title: 'Empty plate', who: 'claude', lines: ['CAMERA ch 6', '0.0 g', 'READY'], text: ['The mount changes the reading: the same known masses once more. Claude zeroes it with the plate empty.'], cam: CAM_RIG },
      { title: 'A known mass on', who: 'you', mass: 'in', text: ['Put a known mass in the middle of the plate and tell Claude its grams.'], cam: CAM_RIG_LOW, tags: [{ at: [0, 100, -15], text: 'a known mass', small: 'say its grams', tone: 'you' }] },
      { title: 'The next one', who: 'you', mass: 'out', text: ['Off; then the next, when Claude asks: three to five of them.'], cam: CAM_RIG_LOW },
      { title: 'Saved', who: 'claude', text: ['Claude saves the new counts per gram on the board and checks each mass again.'], cam: CAM_RIG },
    ],
  },
  'm9-finish/accuracy': {
    bench: false,
    parts: [...RIG_PIECES, LAPTOP],
    wires: [],
    loadAt: RIG_PLATE_TOP,
    beats: [
      { title: 'Each mass, several times', who: 'you', mass: 'in', text: ['Each known mass on and off, several times, as Claude asks.'], cam: CAM_RIG_LOW },
      { title: 'The numbers, measured', who: 'claude', laptop: ['Accuracy', 'mass · reading · error', 'measured on your scale'], text: ['Claude writes what was measured on the accuracy page: real numbers in place of the empty tables.'], cam: CAM_LAPTOP },
    ],
  },
  'm9-finish/demo': {
    bench: false,
    parts: [...RIG_PIECES, PHONE],
    wires: [],
    loadAt: RIG_PLATE_TOP,
    beats: [
      { title: 'Hold to tare', who: 'you', press: { at: RIG_BUTTON_TOP, how: 'hold' }, lines: ['CAMERA ch 6', '0.0 g', 'HOLD: TARE IN 3 s'], text: ['Empty plate: hold the button 5 s, TARE OK.'], cam: CAM_RIG_FRONT, T: 4 },
      { title: 'Serve', who: 'you', food: 'in', lines: ['CAMERA ch 6', '150.0 g', 'TARE OK'], text: ['Food on the plate: the weight settles.'], cam: CAM_RIG },
      { title: 'Click', who: 'you', press: { at: RIG_BUTTON_TOP, how: 'tap' }, light: true, lines: ['CAMERA ch 6', '150.0 g', 'SAVED'], text: ['A click: the light, the photo, the grams. SAVED.'], cam: CAM_RIG, T: 3.4 },
      { title: 'On the phone', who: 'you', phone: ['Aujourd’hui', 'the meal: its photo', '150 g · pesé', 'its dish and kcal'], text: ['The meal is in the app: weighed, photographed, named.'], cam: CAM_PHONE },
    ],
  },
};

export const benchSceneFor =(milestoneId: string, stepId: string): BenchScene | undefined => BENCH_SCENES[`${milestoneId}/${stepId}`];
