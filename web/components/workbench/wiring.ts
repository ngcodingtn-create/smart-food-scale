/**
 * Every wire in the build, as data. The "Wire it" page, its pin tables, the
 * firmware's pin header and the simulator's diagram are all generated from this
 * one list, so the drawing, the code and the simulation cannot disagree.
 *
 * Where a line comes from:
 *   - GPIO numbers, the load cell's colours, the light circuit and the power
 *     rules: the project's pin map (the old Wiring page, decisions D12 and D13).
 *   - The DevKit's pin order: the 30-pin DOIT layout, checked on 2026-10-13
 *     against the open-source part definition in wokwi/wokwi-elements.
 *   - The ESP32-CAM's pin order: as commonly drawn for the AI-Thinker board.
 *     Not confirmed against a board in hand: the names printed beside the pins
 *     are the authority, not their position in this file.
 *   - Anything marked `proposed`: a choice made while writing this file,
 *     because the pin map did not say. It is labelled as such on the page.
 *
 * This file has no imports on purpose: web/scripts/sync-wiring.mjs loads it
 * directly with Node.
 */

export type NodeId = 'a' | 'b';

export type Colour = 'red' | 'black' | 'yellow' | 'orange' | 'green' | 'blue' | 'violet' | 'grey' | 'white';

/** One end of a wire: a part on the bench, and the name printed beside its pin. */
export type End = { part: string; pin: string };

export type Wire = {
  /** Stable: it is the key the page ticks off, and the key of the drawing. */
  id: string;
  from: End;
  to: End;
  /** A suggestion. Any wire works; red and black for power is the habit worth keeping. */
  colour: Colour;
  /** A component that sits in this link, in series. */
  through?: string;
  /** The same link, made this many times. */
  times?: number;
  /** jumper: a breadboard wire. lead: soldered, short. part: the component's own legs. */
  kind?: 'jumper' | 'lead' | 'part';
  /** The instruction, as you would say it across a bench. */
  say: string;
  /** The non-obvious part: why, or what goes wrong otherwise. */
  why?: string;
  /** The GPIO this wire lands on, and the name the firmware calls it. */
  gpio?: { number: number; name: string };
  /** Set when the pin map did not specify this, with the reason for the choice. */
  proposed?: string;
};

export type Group = { title: string; wires: Wire[] };

export type Part = {
  id: string;
  /** Short name, as it reads in a list: "HX711 DT". */
  name: string;
  /** Start of the part's name in components/request/bom.ts, when it is on the request. */
  bom?: string;
};

export type Board = {
  name: string;
  /** Pin names as printed on the board, top to bottom, USB or lens end last. */
  left: string[];
  right: string[];
  /** What the layout was checked against. */
  checked: string;
};

export type NodeWiring = {
  id: NodeId;
  title: string;
  job: string;
  board: Board;
  parts: Part[];
  groups: Group[];
};

const DEVKIT: Board = {
  name: 'ESP32 DevKit V1, 30-pin',
  left: ['EN', 'VP', 'VN', 'D34', 'D35', 'D32', 'D33', 'D25', 'D26', 'D27', 'D14', 'D12', 'D13', 'GND', 'VIN'],
  right: ['D23', 'D22', 'TX0', 'RX0', 'D21', 'D19', 'D18', 'D5', 'TX2', 'RX2', 'D4', 'D2', 'D15', 'GND', '3V3'],
  checked: 'the 30-pin DOIT layout in wokwi/wokwi-elements, 2026-10-13',
};

const ESP32_CAM: Board = {
  name: 'ESP32-CAM, AI-Thinker',
  left: ['5V', 'GND', 'IO12', 'IO13', 'IO15', 'IO14', 'IO2', 'IO4'],
  right: ['3V3', 'IO16', 'IO0', 'GND', 'VCC', 'U0R', 'U0T', 'GND'],
  checked: 'nothing: the order as commonly drawn, not confirmed on a board',
};

