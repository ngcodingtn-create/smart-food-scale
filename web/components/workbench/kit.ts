/**
 * The parts actually in hand: the faculty's "Demande Matériels IOT" form of
 * 14 October 2026, as ticked by the lab, plus what the build needs that the
 * form did not list.
 *
 * What each part is and does comes from components/request/bom.ts, found by the
 * start of its name; this file only says what you have, what the photos showed,
 * and where each photo is.
 *
 * Photos are the owner's own, taken 23 October 2026, in public/workbench/kit/
 * (resized to 1400 px, metadata removed). What `why` says about a part was read
 * off those photos; where a photo could not settle something, it says so.
 */

export type KitStatus = 'have' | 'buy' | 'check' | 'skip' | 'swap';

export type KitItem = {
  id: string;
  /** Line on the faculty's form, if it was on it. */
  line: number | null;
  /** Start of the part's name in bom.ts. */
  bom: string;
  qty: string;
  status: KitStatus;
  /** What the photo showed, or why the status is what it is. */
  why?: string;
  /** A file in public/workbench/kit/. */
  photo?: string;
  /** More photos of the same line, shown small. */
  extra?: string[];
};

export const KIT: KitItem[] = [
  {
    id: 'devkit',
    line: 1,
    bom: 'ESP32 DevKit',
    qty: '1',
    status: 'swap',
    photo: 'devkit.jpg',
    why: 'The board in the photo is not an ESP32: its module reads ESP8266MOD, its pins are D0–D8 and A0, and its USB chip is a CH340. That is an ESP8266 NodeMCU. Ask the lab to swap it for the ESP32 DevKit on the form. If they cannot, the scale’s firmware can be moved to it.',
  },
  {
    id: 'esp32-cam',
    line: 2,
    bom: 'ESP32-CAM, AI-Thinker',
    qty: '1',
    status: 'have',
    photo: 'esp32-cam.jpg',
    why: 'OV2640 camera and microSD slot. The pin names printed on your board match the wiring page, in the same order.',
  },
  { id: 'esp32-cam-mb', line: 3, bom: 'ESP32-CAM-MB', qty: '1', status: 'check', why: 'Ticked on the form, but not in your photos. It is the small board with a USB socket that the camera plugs into.' },
  {
    id: 'usb-cable',
    line: null,
    bom: 'USB data cables',
    qty: '2',
    status: 'have',
    photo: 'usb-cable.jpg',
    why: 'Two USB-A to micro-USB cables. Whether they carry data shows the first time a board is plugged in: if the computer sees no new port, it is a charge-only cable.',
  },
  {
    id: 'load-cell',
    line: 4,
    bom: 'Bar load cell',
    qty: '1',
    status: 'have',
    photo: 'load-cell.jpg',
    why: 'Red, black, white and green wires, already plugged into a blue 4-way connector and extended with jumper wires. Its capacity is not readable in the photo: send a close-up of the label or engraving on its side.',
  },
  { id: 'hx711', line: 5, bom: 'HX711', qty: '1', status: 'check', why: 'Ticked on the form, but not in your photos. A small green or purple board with E+, E−, A−, A+ on one side and GND, DT, SCK, VCC on the other.' },
  {
    id: 'oled',
    line: 6,
    bom: 'SSD1306',
    qty: '1',
    status: 'have',
    photo: 'oled.jpg',
    why: '0.96″, 128 × 64, I²C, white. Its pins are in the order VCC, GND, SCL, SDA: the wiring drawing follows your module.',
  },
  {
    id: 'push-button',
    line: 7,
    bom: 'Tactile push button',
    qty: '2',
    status: 'have',
    photo: 'push-button.jpg',
    why: '12 × 12 mm, larger than the 6 × 6 asked for: same four legs, same job. One is in the photo: check you have two.',
  },
  {
    id: 'buzzer',
    line: 8,
    bom: 'Passive buzzer',
    qty: '1',
    status: 'have',
    photo: 'buzzer.jpg',
    why: 'A 3-pin module: S, a middle pin, and −. Measure between S and − with a multimeter. A few tens of ohms means a coil: wire it through the transistor, as the wiring page shows. No reading means a piezo, which can go straight to the pin.',
  },
  {
    id: 'transistor',
    line: 9,
    bom: '2N2222',
    qty: '2',
    status: 'have',
    photo: 'transistor.jpg',
    why: 'Two in TO-92 cases; one carries a “K” maker’s logo. The part number is not readable in the photo. Send a close-up of the flat face: the leg order depends on it.',
  },
  {
    id: 'diode',
    line: 10,
    bom: '1N4148',
    qty: '1',
    status: 'have',
    photo: 'diode.jpg',
    why: 'Small glass body with a black band. The band marks the cathode: it goes towards the buzzer’s +.',
  },
  {
    id: 'led-white',
    line: 11,
    bom: 'White LED',
    qty: '6',
    status: 'have',
    photo: 'led-white.jpg',
    why: 'Six water-clear 5 mm LEDs. The long leg is +. Their colour shows only when lit.',
  },
  {
    id: 'resistor',
    line: 12,
    bom: 'Resistors',
    qty: '9',
    status: 'have',
    photo: 'resistor.jpg',
    why: 'In labelled paper strips: 6 × 100 Ω, 470 Ω, 1 kΩ and 10 kΩ. Keep them in the strips until each goes in.',
  },
  { id: 'cap-ceramic', line: 13, bom: 'Ceramic capacitor, 100 nF', qty: '4', status: 'check', why: 'Ticked on the form, but not in your photos. Small yellow or brown discs, usually marked 104.' },
  {
    id: 'cap-10u',
    line: 14,
    bom: 'Electrolytic capacitor, 10 µF',
    qty: '1',
    status: 'check',
    photo: 'cap-electrolytic.jpg',
    why: 'Five electrolytic capacitors in the photo; one reads 100 µF 25 V, the others’ values are turned away. Send a close-up of their labels to find the 10 µF.',
  },
  { id: 'shielded-cable', line: 15, bom: 'Shielded 4-core', qty: '1', status: 'skip', why: 'Crossed out on the form, and the load cell’s wires are already extended.' },
  {
    id: 'breadboard',
    line: 16,
    bom: 'Breadboard and jumper wires',
    qty: '1 + 30 wires',
    status: 'have',
    photo: 'breadboard.jpg',
    extra: ['jumpers-mm.jpg', 'jumpers-mf.jpg', 'jumpers-ff.jpg'],
    why: 'A full-size breadboard with + and − rails on both sides, and the three sets of 10 jumpers: male–male, male–female, female–female.',
  },
  { id: 'cap-1000u', line: 17, bom: 'Electrolytic capacitor, 1000 µF', qty: '2', status: 'buy', why: 'About 0.9 TND each (Tuni Smart, 12 Oct). The prototype runs without; the final build needs them.' },
  { id: 'charger', line: 18, bom: '5 V / 2 A USB wall charger', qty: '1', status: 'check', why: 'Any phone charger marked 2 A or more. The laptop powers both boards on the bench.' },
  { id: 'header-pins', line: 19, bom: 'Male header strip', qty: '1 strip', status: 'check', why: 'Only if the HX711 or the display came with loose pins in the bag.' },
  { id: 'microsd', line: null, bom: 'microSD card', qty: '1', status: 'check', why: 'Not on the form. A spare phone card, FAT32. Optional: it keeps photos when the Wi-Fi is down.' },
];
