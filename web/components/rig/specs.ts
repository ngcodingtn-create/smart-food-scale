// One dimension source for the 3D model, the drawings and the table. Millimetres.
// Supplier footprints are reference variants, not measurements of our hardware.
//
// Heights are measured up from the bench. The stack, bottom to top:
//   0–6 feet · 6–12 base plate · 12–42 fixed spacer · 42–54.7 load cell ·
//   54.7–66 riser · 66–70 platform · 70–82 plate (eating surface at 73).
export const DIM = {
  base: { width: 250, depth: 240, height: 32, bottom: 6 },
  plate: { diameter: 180, height: 12, bottom: 70, surface: 73, z: -15 },
  platform: { diameter: 130, height: 4, y: 68 },
  // 3 kg YZC-131 (decision D13). `bottom` is the top of the spacer its fixed end
  // is screwed to; `mount` is how far each mounting block sits from the centre.
  cell: { length: 75, width: 12.7, height: 12.7, bottom: 42, mount: 28 },
  devkit: { length: 51.5, width: 28.5, pcb: 1.6 },
  wroom: { length: 25.5, width: 18, height: 3.1 },
  hx711: { length: 30.48, width: 22.86, pcb: 1.6 },
  oled: { width: 29.2, length: 26.7, height: 6.2 },
  button: { width: 6, height: 4.3 },
  buzzer: { diameter: 11.9, height: 6.53 },
  camera: { length: 40.5, width: 27, height: 4.5, y: 405, lensBottom: 393 },
  // Six white 5 mm LEDs on a carrier around the lens, behind a diffuser (D12).
  light: { count: 6, led: 5, ledLength: 8.6, circle: 44, carrier: 62, diffuser: 70, y: 400 },
  arm: { section: 20, top: 420, postLength: 372, reach: 112 },
} as const;

/** Lens face to the plate's eating surface. */
export const CLEARANCE = DIM.camera.lensBottom - DIM.plate.surface;

/**
 * The OV2640's stock lens. Vendors quote 65–68° without saying which angle that
 * is; the drawings take the cautious reading, 66° across the DIAGONAL of the
 * 4:3 frame, which gives the smaller picture. Measure it when the camera arrives.
 */
export const LENS = { quotedDeg: 66, aspect: [4, 3] as const };

/** The frame's footprint on a plane `distance` mm from the lens: [long, short]. */
export function frameAt(distance: number): [number, number] {
  const halfDiagonal = distance * Math.tan(((LENS.quotedDeg / 2) * Math.PI) / 180);
  const [w, h] = LENS.aspect;
  const diagonal = Math.hypot(w, h);
  return [(2 * halfDiagonal * w) / diagonal, (2 * halfDiagonal * h) / diagonal];
}

export const PARTS = [
  { id: 'plate', name: 'Plate & platform', size: 'Ø180 × 12 mm plate · Ø130 platform', node: 'Measured mass',
    description: 'The plate rests on a platform that touches nothing but the load cell.',
    detail: 'Proposed sizes. Tare the empty plate, add the food, then capture.' },
  { id: 'cell', name: '3 kg load cell', size: '75 × 12.7 × 12.7 mm · seller listing', node: 'Node A',
    description: 'One end is screwed to the base, the other carries the platform. The thin middle bends.',
    detail: 'YZC-131. The size is from seller listings, not a datasheet: measure the bar that arrives.' },
  { id: 'devkit', name: 'ESP32 DevKit V1', size: '51.5 × 28.5 mm · estimated board', node: 'Node A',
    description: 'Reads the HX711, runs the display and buttons, sends the grams over ESP-NOW.',
    detail: 'Outline estimated around the documented WROOM-32 module. Check the board that arrives.' },
  { id: 'hx711', name: 'HX711 amplifier', size: '30.48 × 22.86 mm', node: 'Node A',
    description: 'Turns the load cell’s few millivolts into a 24-bit number. Powered from the DevKit’s 3V3 pin.',
    detail: 'SparkFun v1.1 footprint. Generic boards differ.' },
  { id: 'oled', name: 'OLED display', size: '29.2 × 26.7 × 6.2 mm', node: 'Node A',
    description: 'Shows the live mass. The reading drawn here is a sample, not a sensor.',
    detail: 'Adafruit #326 reference module.' },
  { id: 'buttons', name: 'The button', size: '6 × 6 × 4.3 mm', node: 'Node A',
    description: 'The only button: held 5 s it zeroes the empty plate (tare); a click starts a capture.',
    detail: 'Omron B3F-1000 reference switch; the cap is a design estimate. The one on the bench is 12 × 12 mm.' },
  { id: 'buzzer', name: 'Buzzer', size: 'Ø11.9 × 6.53 mm', node: 'Node A',
    description: 'A short beep for tare, capture and errors.',
    detail: 'Adafruit #160 reference. Driven through a transistor, with a diode across it.' },
  { id: 'camera', name: 'ESP32-CAM', size: '27 × 40.5 × 4.5 mm board', node: 'Node B',
    description: 'Looks straight down at the plate. Receives the grams, takes one JPEG, uploads both.',
    detail: 'AI-Thinker board dimensions. The lens barrel is an estimate; refocus it for this height.' },
  { id: 'light', name: 'Six white LEDs', size: '6 × Ø5 mm · Ø62 carrier · Ø70 diffuser', node: 'Node B',
    description: 'Plain white LEDs around the lens, behind a diffuser, switched by one transistor.',
    detail: 'The LEDs are standard 5 mm parts; the carrier and diffuser are a design proposal.' },
  { id: 'arm', name: 'Camera arm', size: '20 mm section · 420 mm overall', node: 'Structure',
    description: 'Stands on the base, not on the platform, so it never loads the scale.',
    detail: `Proposed geometry. The lens sits ${CLEARANCE} mm above the plate. Stiffness and framing need a bench test.` },
] as const;
export type PartId = typeof PARTS[number]['id'];