const NODE_A: NodeWiring = {
  id: 'a',
  title: 'Node A',
  job: 'the scale',
  board: DEVKIT,
  parts: [
    { id: 'esp32', name: 'DevKit', bom: 'ESP32 DevKit' },
    { id: 'hx711', name: 'HX711', bom: 'HX711' },
    { id: 'cell', name: 'Load cell', bom: 'Bar load cell' },
    { id: 'oled', name: 'OLED', bom: 'SSD1306' },
    { id: 'tare', name: 'Tare button', bom: 'Tactile push button' },
    { id: 'capture', name: 'Capture button', bom: 'Tactile push button' },
    { id: 'q1', name: 'Transistor', bom: '2N2222' },
    { id: 'buzzer', name: 'Buzzer', bom: 'Passive buzzer' },
    { id: 'v33', name: '3V3 rail' },
    { id: 'gnd', name: 'GND rail' },
    { id: 'v5', name: '5 V rail' },
    { id: 'supply', name: '5 V supply', bom: '5 V / 2 A USB wall charger' },
  ],
  groups: [
    {
      title: 'Power rails',
      wires: [
        {
          id: 'a-3v3',
          from: { part: 'esp32', pin: '3V3' },
          to: { part: 'v33', pin: 'rail' },
          colour: 'red',
          say: 'DevKit 3V3 to one of the breadboard’s + rails. This is the 3V3 rail.',
        },
        {
          id: 'a-gnd',
          from: { part: 'esp32', pin: 'GND' },
          to: { part: 'gnd', pin: 'rail' },
          colour: 'black',
          say: 'DevKit GND, the one beside 3V3, to the − rail. Every ground meets here.',
        },
        {
          id: 'a-5v',
          from: { part: 'esp32', pin: 'VIN' },
          to: { part: 'v5', pin: 'rail' },
          colour: 'red',
          say: 'DevKit VIN to the + rail on the other side of the breadboard. This is the 5 V rail.',
          why: 'Keep the two + rails apart. One carries 3.3 V, the other 5 V; joining them destroys the board.',
          proposed: 'The pin map never said where the buzzer takes its supply. 5 V keeps its pulses off the 3V3 that feeds the HX711.',
        },
        {
          id: 'a-decouple',
          from: { part: 'v33', pin: 'rail' },
          to: { part: 'gnd', pin: 'rail' },
          colour: 'grey',
          through: '100 nF',
          kind: 'part',
          say: 'A 100 nF capacitor between the 3V3 rail and the GND rail, near the DevKit.',
        },
      ],
    },
    {
      title: 'HX711',
      wires: [
        {
          id: 'a-hx-vcc',
          from: { part: 'hx711', pin: 'VCC' },
          to: { part: 'v33', pin: 'rail' },
          colour: 'red',
          say: 'HX711 VCC to the 3V3 rail.',
          why: 'Not 5 V. At 5 V its data pin swings to 5 V, which the ESP32 is not rated for.',
        },
        {
          id: 'a-hx-gnd',
          from: { part: 'hx711', pin: 'GND' },
          to: { part: 'gnd', pin: 'rail' },
          colour: 'black',
          say: 'HX711 GND to the GND rail.',
        },
        {
          id: 'a-hx-dt',
          from: { part: 'hx711', pin: 'DT' },
          to: { part: 'esp32', pin: 'RX2' },
          colour: 'yellow',
          say: 'HX711 DT to the pin printed RX2. That is GPIO 16.',
          why: 'If the metal shield says WROVER, GPIO 16 and 17 are taken by its memory: use GPIO 25 and 26.',
          gpio: { number: 16, name: 'HX711_DT' },
        },
        {
          id: 'a-hx-sck',
          from: { part: 'hx711', pin: 'SCK' },
          to: { part: 'esp32', pin: 'TX2' },
          colour: 'orange',
          say: 'HX711 SCK to the pin printed TX2. That is GPIO 17.',
          gpio: { number: 17, name: 'HX711_SCK' },
        },
        {
          id: 'a-hx-caps',
          from: { part: 'hx711', pin: 'VCC' },
          to: { part: 'hx711', pin: 'GND' },
          colour: 'grey',
          through: '10 µF + 100 nF',
          kind: 'part',
          say: 'A 10 µF and a 100 nF capacitor across VCC and GND, right at the module.',
          why: 'They keep the amplifier’s supply quiet. The 10 µF has a stripe: that leg goes to GND.',
        },
      ],
    },
    {
      title: 'Load cell',
      wires: [
        {
          id: 'a-cell-red',
          from: { part: 'cell', pin: 'red' },
          to: { part: 'hx711', pin: 'E+' },
          colour: 'red',
          kind: 'lead',
          say: 'The cell’s red wire to E+.',
          why: 'If you lengthen the four wires with the shielded cable, ground its braid at the HX711 end only.',
        },
        {
          id: 'a-cell-black',
          from: { part: 'cell', pin: 'black' },
          to: { part: 'hx711', pin: 'E−' },
          colour: 'black',
          kind: 'lead',
          say: 'The cell’s black wire to E−.',
        },
        {
          id: 'a-cell-white',
          from: { part: 'cell', pin: 'white' },
          to: { part: 'hx711', pin: 'A−' },
          colour: 'white',
          kind: 'lead',
          say: 'The cell’s white wire to A−.',
        },
        {
          id: 'a-cell-green',
          from: { part: 'cell', pin: 'green' },
          to: { part: 'hx711', pin: 'A+' },
          colour: 'green',
          kind: 'lead',
          say: 'The cell’s green wire to A+.',
          why: 'Readings come out negative? Swap white and green. It is the expected first-boot symptom, not a fault.',
        },
      ],
    },
    {
      title: 'Display',
      wires: [
        {
          id: 'a-oled-vcc',
          from: { part: 'oled', pin: 'VCC' },
          to: { part: 'v33', pin: 'rail' },
          colour: 'red',
          say: 'OLED VCC to the 3V3 rail.',
        },
        {
          id: 'a-oled-gnd',
          from: { part: 'oled', pin: 'GND' },
          to: { part: 'gnd', pin: 'rail' },
          colour: 'black',
          say: 'OLED GND to the GND rail.',
          why: 'Read the four labels on your module before plugging it in: some swap VCC and GND.',
        },
        {
          id: 'a-oled-scl',
          from: { part: 'oled', pin: 'SCL' },
          to: { part: 'esp32', pin: 'D22' },
          colour: 'green',
          say: 'OLED SCL to D22.',
          gpio: { number: 22, name: 'OLED_SCL' },
        },
        {
          id: 'a-oled-sda',
          from: { part: 'oled', pin: 'SDA' },
          to: { part: 'esp32', pin: 'D21' },
          colour: 'blue',
          say: 'OLED SDA to D21.',
          why: 'I²C, address 0x3C.',
          gpio: { number: 21, name: 'OLED_SDA' },
        },
      ],
    },
    {
      title: 'Buttons',
      wires: [
        {
          id: 'a-capture',
          from: { part: 'capture', pin: 'leg' },
          to: { part: 'esp32', pin: 'D19' },
          colour: 'violet',
          say: 'One leg of the capture button to D19.',
          gpio: { number: 19, name: 'BUTTON_CAPTURE' },
        },
        {
          id: 'a-capture-gnd',
          from: { part: 'capture', pin: 'opposite leg' },
          to: { part: 'gnd', pin: 'rail' },
          colour: 'black',
          say: 'The leg diagonally opposite to the GND rail.',
          why: 'Diagonal legs are always the two the button joins, whichever way round it sits.',
        },
        {
          id: 'a-tare',
          from: { part: 'tare', pin: 'leg' },
          to: { part: 'esp32', pin: 'D18' },
          colour: 'white',
          say: 'One leg of the tare button to D18.',
          why: 'No resistor: the firmware switches on the pin’s own pull-up.',
          gpio: { number: 18, name: 'BUTTON_TARE' },
        },
        {
          id: 'a-tare-gnd',
          from: { part: 'tare', pin: 'opposite leg' },
          to: { part: 'gnd', pin: 'rail' },
          colour: 'black',
          say: 'The leg diagonally opposite to the GND rail.',
        },
      ],
    },
    {
      title: 'Buzzer',
      wires: [
        {
          id: 'a-buz-base',
          from: { part: 'esp32', pin: 'D23' },
          to: { part: 'q1', pin: 'base' },
          colour: 'yellow',
          through: '1 kΩ',
          say: 'D23, through a 1 kΩ resistor, to the transistor’s base.',
          why: 'Which leg is the base depends on the exact part: 2N2222s in plastic come in both orders. Find it with a multimeter’s diode test, or the datasheet for the marking on yours.',
          gpio: { number: 23, name: 'BUZZER' },
        },
        {
          id: 'a-buz-emitter',
          from: { part: 'q1', pin: 'emitter' },
          to: { part: 'gnd', pin: 'rail' },
          colour: 'black',
          say: 'The transistor’s emitter to the GND rail.',
        },
        {
          id: 'a-buz-collector',
          from: { part: 'buzzer', pin: '−' },
          to: { part: 'q1', pin: 'collector' },
          colour: 'blue',
          say: 'The buzzer’s − leg to the transistor’s collector.',
        },
        {
          id: 'a-buz-supply',
          from: { part: 'buzzer', pin: '+' },
          to: { part: 'v5', pin: 'rail' },
          colour: 'red',
          say: 'The buzzer’s + leg to the 5 V rail.',
          proposed: 'The pin map never said which supply. 5 V keeps the buzzer’s pulses off the 3V3 that feeds the HX711.',
        },
        {
          id: 'a-buz-diode',
          from: { part: 'buzzer', pin: '−' },
          to: { part: 'buzzer', pin: '+' },
          colour: 'grey',
          through: '1N4148',
          kind: 'part',
          say: 'The 1N4148 across the buzzer’s two legs, its stripe towards +.',
          why: 'The buzzer is a coil. Switched off, it kicks back; the diode absorbs that instead of the transistor.',
        },
      ],
    },
    {
      title: 'Away from the bench',
      wires: [
        {
          id: 'a-supply',
          from: { part: 'supply', pin: '+' },
          to: { part: 'v5', pin: 'rail' },
          colour: 'red',
          kind: 'lead',
          say: 'The supply’s 5 V lead to the 5 V rail. On the bench, the USB cable does this job.',
          why: 'Unplug USB before connecting it. Whether this board keeps USB and VIN apart was never checked.',
        },
        {
          id: 'a-supply-gnd',
          from: { part: 'supply', pin: '−' },
          to: { part: 'gnd', pin: 'rail' },
          colour: 'black',
          kind: 'lead',
          say: 'The supply’s ground lead to the GND rail.',
        },
      ],
    },
  ],
};

