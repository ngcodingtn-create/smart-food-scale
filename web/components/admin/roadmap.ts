/**
 * The build, end to end, as milestones and steps: what /admin/build draws.
 *
 * One source of truth, like wiring.ts and kit.ts. Steps name parts by their
 * kit.ts id and wires by their wiring.ts id, so a part's photo or a wire's
 * route is never typed twice. Hotspots are percentages of the owner's own
 * photo (public/workbench/kit/), measured on a grid on 25 October 2026.
 *
 * The owner does only what needs hands: plugging in, wiring, pressing, looking.
 * Claude does the rest from the laptop with firmware/tools/board.py and
 * PlatformIO: finding the port, flashing, reading the boot line, sending
 * commands, running the tests. Each step says which is which.
 *
 * Steps marked `draft` have their title and goal only: their detail comes from
 * the research of 25 October (ai-docs/research/2026-10-25-*.md) as the work
 * reaches them.
 */

export type Spot = { x: number; y: number; label: string; note?: string };

/** An owner photo with points on it. Points and `view` are percent of the whole photo. */
export type Photo = {
  file: string;
  alt: string;
  /** The photo's size in pixels, for its shape. */
  size: [number, number];
  /** The window that frames the part: x, y, width, height. */
  view?: [number, number, number, number];
  spots: Spot[];
};

export type Expected = {
  /** serial: lines the board prints. display: what the OLED shows. page: what a web page shows. */
  kind: 'serial' | 'display' | 'page';
  lines: string[];
  caption?: string;
};

export type Tool = { kind: 'flash'; manifest: string; label: string } | { kind: 'bench' };

const SIM: Tool = { kind: 'flash', manifest: '/workbench/firmware/node-a/sim.json', label: 'the pretend scale' };
const SCALE: Tool = { kind: 'flash', manifest: '/workbench/firmware/node-a/scale.json', label: 'the scale' };
const CAMERA: Tool = { kind: 'flash', manifest: '/workbench/firmware/node-b/camera.json', label: 'the camera' };
const BENCH: Tool = { kind: 'bench' };

export type Step = {
  id: string;
  title: string;
  goal: string;
  /** kit.ts ids, shown as chips with the owner's photo. */
  parts?: string[];
  /** wiring.ts ids lit in the drawing. */
  wires?: { node: 'a' | 'b'; ids: string[] };
  photo?: Photo;
  /** The parts, sorted into groups on the desk; shown instead of a flat `parts` list. */
  partGroups?: { title: string; ids: string[] }[];
  /** What the owner does: only what needs hands, eyes or ears. */
  actions?: string[];
  /** What Claude does from the laptop: flashing, reading the board, sending it commands, checking. */
  claude?: string[];
  expect?: Expected;
  checks?: string[];
  trouble?: { symptom: string; fix: string }[];
  /** A live tool shown in the step: a flash button for one image, or the bench. */
  tool?: Tool;
  /** Only the title and goal are written so far. */
  draft?: boolean;
};

export type Milestone = {
  id: string;
  number: number;
  title: string;
  goal: string;
  /** When it is planned. */
  when: string;
  /** Laid out on the desk before starting. */
  parts: string[];
  steps: Step[];
  doneWhen: string;
};

const NODEMCU_SPOTS: Spot[] = [
  { x: 47.6, y: 28.6, label: 'Micro-USB', note: 'Power and flashing, from the laptop. Use a cable that carries data.' },
  { x: 38.1, y: 31.1, label: 'FLASH button', note: 'Joined to D3: a second PHOTO button, already on the board.' },
  { x: 55.7, y: 31.4, label: 'RST button', note: 'Restarts the board. Nothing is lost.' },
  { x: 50.5, y: 37.1, label: 'CH340 chip', note: 'The USB chip. Windows names the board’s port after it.' },
  { x: 61.4, y: 35.4, label: 'VIN', note: '5 V from USB: the buzzer’s rail.' },
  { x: 32.9, y: 53.4, label: '3V and G', note: 'The 3.3 V rail and ground, for the display and, in milestone 9, the HX711.' },
  { x: 32.9, y: 47, label: 'D5 to D8', note: 'D5 the button · D6 and D7 the HX711 · D8 the buzzer.' },
  { x: 32.9, y: 58.6, label: 'D3', note: 'The board’s FLASH button. An optional second button, at the very end.' },
  { x: 32.9, y: 61.8, label: 'D1, D2', note: 'The display: D1 is SCL, D2 is SDA.' },
  { x: 50, y: 62.1, label: 'ESP8266', note: 'The brain, with Wi-Fi built in. It talks to the camera by radio (ESP-NOW).' },
];

