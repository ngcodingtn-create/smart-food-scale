import { BOOK, CELL, COL_X, CONNECTOR, CUP, connectorPin, pinName, pinWords, rowZ, BB, type BenchScene, type PartSpec, type V3, type WireSpec } from './model';

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
const HX_CAPS: PartSpec[] = [
  { id: 'c10u', kind: 'cap', type: 'electrolytic', from: ['L+', 7], to: ['L-', 7] },
  { id: 'c100n', kind: 'cap', type: 'ceramic', from: ['L+', 9], to: ['L-', 9] },
];
const MOUNT: PartSpec[] = [{ id: 'book', kind: 'book' }, { id: 'cell', kind: 'loadcell' }, { id: 'tape', kind: 'tape' }, { id: 'cup', kind: 'cup' }];
// The cell's own wire colours: the jumpers leaving the blue connector are recoloured from the owner's photo.
const CELL_PINS = [['E+', 'red'], ['E−', 'black'], ['A−', 'white'], ['A+', 'green']] as const;
const CELL_WIRES: WireSpec[] = CELL_PINS.map(([name, colour], k) => ({ id: `cw-${colour}`, from: { at: connectorPin(k) }, to: { hx: name }, colour, ends: 'mf', lift: 10 + k * 2 }));
const M2_PARTS: PartSpec[] = [...M1_PARTS, HX, ...HX_CAPS, ...MOUNT];
const M2_WIRES: WireSpec[] = [...M1_WIRES, ...HX_WIRES, ...CELL_WIRES];

