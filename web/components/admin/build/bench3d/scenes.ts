import { pinName, pinWords, type BenchScene, type WireSpec } from './model';

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
  { id: 'rail-vin', from: pin('outer', 15), to: { hole: ['R+', 27] }, colour: 'purple', ends: 'fm', lift: 26 },
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
      { title: 'VIN → the right + rail', who: 'you', add: ['rail-vin'], ring: pin('outer', 15), text: ['Outer row, the last pin, by the USB: VIN, 5 V.', 'Across to the right + rail. Keep the two + rails apart: 3.3 V on the left, 5 V on the right.'], cam: 'bench', tags: [{ at: pin('outer', 15), ...say('outer', 15), tone: 'you' }] },
      { title: 'USB in', who: 'claude', usb: 'in', text: ['Claude restarts the board: it still starts, so nothing is short-circuited.'], cam: 'bench' },
    ],
    cards: [
      { title: '3V → left + rail', text: 'Outer row, 11th pin from the far end.', colour: 'teal' },
      { title: 'G → left − rail', text: 'Outer row, 10th pin from the far end.', colour: 'grey' },
      { title: 'VIN → right + rail', text: 'Outer row, the last pin, by the USB.', colour: 'purple' },
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
      { title: 'The transistor', who: 'you', add: ['q1'], text: ['Column c, rows 16, 17, 18. Its flat face to the left.', 'From row 16: E (emitter), B (base), C (collector).'], cam: { rows: [13, 19] }, tags: [{ at: { hole: ['c', 17] }, text: 'E · B · C', small: 'rows 16 · 17 · 18, flat face left', tone: 'you' }] },
      { title: 'The 1 kΩ resistor', who: 'you', add: ['r1k'], text: ['Column b, from row 14 to row 17: its far end joins the base’s row.', 'Bands brown, black, red: 1 kΩ.'], cam: { rows: [12, 19] }, tags: [{ at: { hole: ['b', 14] }, text: 'row 14' }, { at: { hole: ['b', 17] }, text: 'row 17: the base', tone: 'you' }] },
      { title: 'D8 → row 14', who: 'you', add: ['buz-d8'], ring: pin('d', 11), text: ['Row next to the breadboard, the 11th pin from the far end: D8.', 'Socket on D8, its pin into row 14, column a.'], cam: 'mcu', tags: [{ at: pin('d', 11), text: '11th pin', small: 'that pin is D8', tone: 'you' }] },
      { title: 'Emitter to ground', who: 'you', add: ['buz-e'], text: ['From row 16, column a, to the left − rail.'], cam: { rows: [13, 19] }, tags: [{ at: { hole: ['a', 16] }, text: 'row 16 → − rail', tone: 'you' }] },
      { title: 'The buzzer module', who: 'you', add: ['buzzer'], text: ['Its three pins down column j, rows 16, 17, 18: S at row 16, − at row 18. Its board hangs out over the right edge.', 'The + on the buzzer is on the S side.'], cam: { rows: [13, 20], side: 'right' }, tags: [{ at: { hole: ['j', 16] }, text: 'S', small: 'row 16' }, { at: { hole: ['j', 18] }, text: '−', small: 'row 18' }] },
      { title: 'Collector → buzzer −', who: 'you', add: ['buz-c'], text: ['From row 18, column d, across the gap to row 18, column f: the buzzer’s − row.'], cam: { rows: [14, 20] }, tags: [{ at: { hole: ['d', 18] }, text: 'C, row 18' }, { at: { hole: ['f', 18] }, text: 'buzzer −, row 18', tone: 'you' }] },
      { title: 'S → the 5 V rail', who: 'you', add: ['buz-s'], text: ['From row 16, column g, to the right + rail at row 24, past the buzzer’s board: the 5 V from VIN.'], cam: { rows: [14, 25], side: 'right' }, tags: [{ at: { hole: ['g', 16] }, text: 'S row 16', tone: 'you' }, { at: { hole: ['R+', 24] }, text: '+ rail, 5 V' }] },
      { title: 'The diode across it', who: 'you', add: ['diode'], text: ['The 1N4148 in column h, from row 16 to row 18.', 'Its black band at row 16, towards S.'], cam: { rows: [14, 19], side: 'right' }, tags: [{ at: { hole: ['h', 16] }, text: 'band towards S', tone: 'you' }] },
      { title: 'USB in: a beep', who: 'claude', usb: 'in', screen: true, text: ['Claude sends “beep” from the laptop: you hear a short beep.', CHECK], cam: 'bench', tags: [{ at: [74, 26, -4], text: 'beep', tone: 'ok' }] },
    ],
    cards: [
      { title: 'Transistor', text: 'Column c, rows 16–18, flat face left: E, B, C.' },
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
};

export const benchSceneFor = (milestoneId: string, stepId: string): BenchScene | undefined => BENCH_SCENES[`${milestoneId}/${stepId}`];