const CAMERA_SPOTS: Spot[] = [
  { x: 46.2, y: 48.9, label: 'Camera', note: 'OV2640, 2 megapixels. It photographs the plate from above.' },
  { x: 56.2, y: 42.9, label: 'microSD slot', note: 'Under the camera. The card, in milestone 8, keeps photos when Wi-Fi is down.' },
  { x: 33.1, y: 44.6, label: '5V and GND', note: 'Power in.' },
  { x: 33.1, y: 47.9, label: 'IO12', note: 'Left empty: the board reads it at power-on.' },
  { x: 33.1, y: 50, label: 'IO13', note: 'Switches the six-LED light, through a transistor.' },
  { x: 61.1, y: 47.9, label: 'IO0', note: 'Held to ground to flash. The MB base does it for you.' },
  { x: 61.1, y: 55.5, label: 'U0R, U0T', note: 'The serial line to the laptop.' },
  { x: 61.9, y: 67.1, label: 'Flash LED', note: 'The board’s own small light, on IO4. Not ours: too harsh for food.' },
];

export const MILESTONES: Milestone[] = [
  {
    id: 'm0-know-the-parts',
    number: 0,
    title: 'Know the parts',
    goal: 'Name every part on the desk and say what it does, before anything is wired.',
    when: '25 Oct',
    parts: ['devkit', 'esp32-cam', 'esp32-cam-mb', 'oled', 'push-button', 'buzzer', 'transistor', 'diode', 'led-white', 'resistor', 'cap-10u', 'breadboard', 'usb-cable', 'load-cell'],
    doneWhen: 'Every part is on the desk, sorted, and each one has a name.',
    steps: [
      {
        id: 'lay-out',
        title: 'Lay everything out',
        goal: 'Three groups on the desk: the scale, the camera, the small parts.',
        parts: ['devkit', 'oled', 'push-button', 'buzzer', 'esp32-cam', 'esp32-cam-mb', 'led-white'],
        partGroups: [
          { title: 'The scale', ids: ['devkit', 'oled', 'push-button', 'buzzer', 'load-cell'] },
          { title: 'The camera', ids: ['esp32-cam', 'esp32-cam-mb', 'led-white'] },
          { title: 'Small parts', ids: ['transistor', 'diode', 'resistor', 'cap-10u', 'breadboard', 'usb-cable'] },
        ],
        actions: [
          'Clear the desk. Work on wood or a mat, not on metal: a board’s pins touching metal can short.',
          'Scale group: the NodeMCU, the display, the button, the buzzer module, the load cell.',
          'Camera group: the ESP32-CAM on its MB base, the six white LEDs.',
          'Small parts: the two transistors, the diode, the resistors in their strips, the capacitors, the jumpers.',
        ],
        checks: ['Three groups on the desk', 'Nothing metal under the boards'],
      },
      {
        id: 'nodemcu',
        title: 'The NodeMCU: the scale’s brain',
        goal: 'Find its USB socket, its two buttons, and the pins the scale uses.',
        parts: ['devkit'],
        photo: { file: 'devkit.jpg', alt: 'The NodeMCU board, USB socket at the top, two rows of pins down its sides', size: [1050, 1400], view: [27, 25, 41, 52], spots: NODEMCU_SPOTS },
        actions: ['Tap each numbered dot on the photo, then find the same thing on your board.', 'Read the pin names printed beside the pins: D1, D2 and so on.'],
        checks: ['I found the USB socket and both buttons', 'I can find D1, D2, D5 to D8, 3V, G and VIN'],
      },
      {
        id: 'camera',
        title: 'The ESP32-CAM and its base',
        goal: 'Know the camera board, and why it sits on its base.',
        parts: ['esp32-cam', 'esp32-cam-mb'],
        photo: { file: 'esp32-cam.jpg', alt: 'The ESP32-CAM board seen from the camera side, pins down both edges', size: [1050, 1400], view: [26, 38, 42, 41], spots: CAMERA_SPOTS },
        actions: [
          'The camera has no USB socket. Its MB base adds one, and holds IO0 to flash it.',
          'Look at how it sits on the base: you will lift it off once, later, to wire the light.',
        ],
        checks: ['I found IO13, 5V and GND', 'I know the base is only for USB'],
      },
      {
        id: 'display',
        title: 'The display',
        goal: 'Find its four pins and peel its film.',
        parts: ['oled'],
        photo: {
          file: 'oled.jpg',
          alt: 'The small display in its plastic box, four pins at the top, a printed film over the screen',
          size: [1050, 1400],
          view: [20, 37, 44, 34],
          spots: [
            { x: 43.3, y: 43.4, label: 'Four pins', note: 'VCC, GND, SCL, SDA, in that order on yours.' },
            { x: 41, y: 53.6, label: 'Protective film', note: 'Printed with “0.96 4P White IIC OLED 128x64”. Peel it off.' },
          ],
        },
        checks: ['I read VCC, GND, SCL, SDA on the pins', 'The film is off'],
      },
      {
        id: 'buzzer-transistor',
        title: 'Buzzer, transistor, diode',
        goal: 'Know which leg is which on the three small parts that make the beep.',
        parts: ['buzzer', 'transistor', 'diode'],
        photo: {
          file: 'buzzer.jpg',
          alt: 'The buzzer module, a round black buzzer on a small board with three pins marked minus and S',
          size: [1050, 1400],
          view: [30, 39, 32, 32],
          spots: [
            { x: 42.9, y: 62.1, label: '−', note: 'To the transistor’s collector.' },
            { x: 46, y: 62.1, label: 'Middle pin', note: 'Leave it empty.' },
            { x: 49.2, y: 62.1, label: 'S', note: 'The buzzer’s +, to the 5 V rail.' },
            { x: 46.7, y: 51.4, label: '+ mark', note: 'Moulded on the buzzer, on the S side.' },
          ],
        },
        actions: [
          'The transistor (2N2222A): flat face towards you, legs down. Left is the emitter (E), middle the base (B), right the collector (C).',
          'The diode: the black band is its cathode. It goes towards S.',
        ],
        checks: ['I can point to −, the middle pin and S', 'I know E, B, C on the transistor', 'I found the diode’s band'],
      },
      {
        id: 'breadboard',
        title: 'How the breadboard connects',
        goal: 'Know which holes are joined, so a wire lands where it should.',
        parts: ['breadboard'],
        photo: {
          file: 'breadboard.jpg',
          alt: 'The white breadboard, two long rails down each side and short rows of five holes in the middle',
          size: [1050, 1400],
          view: [32, 10, 44, 38],
          spots: [
            { x: 41.4, y: 32, label: '+ rail (red line)', note: 'The whole column is one conductor. Ours: 3.3 V on this side.' },
            { x: 39.2, y: 32, label: '− rail (blue line)', note: 'Ground. Every ground meets here.' },
            { x: 49.3, y: 15.7, label: 'A row of five', note: 'The five holes across are joined. The next row is a different conductor.' },
            { x: 54.1, y: 25, label: 'The centre gap', note: 'The two halves are not joined across it.' },
            { x: 68.5, y: 32, label: 'The other rails', note: 'Our 5 V rail and its ground.' },
          ],
        },
        actions: ['Some boards cut each rail in two halfway down. If your lines have a gap in the middle, bridge it with a short jumper.'],
        checks: ['I know the rails run top to bottom', 'I know a row of five is joined, and the gap is not'],
      },
    ],
  },
  {
    id: 'm1-scale-brain',
    number: 1,
    title: 'The scale’s brain',
    goal: 'The NodeMCU runs the pretend scale: the display shows a weight, TARE works, the buzzer beeps.',
    when: '25 Oct',
    parts: ['devkit', 'usb-cable', 'oled', 'push-button', 'buzzer', 'transistor', 'diode', 'resistor', 'breadboard'],
    doneWhen: 'With 150 g set from the laptop, the display shows 150.0 g; holding the button 5 s beeps and shows TARE OK.',
    steps: [
      {
        id: 'port',
        title: 'Plug it in, find the port',
        goal: 'The laptop sees the NodeMCU.',
        parts: ['devkit', 'usb-cable'],
        actions: ['Plug the NodeMCU into the laptop with a USB cable.', 'Tell Claude: “plugged in”.'],
        claude: [
          'Finds the board’s port (board.py ports) and tells you its name.',
          'No port: asks you to try the other cable, one may only charge. Still none: Windows needs the CH340 driver from WCH.',
        ],
        expect: { kind: 'page', lines: ['COM5\tCH340\tUSB-SERIAL CH340 (COM5)'], caption: 'What Claude sees. The number after COM can differ.' },
        checks: ['Claude found a CH340 port'],
      },
      {
        id: 'flash',
        title: 'Flash the pretend scale',
        goal: 'The NodeMCU runs our firmware, with a typed weight instead of the load cell.',
        parts: ['devkit'],
        actions: ['Nothing, unless Claude asks: then hold FLASH, press and let go of RST, let go of FLASH.'],
        claude: ['Flashes the pretend scale over USB (board.py flash node-a-nodemcu-sim).', 'Restarts the board and reads its boot line.'],
        expect: { kind: 'serial', lines: ['E boot node=a fw=0.3.0 calibrated=1 cpg=100.000000 simulated=1'], caption: 'The boot line Claude reads back.' },
        checks: ['Claude read the boot line'],
        trouble: [{ symptom: 'Flashing cannot connect', fix: 'Claude asks you to hold FLASH and tap RST, then tries again.' }],
        tool: SIM,
      },
      {
        id: 'rails',
        title: 'Power rails',
        goal: 'The breadboard has a 3.3 V rail, a 5 V rail and ground.',
        parts: ['breadboard'],
        wires: { node: 'a', ids: ['a-3v3', 'a-gnd', 'a-5v'] },
        actions: [
          'Unplug USB before wiring. Always.',
          'The NodeMCU stays off the breadboard: female–male jumpers from its pins.',
          'Make the three wires below. Keep the two + rails apart: one is 3.3 V, the other 5 V.',
          'Plug USB back in and tell Claude.',
        ],
        claude: ['Restarts the board and checks it still boots: a short circuit stops it.'],
        checks: ['3V to one + rail', 'G to the − rail', 'VIN to the other + rail', 'The two + rails are not joined', 'Claude says it still boots'],
      },
      {
        id: 'display',
        title: 'The display',
        goal: 'Four wires, and the display lights up with a weight.',
        parts: ['oled'],
        wires: { node: 'a', ids: ['a-oled-vcc', 'a-oled-gnd', 'a-oled-scl', 'a-oled-sda'] },
        actions: ['USB out. Wire in the order on your display: VCC, GND, SCL, SDA.', 'USB back in. Look at the display.'],
        claude: ['Restarts the board and reads its boot: no “E error no-display” means the board found the display.'],
        expect: { kind: 'display', lines: ['CAMERA ?', '0.0 g', 'READY'], caption: 'Top line, the weight, the state.' },
        checks: ['The display lights up', 'It shows 0.0 g'],
        trouble: [
          { symptom: 'Black display', fix: 'Check VCC and GND first, then SCL on D1 and SDA on D2. Swapped SCL and SDA is the usual cause.' },
          { symptom: 'Claude reads E error no-display', fix: 'Same: the board cannot hear it. Recheck the four wires.' },
        ],
      },
      {
        id: 'tare',
        title: 'The button',
        goal: 'One button does both: a click takes the photo, a 5-second hold zeroes the scale.',
        parts: ['push-button'],
        wires: { node: 'a', ids: ['a-tare', 'a-tare-gnd'] },
        actions: [
          'USB out. Put the button across the centre gap.',
          'One leg to D5; the leg diagonally opposite to ground.',
          'USB back in. When Claude says “now”, hold the button down: the display counts 5, 4, 3, 2, 1, then TARE OK.',
          'Then click it once, quickly: that is PHOTO. Nothing is on the scale, so it says NOTHING ON IT. That is right.',
        ],
        claude: ['Listens to the board: E tare for the hold; for the click, E capture then E error too-light.'],
        expect: { kind: 'display', lines: ['CAMERA ?', '0.0 g', 'HOLD: TARE IN 3 s'], caption: 'While you hold it. Let go before 0 and nothing happens.' },
        checks: ['Holding it 5 s shows TARE OK', 'A quick click shows NOTHING ON IT'],
        trouble: [{ symptom: 'Nothing happens', fix: 'Turn the button a quarter turn: the two legs you used may be always joined.' }],
      },
      {
        id: 'buzzer',
        title: 'The buzzer and its transistor',
        goal: 'A beep when the scale tares.',
        parts: ['buzzer', 'transistor', 'diode', 'resistor'],
        wires: { node: 'a', ids: ['a-buz-base', 'a-buz-emitter', 'a-buz-collector', 'a-buz-supply', 'a-buz-diode'] },
        actions: [
          'Transistor: flat face towards you. Left leg (E) to ground.',
          'Middle leg (B), through the 1 kΩ resistor, to D8.',
          'Right leg (C) to the buzzer’s −. The buzzer’s S to the 5 V rail. Its middle pin empty.',
          'The diode across − and S, its band towards S.',
          'USB back in, then listen.',
        ],
        claude: ['Sends the board “tare”: you should hear a short beep.'],
        checks: ['A short beep when Claude sends tare'],
        trouble: [
          { symptom: 'No beep', fix: 'Turn the transistor round: a few makers swap its outer legs.' },
          { symptom: 'The board will not start', fix: 'D8 must be low at power-on: check D8 goes only to the resistor.' },
        ],
      },
      {
        id: 'bench',
        title: 'The whole test, from the laptop',
        goal: 'The whole front panel, with a pretend weight Claude sets.',
        actions: ['Watch the display and listen while Claude runs it.'],
        claude: ['Runs the whole test from the laptop (board.py meal-test --no-camera): a 420 g plate, tare, 150 g of food, a photo.', 'Reads every line the board prints and tells you what passed.'],
        expect: { kind: 'display', lines: ['CAMERA ?', '150.0 g', 'NO CAMERA'], caption: 'NO CAMERA is right: there is no camera yet.' },
        checks: ['The display showed 150.0 g', 'The tare zeroed the plate', 'The photo gave a long low beep and NO CAMERA'],
        tool: BENCH,
      },
    ],
  },
  {
    id: 'm2-camera',
    number: 2,
    title: 'The camera online',
    goal: 'The camera joins the phone’s hotspot and sends a test photo to the laptop’s server.',
    when: '25 Oct',
    parts: ['esp32-cam', 'esp32-cam-mb', 'usb-cable'],
    doneWhen: 'A test photo with 150 g appears as a meal in the backend.',
    steps: [
      { id: 'flash-camera', title: 'Flash the camera on its base', goal: 'The camera runs our firmware.', actions: ['Seat the camera on its MB base, plug the base in, tell Claude.'], claude: ['Flashes the camera over USB (board.py flash node-b-camera) and reads its boot line.'], tool: CAMERA, expect: { kind: 'serial', lines: ['E boot node=b fw=0.1.0 psram=1 camera=1 card=0', 'E wifi not-set'] }, checks: ['camera=1 in the boot line'] },
      { id: 'hotspot', title: 'Phone hotspot on 2.4 GHz', goal: 'A network the camera can see, with the laptop on it.', actions: ['Turn on the phone’s hotspot, 2.4 GHz (on an iPhone: Maximise compatibility).', 'Join it with the laptop.'], claude: ['Checks the laptop is on it and finds the laptop’s address.'], checks: ['Hotspot on, 2.4 GHz', 'Laptop joined'] },
      { id: 'backend', title: 'The server on the laptop, reachable', goal: 'The camera can reach the laptop’s server.', actions: ['When Windows asks whether Python may use the network, click Allow (private networks).'], claude: ['Starts the server in a Terminal tab where the camera can reach it.', 'Checks it answers from the hotspot’s address.'], checks: ['http://<laptop>:8000/docs opens on the phone'], draft: true },
      { id: 'wifi', title: 'Wi-Fi and server address on the camera', goal: 'The camera says Wi-Fi up.', actions: ['When Claude says: below, press Connect a board and pick the camera’s port.', 'Type the hotspot’s name and password, paste the server address Claude gives you, press Save and connect. Only you type the password.', 'At Wi-Fi up, press Disconnect, so Claude can use the board again.'], claude: ['Gives you the server’s address to paste.', 'Then reads the camera and checks it says Wi-Fi up.'], tool: BENCH, expect: { kind: 'serial', lines: ['E wifi up ch=6 ip=192.168.x.y'], caption: 'The channel and address are the hotspot’s.' }, checks: ['Wi-Fi up'] },
      { id: 'test-photo', title: 'A test photo', goal: 'A meal in the backend.', actions: ['Point the camera at something.'], claude: ['Asks the camera for a test photo with 150 g and checks the meal arrived in the server.'], tool: BENCH, expect: { kind: 'serial', lines: ['E photo bytes=… ms=…', 'E upload g=150.0 status=201 outcome=saved'] }, checks: ['outcome=saved'] },
    ],
  },
  {
    id: 'm3-light',
    number: 3,
    title: 'The light',
    goal: 'Six white LEDs light the plate when the camera shoots.',
    when: '25 Oct',
    parts: ['esp32-cam', 'esp32-cam-mb', 'led-white', 'transistor', 'resistor', 'breadboard'],
    doneWhen: '“light on”, sent from the laptop, lights all six LEDs.',
    steps: [
      { id: 'off-the-base', title: 'The camera onto the breadboard', goal: 'Reach IO13, keep USB through the base.', draft: true },
      { id: 'light-wires', title: 'The light’s transistor and LEDs', goal: 'IO13 switches six LEDs.', wires: { node: 'b', ids: ['b-light-base', 'b-light-pulldown', 'b-light-emitter', 'b-light-leds', 'b-light-collector'] }, draft: true },
      { id: 'light-on', title: 'Light on', goal: 'All six light.', actions: ['Look at the LEDs.'], claude: ['Sends the camera “light on”, then “light off”.'], tool: BENCH, draft: true },
    ],
  },
  {
    id: 'm4-together',
    number: 4,
    title: 'Both boards together',
    goal: 'The scale tells the camera to shoot; the meal is saved; the scale says SAVED.',
    when: '25 Oct',
    parts: ['devkit', 'esp32-cam'],
    doneWhen: 'The whole-meal test ticks all six steps.',
    steps: [
      { id: 'find', title: 'The scale finds the camera', goal: 'CAMERA ch N on the display.', actions: ['Both boards plugged in, the camera on Wi-Fi.'], claude: ['Sends the scale “find” and waits for E link found.'], draft: true },
      { id: 'meal-test', title: 'The whole-meal test', goal: 'Six checks, from the scale to the server.', actions: ['Watch the display.'], claude: ['Runs the whole-meal test from the laptop (board.py meal-test) and reads every line.'], tool: BENCH, draft: true },
      { id: 'rehearse', title: 'Rehearse the real weight on the pretend one', goal: 'The last milestone’s sign check and calibration, played through today.', actions: ['Nothing: watch the display.', 'Optional, on Simulate it: the real scale’s code runs against a virtual HX711 with a weight slider.'], claude: ['Plays a cell wired backwards (sim sign -1), checks the counts fall, then sets it right.', 'Clears the calibration, puts pretend masses on, works out the counts per gram (board.py counts) and sets it. The pretend scale never saves it.'], checks: ['With the sign reversed, the counts fell', 'The rehearsed calibration read the pretend masses within a gram'], tool: SIM },
    ],
  },
  {
    id: 'm5-server',
    number: 5,
    title: 'The server online',
    goal: 'Our server runs on Vercel with accounts, the database and photos on Supabase, Gemini naming dishes.',
    when: 'after M4',
    parts: [],
    doneWhen: 'A meal from the fake scale is saved online under your account.',
    steps: [
      { id: 'accounts', title: 'The four accounts', goal: 'Supabase, Vercel, Gemini, Expo.', draft: true },
      { id: 'server-v2', title: 'Server version 2', goal: 'Accounts, pairing, the to-name inbox, photos.', draft: true },
      { id: 'deploy', title: 'Deploy', goal: 'An https address.', draft: true },
      { id: 'fake-scale', title: 'The fake scale', goal: 'Meals without hardware.', draft: true },
    ],
  },
  {
    id: 'm6-app',
    number: 6,
    title: 'The app',
    goal: 'The app on your phone: sign in, today’s meals, naming a dish, your scale.',
    when: 'after M5',
    parts: [],
    doneWhen: 'You sign in on your phone and see the fake scale’s meal.',
    steps: [
      { id: 'expo-go', title: 'Expo Go on your phone', goal: 'The app runs on your phone.', draft: true },
      { id: 'sign-in', title: 'Sign in', goal: 'An account.', draft: true },
      { id: 'today', title: 'Aujourd’hui', goal: 'The day at a glance.', draft: true },
      { id: 'to-name', title: 'À nommer', goal: 'Naming a dish Gemini could not.', draft: true },
    ],
  },
  {
    id: 'm7-pairing',
    number: 7,
    title: 'The scale joins your account',
    goal: 'The camera’s Wi-Fi setup page and a pairing code link the scale to you; its meals reach the app.',
    when: 'after M6',
    parts: ['esp32-cam', 'devkit'],
    doneWhen: 'A meal from the scale appears in your app (the pretend weight until milestone 9).',
    steps: [
      { id: 'portal', title: 'The camera’s setup Wi-Fi', goal: 'Balance-Setup on your phone.', draft: true },
      { id: 'pair', title: 'The pairing code', goal: 'Balance connectée.', draft: true },
      { id: 'real-meal', title: 'A meal from the scale in the app', goal: 'Pretend-weighed, photographed, named.', draft: true },
    ],
  },
  {
    id: 'm8-finish',
    number: 8,
    title: 'Finished scale',
    goal: 'No laptop: its own power, the microSD card, the rig built.',
    when: 'after M7',
    parts: ['microsd', 'charger', 'cap-1000u'],
    doneWhen: 'It runs on a table with only a phone charger, still on the pretend weight.',
    steps: [
      { id: 'card', title: 'The microSD card', goal: 'Photos kept when Wi-Fi is down.', draft: true },
      { id: 'power', title: 'Power without the laptop', goal: 'A 5 V 2 A charger and the 1000 µF capacitors.', wires: { node: 'b', ids: ['b-5v', 'b-gnd', 'b-bulk', 'b-split'] }, draft: true },
      { id: 'rig', title: 'The rig', goal: 'The plate, the arm, the camera above; the cell goes in at milestone 9.', draft: true },
    ],
  },
  {
    id: 'm9-real-weight',
    number: 9,
    title: 'Real weight',
    goal: 'Last: the HX711 and the load cell replace the pretend weight, mounted and calibrated. Then the demo.',
    when: 'last, with the HX711',
    parts: ['hx711', 'load-cell', 'cap-10u', 'push-button'],
    doneWhen: 'A known mass reads within a gram or two, and one real meal goes from the plate to the app.',
    steps: [
      { id: 'headers', title: 'Solder the HX711’s pins', goal: 'The HX711 plugs into the breadboard.', draft: true },
      { id: 'hx711-wires', title: 'Wire the HX711', goal: 'Four wires to the NodeMCU.', wires: { node: 'a', ids: ['a-hx-vcc', 'a-hx-gnd', 'a-hx-dt', 'a-hx-sck', 'a-hx-caps'] }, draft: true },
      { id: 'cell-wires', title: 'The load cell’s four wires', goal: 'Red, black, white, green to the HX711.', wires: { node: 'a', ids: ['a-cell-red', 'a-cell-black', 'a-cell-white', 'a-cell-green'] }, draft: true },
      { id: 'photo-button', title: 'One button or two', goal: 'With the HX711 in: keep the one button, or give PHOTO its own on D3 and leave tare on the 5-second hold.', actions: ['Say which you prefer. Two: USB out, one leg to D3, the diagonal leg to ground.'], claude: ['Nothing to flash: a button on D3 already takes the photo. Listens for E capture when you press it.'], parts: ['push-button'], wires: { node: 'a', ids: ['a-capture', 'a-capture-gnd'] }, draft: true },
      { id: 'flash-real', title: 'Flash the real scale', goal: 'Raw counts on the display.', actions: ['Plug the NodeMCU back in.'], claude: ['Flashes the real image (board.py flash node-a-nodemcu) and reads the counts.'], tool: SCALE, draft: true },
      { id: 'sign', title: 'Check the sign', goal: 'Pressing the cell makes the counts rise.', actions: ['Press the free end of the cell gently when Claude says “now”.', 'If Claude says they fall: USB out, swap white and green.'], claude: ['Watches the raw counts and says whether they rise.'], draft: true },
      { id: 'mount', title: 'Mount the cell', goal: 'Fixed at one end, free at the other.', draft: true },
      { id: 'calibrate', title: 'Calibrate', goal: 'Grams, from known masses.', actions: ['Empty plate. Then put on each known mass when Claude asks, and say its weight.'], claude: ['Tares, reads the steady counts for each mass (board.py counts --grams), works out the counts per gram and saves it (cal).', 'Checks every mass again and reports the error in grams.'], tool: BENCH, draft: true },
      { id: 'accuracy', title: 'Measure the accuracy', goal: 'Real numbers on the accuracy page.', draft: true },
      { id: 'demo', title: 'The demo', goal: 'One meal, start to finish, in front of people.', draft: true },
    ],
  },
];

export const milestoneById = (id: string) => MILESTONES.find((milestone) => milestone.id === id);
