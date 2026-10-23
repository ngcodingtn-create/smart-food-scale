/**
 * The parts actually in hand: the faculty's "Demande Matériels IOT" form of
 * 14 October 2026, as ticked by the lab, plus what the build needs that the
 * form did not list.
 *
 * What each part is and does comes from components/request/bom.ts, found by the
 * start of its name; this file only says what you have, and where its photo is.
 *
 * Photos of your own parts go in public/workbench/kit/, named in `photo`.
 */

export type KitStatus = 'have' | 'buy' | 'check' | 'skip';

export type KitItem = {
  id: string;
  /** Line on the faculty's form, if it was on it. */
  line: number | null;
  /** Start of the part's name in bom.ts. */
  bom: string;
  qty: string;
  status: KitStatus;
  /** Why the status is what it is, when that is not obvious. */
  why?: string;
  /** A file in public/workbench/kit/, once a photo of yours has been added. */
  photo?: string;
};

export const KIT: KitItem[] = [
  { id: 'devkit', line: 1, bom: 'ESP32 DevKit', qty: '1', status: 'have' },
  { id: 'esp32-cam', line: 2, bom: 'ESP32-CAM, AI-Thinker', qty: '1', status: 'have' },
  { id: 'esp32-cam-mb', line: 3, bom: 'ESP32-CAM-MB', qty: '1', status: 'have' },
  { id: 'usb-cable', line: null, bom: 'USB data cables', qty: '2', status: 'check', why: 'Written next to lines 1 and 2. They must carry data, not only charge.' },
  { id: 'load-cell', line: 4, bom: 'Bar load cell', qty: '1', status: 'have' },
  { id: 'hx711', line: 5, bom: 'HX711', qty: '1', status: 'have' },
  { id: 'oled', line: 6, bom: 'SSD1306', qty: '1', status: 'have' },
  { id: 'push-button', line: 7, bom: 'Tactile push button', qty: '2', status: 'have' },
  { id: 'buzzer', line: 8, bom: 'Passive buzzer', qty: '1', status: 'have' },
  { id: 'transistor', line: 9, bom: '2N2222', qty: '2', status: 'have' },
  { id: 'diode', line: 10, bom: '1N4148', qty: '1', status: 'have' },
  { id: 'led-white', line: 11, bom: 'White LED', qty: '6', status: 'have' },
  { id: 'resistor', line: 12, bom: 'Resistors', qty: '9', status: 'have', why: '6 × 100 Ω, 1 × 470 Ω, 1 × 1 kΩ, 1 × 10 kΩ.' },
  { id: 'cap-ceramic', line: 13, bom: 'Ceramic capacitor, 100 nF', qty: '4', status: 'have' },
  { id: 'cap-10u', line: 14, bom: 'Electrolytic capacitor, 10 µF', qty: '1', status: 'have' },
  { id: 'shielded-cable', line: 15, bom: 'Shielded 4-core', qty: '1', status: 'skip', why: 'Crossed out on the form. Only needed if the load cell’s own wires do not reach the HX711.' },
  { id: 'breadboard', line: 16, bom: 'Breadboard and jumper wires', qty: '1 + 30 wires', status: 'have', why: '10 male–male, 10 male–female, 10 female–female.' },
  { id: 'cap-1000u', line: 17, bom: 'Electrolytic capacitor, 1000 µF', qty: '2', status: 'buy', why: 'About 0.9 TND each (Tuni Smart, 12 Oct). The prototype runs without; the final build needs them.' },
  { id: 'charger', line: 18, bom: '5 V / 2 A USB wall charger', qty: '1', status: 'check', why: 'Any phone charger marked 2 A or more. The laptop powers both boards on the bench.' },
  { id: 'header-pins', line: 19, bom: 'Male header strip', qty: '1 strip', status: 'check', why: 'Only if the HX711 or the display came with loose pins in the bag.' },
  { id: 'microsd', line: null, bom: 'microSD card', qty: '1', status: 'check', why: 'Not on the form. A spare phone card, FAT32. Optional: it keeps photos when the Wi-Fi is down.' },
];
