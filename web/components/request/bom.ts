/**
 * The component request, as data. The page's part cards, the buy total and the
 * hand-in table at the bottom are all generated from this one list, so they
 * cannot disagree with each other.
 *
 * Sourcing research was done on 2026-10-12: Tunisian shop pages for prices,
 * starter-kit contents and vendor partner lists for what a faculty lab stocks.
 * No faculty inventory was available, so "lab" means "a teaching lab almost
 * always has this", not "we confirmed this lab has it".
 */

export type Source = 'lab' | 'buy' | 'bench' | 'alt';
export type Where = 'Node A' | 'Node B' | 'Both nodes' | 'Build' | 'Bench';

export type Price = {
  /** Dinars, per unit. */
  tnd: number;
  shop: string;
  href: string;
  /** "page": the product page was opened; "listing": seen on a search/category page only. */
  seen: 'page' | 'listing';
};

export type Part = {
  /** Drawing id in ./art/*.tsx. */
  art: string;
  name: string;
  qty: number;
  /** How the quantity is counted, when "×2" alone would be ambiguous. */
  unit?: string;
  where: Where;
  source: Source;
  /** What it does in the build, one line. */
  role: string;
  /** The non-obvious part: why this choice, or what goes wrong without it. */
  note?: string;
  /** Lab parts: what to buy if the lab hasn't got one. */
  fallback?: Price;
  price?: Price;
  /** Changed since the first draft of the request. */
  changed?: string;
  /** Optional extras, left out of the total. */
  optional?: boolean;
};

const DIDACTICO = 'Didactico';
const TUNISMART = 'Tuni Smart';
const COTHINGS = 'CoThings';