const NODE_B: NodeWiring = {
  id: 'b',
  title: 'Node B',
  job: 'the camera',
  board: ESP32_CAM,
  parts: [
    { id: 'cam', name: 'ESP32-CAM', bom: 'ESP32-CAM, AI-Thinker' },
    { id: 'q2', name: 'Transistor', bom: '2N2222' },
    { id: 'leds', name: 'LEDs', bom: 'White LED' },
    { id: 'v5', name: '5 V lead' },
    { id: 'gnd', name: 'Ground lead' },
  ],
  groups: [
    {
      title: 'Power',
      wires: [
        {
          id: 'b-5v',
          from: { part: 'v5', pin: 'lead' },
          to: { part: 'cam', pin: '5V' },
          colour: 'red',
          kind: 'lead',
          say: 'The supply’s 5 V lead to the pin printed 5V. Short, thick, soldered.',
          why: 'No breadboard anywhere in this path. Its contacts alone can drop enough to reset the camera mid-photo.',
        },
        {
          id: 'b-gnd',
          from: { part: 'gnd', pin: 'lead' },
          to: { part: 'cam', pin: 'GND' },
          colour: 'black',
          kind: 'lead',
          say: 'The supply’s ground lead to the GND beside it.',
        },
        {
          id: 'b-bulk',
          from: { part: 'cam', pin: '5V' },
          to: { part: 'cam', pin: 'GND' },
          colour: 'grey',
          through: '1000 µF + 100 nF',
          kind: 'part',
          say: 'A 1000 µF and a 100 nF capacitor across 5V and GND, as close to the pins as they will go.',
          why: 'Without it the camera resets when Wi-Fi and the sensor start together. The 1000 µF has a stripe: that leg goes to GND.',
        },
        {
          id: 'b-split',
          from: { part: 'v5', pin: 'lead' },
          to: { part: 'gnd', pin: 'lead' },
          colour: 'grey',
          through: '1000 µF',
          kind: 'part',
          say: 'The second 1000 µF across the supply, where it splits to the two boards.',
          why: 'One lead from the supply to each board, joined only here.',
        },
      ],
    },
    {
      title: 'The light',
      wires: [
        {
          id: 'b-light-base',
          from: { part: 'cam', pin: 'IO13' },
          to: { part: 'q2', pin: 'base' },
          colour: 'yellow',
          through: '470 Ω',
          say: 'IO13, through a 470 Ω resistor, to the transistor’s base.',
          why: 'IO13, not IO12. IO12 is read at boot to pick the flash voltage: a line that idles high there stops the board starting.',
          gpio: { number: 13, name: 'LIGHT' },
        },
        {
          id: 'b-light-pulldown',
          from: { part: 'q2', pin: 'base' },
          to: { part: 'gnd', pin: 'lead' },
          colour: 'grey',
          through: '10 kΩ',
          kind: 'part',
          say: 'A 10 kΩ resistor from the base to ground.',
          why: 'It holds the light off while the board boots.',
        },
        {
          id: 'b-light-emitter',
          from: { part: 'q2', pin: 'emitter' },
          to: { part: 'gnd', pin: 'lead' },
          colour: 'black',
          say: 'The transistor’s emitter to ground.',
        },
        {
          id: 'b-light-leds',
          from: { part: 'v5', pin: 'lead' },
          to: { part: 'leds', pin: 'long legs' },
          colour: 'red',
          through: '100 Ω',
          times: 6,
          say: '5 V, through a 100 Ω resistor, to an LED’s long leg. Six times: one resistor for each LED.',
          why: 'About 18 mA each, 110 mA in all, taken from the supply and not through the ESP32-CAM.',
        },
        {
          id: 'b-light-collector',
          from: { part: 'leds', pin: 'short legs' },
          to: { part: 'q2', pin: 'collector' },
          colour: 'blue',
          times: 6,
          say: 'All six short legs, joined, to the transistor’s collector.',
          why: 'A 2N2222 here, not a BC547: that one is rated 100 mA and the six LEDs draw about 110.',
        },
        {
          id: 'b-light-cap',
          from: { part: 'v5', pin: 'lead' },
          to: { part: 'gnd', pin: 'lead' },
          colour: 'grey',
          through: '100 nF',
          kind: 'part',
          say: 'A 100 nF capacitor across the light’s 5 V and ground, at the LEDs.',
        },
      ],
    },
  ],
};

export const NODES: NodeWiring[] = [NODE_A, NODE_B];

export const wiresOf = (node: NodeWiring) => node.groups.flatMap((group) => group.wires);

/** Every GPIO the wiring uses, in pin order. The firmware's pin header is this list. */
export const gpiosOf = (node: NodeWiring) =>
  wiresOf(node)
    .flatMap((wire) => (wire.gpio ? [{ ...wire.gpio, wire }] : []))
    .sort((first, second) => first.number - second.number);

/** The name printed on a part's end of a wire, for a sentence: "HX711 DT". */
export function endName(node: NodeWiring, end: End) {
  const part = node.parts.find((item) => item.id === end.part);
  if (!part) throw new Error(`Wire end names "${end.part}", which ${node.title} does not list. Check wiring.ts.`);
  if (end.pin === 'rail' || end.pin === 'lead') return part.name;
  return `${part.name} ${end.pin}`;
}