export const FOOTPRINTS = [
  { part: 'ESP32 DevKit V1 / WROOM-32', dimensions: 'PCB 51.5 × 28.5 × 1.6; module 25.5 × 18 × 3.1',
    confidence: 'Mixed', basis: 'Module: manufacturer dimensions. DevKit PCB: estimate from 30-pin / 2.54 mm layout, USB allowance and module footprint. Board clones vary.',
    source: 'Espressif WROOM-32, §9', href: 'https://www.espressif.com/sites/default/files/documentation/esp32-wroom-32_datasheet_en.pdf' },
  { part: 'HX711 breakout', dimensions: 'PCB 30.48 × 22.86; 1.6 thickness estimate', confidence: 'High footprint',
    basis: 'Derived from layer 20 board outline in SparkFun v1.1 Eagle CAD. Selected reference variant; not every HX711 board has this outline.',
    source: 'SparkFun v1.1 board CAD', href: 'https://github.com/sparkfun/HX711-Load-Cell-Amplifier/blob/V_1.1/hardware/SparkFun_HX711_Load_Cell.brd' },
  { part: 'YZC-131 load cell, 3 kg', dimensions: '75 × 12.7 × 12.7', confidence: 'Estimate',
    basis: 'Seller listings give 75 to 80 mm long with M4 threads. The shop page we buy from states no dimensions, and no datasheet was found. Measure the bar before drilling anything.',
    source: 'Didactico product page', href: 'https://didactico.tn/produit/capteur-de-pesage-3kg-yzc-131/' },
  { part: 'SSD1306 128 × 64 OLED', dimensions: '29.2 × 26.7 × 6.2', confidence: 'High reference',
    basis: 'Adafruit #326 PCB envelope; glass 26.6 × 19. Selected module variant. Header pins omitted from the envelope.',
    source: 'Adafruit #326 technical details', href: 'https://www.adafruit.com/product/326' },
  { part: 'Two tactile switches', dimensions: 'Each 6 × 6 × 4.3', confidence: 'High reference',
    basis: 'Omron B3F-1000 body and actuator height, excluding through-hole leads. Decorative caps Ø12 × 3 are estimates.',
    source: 'Omron B3F mechanical drawing', href: 'https://omronfs.omron.com/en_US/ecb/products/pdf/en-b3f.pdf' },
  { part: 'Passive piezo buzzer', dimensions: 'Ø11.9 × 6.53', confidence: 'High reference',
    basis: 'Adafruit #160 body dimensions; lead lengths are not modelled.',
    source: 'Adafruit #160 technical details', href: 'https://www.adafruit.com/product/160' },
  { part: 'AI-Thinker ESP32-CAM / OV2640', dimensions: 'Board 27 × 40.5 × 4.5 (±0.2); lens Ø8 × 10 estimate', confidence: 'Mixed',
    basis: 'AI-Thinker board specification, mirrored by Components101. Lens, sensor carrier and connector details are illustrative estimates.',
    source: 'AI-Thinker ESP32-CAM datasheet', href: 'https://components101.com/sites/default/files/component_datasheet/ESP32-CAM_datasheet.pdf' },
  { part: 'Six white LEDs, carrier and diffuser', dimensions: 'LEDs Ø5 × 8.6; carrier Ø62; diffuser Ø70', confidence: 'Estimate',
    basis: 'The LEDs are the standard 5 mm round package. The carrier, the 44 mm LED circle and the diffuser are proposed geometry, to be cut from perfboard and tracing paper or frosted acrylic.',
    source: 'Project design decision D12', href: '#assembly-assumptions' },
  { part: 'Plate & weighing platform', dimensions: 'Plate Ø180 × 12; platform Ø130 × 4', confidence: 'Estimate',
    basis: 'Proposed geometry, not a purchased part. Plate eating surface is 73 mm above the bench; rim is 82 mm. Only the load cell supports the platform.',
    source: 'Project design decision D10', href: '#assembly-assumptions' },
  { part: 'Base, arm & mounting hardware', dimensions: 'Base 250 × 240 × 32 on 6 mm feet; rig 420 high', confidence: 'Estimate',
    basis: `20 mm arm section; 372 mm upright; 112 mm horizontal member. Lens at 393 mm gives ${CLEARANCE} mm above the plate surface. Spacers, stop screw, brackets, cables, screw heads, component placement and finishes are design estimates.`,
    source: 'Project design decisions D10, D12, D13', href: '#assembly-assumptions' },
] as const;