export const PARTS: Part[] = [
  // --- Buy: nothing in a teaching lab replaces these -------------------------
  {
    art: 'esp32-cam',
    name: 'ESP32-CAM, AI-Thinker, OV2640',
    qty: 1,
    where: 'Node B',
    source: 'buy',
    role: 'Takes the photo and posts it with the grams over Wi-Fi.',
    note: 'No starter kit ships one. Focus the lens by hand for the mounting height; the factory focus is set far.',
    price: { tnd: 33.5, shop: DIDACTICO, href: 'https://didactico.tn/produit/camera-espcam-ov2640/', seen: 'page' },
  },
  {
    art: 'esp32-cam-mb',
    name: 'ESP32-CAM-MB programmer base',
    qty: 1,
    where: 'Node B',
    source: 'buy',
    role: 'Plugs under the ESP32-CAM: USB, serial and the BOOT/RST buttons.',
    note: 'The camera board has no USB port. This is the cheapest way to flash it and the least fiddly.',
    changed: 'Replaces the stand-alone USB-to-TTL adapter.',
    price: { tnd: 9.5, shop: DIDACTICO, href: 'https://didactico.tn/produit/module-shield-esp32-cam-mb/', seen: 'page' },
  },
  {
    art: 'load-cell',
    name: 'Bar load cell, 1 kg, 4-wire',
    qty: 1,
    where: 'Node A',
    source: 'buy',
    role: 'The scale itself. Bends a few microns under the plate.',
    note: 'Keep plate plus platform under 250 g so a full meal stays inside the rating. Match the screws to the cell that arrives: M3 on a TAL221-size bar, M4/M5 on the common 80 mm bar.',
    price: { tnd: 8, shop: TUNISMART, href: 'https://tuni-smart-innovation.com/products/capteur-de-poids-1kg', seen: 'page' },
  },
  {
    art: 'hx711',
    name: 'HX711 load-cell amplifier',
    qty: 1,
    where: 'Node A',
    source: 'buy',
    role: '24-bit converter that reads the bridge. Gain 128, 10 samples/s.',
    note: 'Power it from the DevKit’s 3V3 pin. At 5 V its data pin swings to 5 V, which the ESP32 is not rated for.',
    price: { tnd: 7, shop: DIDACTICO, href: 'https://didactico.tn/produit/capteur-pesage-hx711/', seen: 'page' },
  },
  {
    art: 'oled',
    name: 'SSD1306 OLED, 0.96″, 128 × 64, I²C',
    qty: 1,
    where: 'Node A',
    source: 'buy',
    role: 'Shows the live weight and what the scale is doing.',
    note: 'Ask the lab first: some ESP32 kits include one. Runs at 3.3 V directly, unlike a 16 × 2 LCD.',
    price: { tnd: 18, shop: DIDACTICO, href: 'https://didactico.tn/produit/ecran-oled-0-96-i2c/', seen: 'page' },
  },
  {
    art: 'charger',
    name: '5 V / 2 A USB wall charger',
    qty: 1,
    where: 'Both nodes',
    source: 'buy',
    role: 'Powers the finished scale away from the bench.',
    note: 'Any phone charger rated 2 A or more will do, so bring one before buying. Not a power bank.',
    price: {
      tnd: 7.6,
      shop: 'Tunisianet',
      href: 'https://www.tunisianet.com.tn/chargeurs-et-cables-pour-telephones/57264-chargeur-secteur-modemcat-mtc-005-2x-usb-avec-cable-micro-usb-24a-blanc.html',
      seen: 'page',
    },
  },
  {
    art: 'cap-electrolytic',
    name: 'Electrolytic capacitor, 1000 µF, 16 V or more',
    qty: 2,
    where: 'Both nodes',
    source: 'buy',
    role: 'Bulk reservoir on the 5 V rail: one at the ESP32-CAM’s 5 V pin, one where the supply splits to the two boards.',
    note: 'Teaching kits stop around 100 µF. Without this the camera resets when Wi-Fi and the sensor start together.',
    price: { tnd: 0.9, shop: TUNISMART, href: 'https://tuni-smart-innovation.com/search?q=condensateur+1000uf&type=product', seen: 'listing' },
  },

  // --- Borrow from the teaching lab ----------------------------------------
  {
    art: 'devkit',
    name: 'ESP32 DevKit V1 (WROOM-32), 30-pin',
    qty: 1,
    where: 'Node A',
    source: 'lab',
    role: 'Runs the scale: HX711, display, buttons, buzzer, and tells Node B when to shoot.',
    note: 'Read the metal shield before wiring. If it says WROVER, GPIO 16/17 are taken and the HX711 moves to 25/26.',
    fallback: { tnd: 28.5, shop: DIDACTICO, href: 'https://didactico.tn/produit/carte-developpement-esp-wroom-32/', seen: 'page' },
  },
  {
    art: 'push-button',
    name: 'Tactile push button, 6 × 6 mm',
    qty: 2,
    where: 'Node A',
    source: 'lab',
    role: 'Tare and capture.',
    note: 'No resistors: the ESP32’s internal pull-ups do the job.',
  },
  {
    art: 'buzzer',
    name: 'Passive buzzer',
    qty: 1,
    where: 'Node A',
    source: 'lab',
    role: 'A beep for tare, capture and errors.',
    note: 'The common kit module is a coil, so it goes through a transistor with a diode across it.',
  },
  {
    art: 'transistor',
    name: '2N2222 NPN transistor',
    qty: 2,
    where: 'Both nodes',
    source: 'lab',
    role: 'One switches the buzzer (Node A), one switches the lights (Node B).',
    note: 'A BC547 is fine for the buzzer but not the lights: it is rated 100 mA and six LEDs draw about 110 mA.',
  },
  {
    art: 'diode',
    name: '1N4148 signal diode',
    qty: 1,
    where: 'Node A',
    source: 'lab',
    role: 'Across the buzzer coil, to absorb the switch-off spike.',
    changed: 'Added.',
  },
  {
    art: 'led-white',
    name: 'White LED, 5 mm',
    qty: 6,
    where: 'Node B',
    source: 'lab',
    role: 'Even light over the plate, so the photo does not depend on the room.',
    note: 'Behind a sheet of tracing paper or frosted plastic, at an angle to the lens, so a glazed plate does not glare.',
    changed: 'Replaces the WS2812B ring and its level shifter.',
  },
  {
    art: 'resistor',
    name: 'Resistors, ¼ W',
    qty: 9,
    unit: '6 × 100 Ω, 1 × 470 Ω, 1 × 1 kΩ, 1 × 10 kΩ',
    where: 'Both nodes',
    source: 'lab',
    role: '100 Ω per LED; 470 Ω and 10 kΩ on the light transistor’s base; 1 kΩ on the buzzer’s.',
  },
  {
    art: 'cap-ceramic',
    name: 'Ceramic capacitor, 100 nF',
    qty: 4,
    where: 'Both nodes',
    source: 'lab',
    role: 'Decoupling, one at each board: DevKit, ESP32-CAM, HX711 and the light driver.',
  },
  {
    art: 'cap-electrolytic',
    name: 'Electrolytic capacitor, 10 µF',
    qty: 1,
    where: 'Node A',
    source: 'lab',
    role: 'Next to the HX711, with a 100 nF, to keep its supply quiet.',
    changed: 'Replaces the HX711’s dedicated buck converter.',
  },
  {
    art: 'shielded-cable',
    name: 'Shielded 4-core cable, ~30 cm',
    qty: 1,
    where: 'Node A',
    source: 'lab',
    role: 'Extends the load cell’s thin 4 wires to the HX711.',
    note: 'A cut-off old USB cable is exactly this: four cores and a braid. Ground the braid at the HX711 end only.',
    changed: 'Added.',
  },
  {
    art: 'breadboard',
    name: 'Breadboard and jumper wires',
    qty: 1,
    unit: '1 board, ~30 wires',
    where: 'Bench',
    source: 'lab',
    role: 'Prototype the signal wiring.',
    note: 'Signals only. The 5 V supply goes on short soldered leads: breadboard contacts alone can brown the camera out.',
  },
  {
    art: 'header-pins',
    name: 'Male header strip, 2.54 mm',
    qty: 1,
    unit: '1 strip of 40',
    where: 'Build',
    source: 'lab',
    role: 'For the HX711 and OLED if they arrive with loose pins.',
  },
  {
    art: 'screws',
    name: 'Screws, nuts and spacers',
    qty: 1,
    unit: '1 handful',
    where: 'Build',
    source: 'lab',
    role: 'Fix the load cell between base and platform with a gap on both sides.',
    note: 'Screw sizes depend on the cell; buy nothing until it is in hand.',
  },
  {
    art: 'microsd',
    name: 'microSD card, any size to 32 GB',
    qty: 1,
    where: 'Node B',
    source: 'lab',
    role: 'Holds a photo and its weight when the upload fails, until Wi-Fi returns.',
    note: 'Use a spare from a phone; formatted FAT32. The scale works without it, it just loses offline captures.',
  },
  {
    art: 'usb-cable',
    name: 'USB data cables',
    qty: 2,
    unit: 'one per board, matching its socket',
    where: 'Bench',
    source: 'lab',
    role: 'Flashing and serial logs.',
    note: 'Charge-only cables are the most common reason "the board isn’t detected". Check the DevKit’s socket: micro-USB or USB-C.',
  },

  // --- Bench and workshop: booked, not taken ---------------------------------
  {
    art: 'bench-psu',
    name: 'Bench DC power supply',
    qty: 1,
    where: 'Bench',
    source: 'bench',
    role: 'First power-up at 5.00 V with a 1 A current limit, so a wiring mistake costs nothing.',
  },
  {
    art: 'multimeter',
    name: 'Multimeter',
    qty: 1,
    where: 'Bench',
    source: 'bench',
    role: 'Check the 5 V rail under load, and the HX711’s excitation voltage across E+ and E−.',
  },
  {
    art: 'soldering-iron',
    name: 'Soldering station',
    qty: 1,
    where: 'Bench',
    source: 'bench',
    role: 'Headers, the LED board, the load-cell splice and the power leads.',
  },
  {
    art: 'weights',
    name: 'Calibration masses: 100, 200, 500 g',
    qty: 1,
    unit: '1 set',
    where: 'Bench',
    source: 'bench',
    role: 'Calibrate the scale and prove its accuracy.',
    note: 'Not sold by any Tunisian shop we found. Borrow a set from the physics or chemistry lab, with time on their balance.',
  },
  {
    art: 'printer-3d',
    name: 'FabLab: laser cutter or 3D printer',
    qty: 1,
    unit: '1 booking',
    where: 'Build',
    source: 'bench',
    role: 'Cut the base, platform and camera arm.',
  },
  {
    art: 'sheet-material',
    name: 'MDF, plywood or acrylic offcuts, 3–6 mm',
    qty: 1,
    unit: 'about A3',
    where: 'Build',
    source: 'bench',
    role: 'Base and platform. Workshop offcuts are big enough.',
  },
  {
    art: 'camera-arm',
    name: 'Camera arm',
    qty: 1,
    where: 'Build',
    source: 'bench',
    role: 'Holds the ESP32-CAM pointing straight down at the plate.',
    note: 'Aim for 300–350 mm from lens to table. At 250 mm an 18 cm plate barely fits the frame.',
  },
  {
    art: 'plate',
    name: 'Light plate, melamine or plastic, ~18 cm',
    qty: 1,
    where: 'Build',
    source: 'bench',
    role: 'The plate every meal is weighed on.',
    note: 'A ceramic plate can weigh 300–430 g, which eats into a 1 kg cell. Keep plate plus platform under 250 g.',
  },
  {
    art: 'laptop',
    name: 'Laptop',
    qty: 1,
    where: 'Bench',
    source: 'bench',
    role: 'Flashes both boards and runs the backend during the demo.',
  },
  {
    art: 'phone-hotspot',
    name: 'Phone, as Wi-Fi hotspot',
    qty: 1,
    where: 'Bench',
    source: 'bench',
    role: 'The network for the demo, and the app.',
    note: 'ESP-NOW only works when both boards share the Wi-Fi channel. If the hotspot changes channel, the scale goes quiet.',
  },

  // --- Alternatives: on the shelf, for when the plan above can't be followed ---
  {
    art: 'usb-ttl',
    name: 'FT232RL / CP2102 USB-to-TTL adapter',
    qty: 1,
    where: 'Node B',
    source: 'alt',
    role: 'Backup way to flash the ESP32-CAM if the MB base misbehaves.',
    note: 'Set the jumper to 3.3 V logic and feed the camera from 5 V separately.',
    price: { tnd: 10.5, shop: DIDACTICO, href: 'https://didactico.tn/produit/convertisseur-usb-uart-ft232rl/', seen: 'page' },
    optional: true,
  },
  {
    art: 'arduino-uno',
    name: 'Arduino Uno, as a serial bridge',
    qty: 1,
    where: 'Node B',
    source: 'alt',
    role: 'Last-resort programmer: hold the Uno in reset and use its USB chip.',
    note: 'Its TX is 5 V, so divide it down before the camera’s RX. Uploads often time out; use only if nothing else is available.',
    optional: true,
  },
  {
    art: 'led-ring',
    name: 'WS2812B ring, 16 LEDs',
    qty: 1,
    where: 'Node B',
    source: 'alt',
    role: 'Colour-controllable light, if you want it.',
    note: 'Needs a 74AHCT125 level shifter, which no Tunisian shop we checked stocks; the cheap BSS138 modules are too slow for it. Import the chip or keep the white LEDs.',
    price: { tnd: 11, shop: COTHINGS, href: 'https://cothings.net/products/ws2812-5050-anneau-rgb-16-led-avec-pilote', seen: 'page' },
    optional: true,
  },
  {
    art: 'lcd1602',
    name: '16 × 2 LCD with I²C backpack',
    qty: 1,
    where: 'Node A',
    source: 'alt',
    role: 'Stand-in display if no OLED can be found.',
    note: 'Saves 4.6 TND but needs 5 V, a level shifter on I²C, and loses graphics. Not worth it unless the lab hands you one.',
    optional: true,
  },
  {
    art: 'coins',
    name: 'Coins, as a transfer reference',
    qty: 1,
    unit: '1 stack',
    where: 'Bench',
    source: 'alt',
    role: 'Spot checks between calibrations.',
    note: 'Only after weighing the stack on a lab balance: old and new issues of the same coin circulate together and differ in mass.',
    optional: true,
  },
  {
    art: 'kitchen-scale',
    name: 'Kitchen scale',
    qty: 1,
    where: 'Bench',
    source: 'alt',
    role: 'A sanity check that the readings are in the right range.',
    note: 'Never a calibration reference, and not a source for the load cell: its cell is rated 5 kg or more.',
    optional: true,
  },
  {
    art: 'power-bank',
    name: 'Power bank',
    qty: 1,
    where: 'Both nodes',
    source: 'alt',
    role: 'Avoid.',
    note: 'Most switch themselves off when the draw stays low for a few seconds, which an idle scale does.',
    optional: true,
  },
];

/** Dinars spent on the required buy list, rounded to the millime. */
export function buyTotal(parts: Part[] = PARTS) {
  const sum = parts
    .filter((part) => part.source === 'buy' && !part.optional && part.price)
    .reduce((total, part) => total + part.qty * part.price!.tnd, 0);
  return Math.round(sum * 1000) / 1000;
}

/** Tunisian convention: three decimals, comma separator, "TND" after. */
export function formatTnd(value: number) {
  return `${value.toFixed(3).replace('.', ',')} TND`;
}