// Where to look.
const CAM_HX: [V3, V3] = [[-112, 62, 112], [-44, 8, 34]];
const CAM_CELL: [V3, V3] = [[-185, 82, 110], [-95, 14, -8]];
const CAM_FREE_END: [V3, V3] = [[-150, 70, 95], [-100, 30, 15]];
const CAM_HX_RAILS: [V3, V3] = [[-8, 105, 150], [-6, 6, 26]];
const CAM_E_PINS: [V3, V3] = [[-120, 58, 120], [-62, 6, 42]];
const CAM_LEFT: [V3, V3] = [[-55, 165, 200], [-35, 0, -5]];
/** The top of the button, for a finger. */
const BUTTON_TOP: V3 = [(COL_X.e + COL_X.f) / 2, BB.top + 7.4, (rowZ(8) + rowZ(10)) / 2];
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
      { title: 'The HX711', who: 'you', add: ['hx711'], text: ['A small green board: it turns the load cell’s tiny signal into a number for the NodeMCU.', 'Read the names printed beside its pins: GND, DT, SCK, VCC on one end; E+, E−, A−, A+, B−, B+ on the other.'], cam: CAM_HX, tags: [{ at: { hx: 'SCK' }, text: 'GND DT SCK VCC', small: 'to the NodeMCU', tone: 'you' }, { at: { hx: 'A−' }, text: 'E+ E− A− A+ B− B+', small: 'to the load cell', tone: 'you' }, { at: [-44, 30, 20], text: 'drawn from a reference board', small: 'yours may differ: your photo decides' }] },
      { title: 'The load cell', who: 'you', add: ['cell'], text: ['The aluminium bar: it bends a hair under weight. The arrow on its side shows the way the weight must push.', 'Its four wires, red, black, white, green, run into the blue connector; four jumpers leave it, ending in sockets.'], cam: [[-175, 50, 120], [-92, 4, 14]], tags: [{ at: [CELL.x - 7, 12, 4], text: 'the arrow', small: 'the way the weight pushes' }, { at: [CONNECTOR.x, 9, CONNECTOR.z], text: 'blue connector', small: 'four jumpers leave it', tone: 'you' }] },
      { title: 'Two photos for Claude', who: 'you', text: ['On Bench Photos: the HX711 from above, its labels readable; and the blue connector, close, every wire colour showing on both sides.', 'Claude redraws your HX711, and each jumper in its real colour, before you wire anything.'], cam: CAM_LEFT, tags: [{ at: [-44, 26, 34], text: 'photo 1: the HX711', tone: 'you' }, { at: [CONNECTOR.x, 14, CONNECTOR.z], text: 'photo 2: the connector', tone: 'you' }] },
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
      { title: 'Pins already on? Skip this', who: 'you', add: ['hx711'], text: ['Look at your HX711’s two ends: pins already sticking out? Then this step is done.', 'Only holes, and the pins loose in the bag? Then they are soldered in at the lab.'], cam: CAM_HX, tags: [{ at: [-30, 18, 34], text: '4 holes', small: 'GND DT SCK VCC' }, { at: [-58, 18, 34], text: '6 holes', small: 'E+ to B+' }] },
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
      { title: 'The two capacitors', who: 'you', add: ['c10u', 'c100n'], text: ['The 10 µF across the left + and − rails, beside row 7: its striped leg in the − rail.', 'The 100 nF beside row 9, the same way; it has no stripe, either way round.'], cam: [[20, 88, 48], [33, 9, 21]], tags: [{ at: { hole: ['L-', 7] }, text: '10 µF', small: 'stripe in the − rail', tone: 'you' }, { at: { hole: ['L+', 9] }, text: '100 nF', small: 'beside row 9' }] },
      { title: 'USB in', who: 'claude', usb: 'in', screen: true, text: ['Claude restarts the board and reads its boot line: it still starts, so nothing is short-circuited.'], cam: 'bench', tags: [{ at: [0, 20, 0], text: 'E boot node=a', small: 'it still starts', tone: 'ok' }] },
    ],
    cards: [
      { title: 'GND → left − rail', text: 'Female–male, beside row 5.', colour: 'black' },
      { title: 'VCC → left + rail', text: 'The 3.3 V rail, beside row 5. Never the 5 V rail.', colour: 'red' },
      { title: 'DT → 9th pin', text: 'Row next to the breadboard: D6. Female–female.', colour: 'yellow' },
      { title: 'SCK → 10th pin', text: 'Row next to the breadboard: D7. Female–female.', colour: 'orange' },
      { title: '10 µF and 100 nF', text: 'Across the left rails, beside rows 7 and 9. The 10 µF’s stripe in the − rail.' },
    ],
  },
  'm2-real-weight/bench-mount': {
    parts: [...M1_PARTS, HX, ...HX_CAPS],
    wires: [...M1_WIRES, ...HX_WIRES],
    newParts: MOUNT,
    beats: [
      { title: 'A thick book', who: 'you', add: ['book'], text: ['A thick book on the desk, left of the HX711. Or the desk’s own edge.'], cam: CAM_CELL },
      { title: 'The cell on it', who: 'you', add: ['cell'], text: ['The end its wires come out of on the book; the other end out over the front edge, in the air.', 'The arrow on its side points down.'], cam: CAM_CELL, tags: [{ at: [CELL.x - 7, BOOK.h + 12, 4], text: 'arrow points down', tone: 'you' }, { at: FREE_END, text: 'free end', small: 'in the air' }] },
      { title: 'Tape it down hard', who: 'you', add: ['tape'], text: ['Two strips of strong tape over the wired end, pressed down onto the book. Or a clamp.', 'That end must not move at all.'], cam: CAM_CELL, tags: [{ at: [CELL.x, BOOK.h + 20, -32], text: 'tape, pressed hard', tone: 'you' }] },
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
      ...CELL_PINS.map(([name, colour], k) => ({
        title: `${colour[0].toUpperCase()}${colour.slice(1)} → ${name}`,
        who: 'you' as const,
        add: [`cw-${colour}`],
        ring: { hx: name },
        text: [`Follow the cell’s ${colour} wire through the blue connector to its jumper. That jumper’s socket onto ${name}.`, ...(k === 3 ? ['B− and B+ stay empty.'] : [])],
        cam: CAM_E_PINS,
        tags: [{ at: { hx: name }, text: `${colour} → ${name}`, tone: 'you' as const }],
      })),
      { title: 'USB in', who: 'claude', usb: 'in', screen: true, text: ['Claude restarts the board: it still starts. The real scale goes on in the next step.'], cam: 'bench' },
    ],
    cards: CELL_PINS.map(([name, colour]) => ({ title: `${colour} → ${name}`, text: 'Follow the cell wire of this colour through the blue connector.', colour })),
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
      { title: 'Up, or down?', who: 'claude', ring: { hx: 'A−' }, text: ['Rose: done. Fell: USB out, swap the white and green sockets on A− and A+, USB in, and press again.'], cam: CAM_E_PINS, tags: [{ at: { hx: 'A−' }, text: 'white on A−' }, { at: { hx: 'A+' }, text: 'green on A+', small: 'swap only if Claude says' }] },
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
};

export const benchSceneFor = (milestoneId: string, stepId: string): BenchScene | undefined => BENCH_SCENES[`${milestoneId}/${stepId}`];
