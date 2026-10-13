/**
 * The two transistor stages, as circuits the Falstad simulator can run.
 *
 * Each `text` is in CircuitJS's own export format and is carried to the
 * simulator in the address, so nothing is stored on their side. Component
 * values are the ones in wiring.ts; what is not ours to know is said in `note`.
 */

export type Circuit = {
  id: 'light' | 'buzzer';
  title: string;
  /** What to do, and what to look for. */
  try: string;
  /** What the simulation assumes that the bench may not agree with. */
  note: string;
  text: string;
};

// Six branches, 48 units apart: 5 V, 100 Ω, a white LED, then the shared collector line.
const LED_X = [288, 336, 384, 432, 480, 528];
const ledBranches = LED_X.flatMap((x, index) => [
  `r ${x} 48 ${x} 128 0 100`,
  // Flag 1: the next number is the LED's forward drop at 1 A. 3.3 gives about 3.1 V at 18 mA.
  `162 ${x} 128 ${x} 192 1 3.3 1 1 1 0.02`,
  ...(index > 0 ? [`w ${LED_X[index - 1]} 48 ${x} 48 0`, `w ${LED_X[index - 1]} 192 ${x} 192 0`] : []),
]);

const LIGHT = [
  '$ 1 0.000005 10.20027730826997 50 5 43 5e-11',
  // GPIO 13 as a 3.3 V rail behind a switch, open to start with: the light is off.
  'R 96 256 48 256 0 0 40 3.3 0 0 0.5',
  's 96 256 160 256 0 1 false',
  'r 160 256 240 256 0 470',
  'r 240 256 240 336 0 10000',
  'g 240 336 240 352 0 0',
  't 240 256 288 256 0 1 0 0 100 default',
  'g 288 272 288 352 0 0',
  'w 288 240 288 192 0',
  'R 288 48 240 48 0 0 40 5 0 0 0.5',
  ...ledBranches,
  'x 40 228 142 231 4 14 GPIO\\s13',
  'x 196 36 232 39 4 14 5\\sV',
].join('\n');

const BUZZER = [
  '$ 1 0.000005 10.20027730826997 50 5 43 5e-11',
  // GPIO 23 as a 3.3 V, 2 kHz square wave.
  'R 96 256 48 256 0 2 2000 1.65 1.65 0 0.5',
  'r 96 256 176 256 0 1000',
  't 176 256 224 256 0 1 0 0 100 default',
  'g 224 272 224 320 0 0',
  'w 224 240 224 208 0',
  // The buzzer: a coil with some resistance. Stand-in values.
  'l 224 208 224 128 0 0.005 0',
  'r 224 128 224 48 0 42',
  'R 224 48 176 48 0 0 40 5 0 0 0.5',
  // The diode across it, behind a switch so it can be taken away.
  'w 224 208 320 208 0',
  's 320 208 320 144 0 0 false',
  'd 320 144 320 48 2 default',
  'w 320 48 224 48 0',
  'x 40 228 142 231 4 14 GPIO\\s23',
  'x 132 36 168 39 4 14 5\\sV',
  'x 336 180 420 183 4 14 1N4148',
].join('\n');

export const CIRCUITS: Circuit[] = [
  {
    id: 'light',
    title: 'The light on Node B',
    try: 'Click the switch to close it. About 18 mA runs through each LED and about 110 mA through the transistor, which sits fully on. Open it again: the 10 kΩ pulls the base down and the light goes out.',
    note: 'Assumes a typical white LED, about 3.1 V at this current, and a transistor gain of 100. Yours will differ a little.',
    text: LIGHT,
  },
  {
    id: 'buzzer',
    title: 'The buzzer on Node A',
    try: 'It runs as loaded: a 2 kHz tone through the coil, and the transistor’s top leg never rises above about 5.7 V. Click the switch beside the diode to take the diode away, then hover over that leg: it now jumps to hundreds of volts each time the coil is switched off.',
    note: 'A sketch, not a prediction: the coil’s 42 Ω and 5 mH are stand-ins. Our buzzer has not been measured.',
    text: BUZZER,
  },
];

const SIMULATOR = 'https://www.falstad.com/circuit/circuitjs.html';

/** The simulator's address with a circuit loaded. `bare` hides its side panel, for a frame. */
export function circuitUrl(circuit: Circuit, bare: boolean) {
  const query = new URLSearchParams(bare ? { hideSidebar: 'true', cct: circuit.text } : { cct: circuit.text });
  return `${SIMULATOR}?${query}`;
}
