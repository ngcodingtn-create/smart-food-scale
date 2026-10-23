/**
 * Every wire in the build, as data. The "Wire it" page, its pin tables, the
 * firmware's pin header and the simulator's diagram are all generated from this
 * one list, so the drawing, the code and the simulation cannot disagree.
 *
 * Where a line comes from:
 *   - GPIO numbers, the load cell's colours, the light circuit and the power
 *     rules: the project's pin map (the old Wiring page, decisions D12 and D13).
 *   - Node A's board: the lab handed over an ESP8266 NodeMCU, not the ESP32
 *     DevKit on the request, and the scale runs on it. Its pin order was read off
 *     the owner's board, photographed 23 October 2026 (the CH340 "LoLin V3"
 *     layout). Its GPIOs were chosen on 23 October 2026 around the ESP8266's boot
 *     pins: GPIO 0 and 2 must not be low at power-on, GPIO 15 must not be high.
 *   - Each of Node A's GPIOs also names the ESP32 DevKit pin it had before
 *     (`esp32`). The Wokwi simulator has no ESP8266, so the simulation still runs
 *     the same firmware on a DevKit, on those pins. The DevKit's pin names are the
 *     30-pin DOIT layout in wokwi/wokwi-elements, checked 2026-10-13.
 *   - The ESP32-CAM's pin order: read off the owner's own board, photographed
 *     23 October 2026. It matches the order as commonly drawn.
 *   - The display's pin order (VCC, GND, SCL, SDA): the owner's module, same photos.
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
  gpio?: {
    number: number;
    name: string;
    /** Node A only: the same signal on an ESP32 DevKit, for the Wokwi simulation. */
    esp32?: { number: number; pin: string };
  };
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

const NODEMCU: Board = {
  name: 'NodeMCU, ESP8266',
  left: ['A0', 'G', 'VU', 'S3', 'S2', 'S1', 'SC', 'S0', 'SK', 'G', '3V', 'EN', 'RST', 'G', 'VIN'],
  right: ['D0', 'D1', 'D2', 'D3', 'D4', '3V', 'G', 'D5', 'D6', 'D7', 'D8', 'RX', 'TX', 'G', '3V'],
  checked: 'the pin names printed on our own board, photographed 23 October 2026',
};

const ESP32_CAM: Board = {
  name: 'ESP32-CAM, AI-Thinker',
  left: ['5V', 'GND', 'IO12', 'IO13', 'IO15', 'IO14', 'IO2', 'IO4'],
  right: ['3V3', 'IO16', 'IO0', 'GND', 'VCC', 'U0R', 'U0T', 'GND'],
  checked: 'the pin names printed on our own board, photographed 23 October 2026',
};

const NODE_A: NodeWiring = {
  id: 'a',
  title: 'Node A',
  job: 'the scale',
  board: NODEMCU,
  parts: [
    { id: 'mcu', name: 'NodeMCU' },
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
          from: { part: 'mcu', pin: '3V' },
          to: { part: 'v33', pin: 'rail' },
          colour: 'red',
          say: 'NodeMCU 3V, the one between D4 and G, to one of the breadboard’s + rails. This is the 3V3 rail.',
        },
        {
          id: 'a-gnd',
          from: { part: 'mcu', pin: 'G' },
          to: { part: 'gnd', pin: 'rail' },
          colour: 'black',
          say: 'NodeMCU G, the one just below that 3V, to the − rail. Every ground meets here.',
        },
        {
          id: 'a-5v',
          from: { part: 'mcu', pin: 'VIN' },
          to: { part: 'v5', pin: 'rail' },
          colour: 'red',
          say: 'NodeMCU VIN to the + rail on the other side of the breadboard. This is the 5 V rail.',
          why: 'Keep the two + rails apart. One carries 3.3 V, the other 5 V; joining them destroys the board. On USB, VIN may sit a diode’s drop under 5 V: measure yours, VIN to G.',
          proposed: 'The pin map never said where the buzzer takes its supply. 5 V keeps its pulses off the 3V3 that feeds the HX711.',
        },
        {
          id: 'a-decouple',
          from: { part: 'v33', pin: 'rail' },
          to: { part: 'gnd', pin: 'rail' },
          colour: 'grey',
          through: '100 nF',
          kind: 'part',
          say: 'A 100 nF capacitor between the 3V3 rail and the GND rail, near the NodeMCU.',
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
          why: 'Not 5 V. At 5 V its data pin swings to 5 V, which the ESP8266 is not rated for.',
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
          to: { part: 'mcu', pin: 'D6' },
          colour: 'yellow',
          say: 'HX711 DT to D6. That is GPIO 12.',
          gpio: { number: 12, name: 'HX711_DT', esp32: { number: 16, pin: 'RX2' } },
        },
        {
          id: 'a-hx-sck',
          from: { part: 'hx711', pin: 'SCK' },
          to: { part: 'mcu', pin: 'D7' },
          colour: 'orange',
          say: 'HX711 SCK to D7. That is GPIO 13.',
          gpio: { number: 13, name: 'HX711_SCK', esp32: { number: 17, pin: 'TX2' } },
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
          to: { part: 'mcu', pin: 'D1' },
          colour: 'green',
          say: 'OLED SCL to D1. That is GPIO 5.',
          gpio: { number: 5, name: 'OLED_SCL', esp32: { number: 22, pin: 'D22' } },
        },
        {
          id: 'a-oled-sda',
          from: { part: 'oled', pin: 'SDA' },
          to: { part: 'mcu', pin: 'D2' },
          colour: 'blue',
          say: 'OLED SDA to D2. That is GPIO 4.',
          why: 'I²C, address 0x3C.',
          gpio: { number: 4, name: 'OLED_SDA', esp32: { number: 21, pin: 'D21' } },
        },
      ],
    },
    {
      title: 'Buttons',
      wires: [
        {
          id: 'a-capture',
          from: { part: 'capture', pin: 'leg' },
          to: { part: 'mcu', pin: 'D3' },
          colour: 'violet',
          say: 'One leg of the capture button to D3. That is GPIO 0.',
          why: 'GPIO 0 picks the boot mode: held down while the board powers up, this button starts it in flashing mode instead. The board’s own FLASH button is on the same pin, so it works as PHOTO too.',
          gpio: { number: 0, name: 'BUTTON_CAPTURE', esp32: { number: 19, pin: 'D19' } },
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
          to: { part: 'mcu', pin: 'D5' },
          colour: 'white',
          say: 'One leg of the tare button to D5. That is GPIO 14.',
          why: 'No resistor: the firmware switches on the pin’s own pull-up.',
          gpio: { number: 14, name: 'BUTTON_TARE', esp32: { number: 18, pin: 'D18' } },
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
          from: { part: 'mcu', pin: 'D8' },
          to: { part: 'q1', pin: 'base' },
          colour: 'yellow',
          through: '1 kΩ',
          say: 'D8, through a 1 kΩ resistor, to the transistor’s base. D8 is GPIO 15.',
          why: 'Yours reads 2N2222A: flat face towards you, legs down, the base is the middle leg; check the outer two with a multimeter’s diode test. GPIO 15 must be low at power-on: the board holds it there, and a transistor’s base does not pull it up.',
          gpio: { number: 15, name: 'BUZZER', esp32: { number: 23, pin: 'D23' } },
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
