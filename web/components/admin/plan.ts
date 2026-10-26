/**
 * The build plan as data: what /admin/plan draws. The reasoning behind it is in
 * ai-docs/APP-PLAN.md and ai-docs/BUILD-PLAN.md; this file is the task list.
 *
 * `status` is written here for Claude's tasks, as the work lands. The owner's
 * tasks start as "todo" and are ticked on the page, in that browser only.
 *
 * The owner's list holds only what needs hands: plugging in, wiring, the phone,
 * the one password, the firewall prompt, the weights. Claude flashes, reads and
 * tests the boards from the laptop (firmware/tools/board.py).
 */

export type Who = 'you' | 'claude';
export type Status = 'todo' | 'doing' | 'done' | 'waiting';

export type Task = {
  id: string;
  title: string;
  /** How to tell it worked. */
  doneWhen?: string;
  /** Where to do it. */
  href?: string;
  status: Status;
  /** For "waiting": on what. */
  waitingOn?: string;
};

export type Day = {
  id: string;
  date: string;
  title: string;
  summary: string;
  you: Task[];
  claude: Task[];
};

export const PLAN_UPDATED = '26 October 2026';

export const GOAL =
  'One real meal, weighed on the load cell, photographed, named by Gemini and shown in the app under your account.';

const B = '/admin/build';

export const DAYS: Day[] = [
  {
    id: 'scale',
    date: 'now',
    title: 'The scale, whole',
    summary: 'The scale’s brain gets its beep, then the HX711 and the load cell replace the pretend weight. One button: a click is PHOTO, a 5-second hold is TARE.',
    you: [
      { id: 'y-port', title: 'Plug in the NodeMCU and say “plugged in”', doneWhen: 'Claude finds its CH340 port and flashes it', status: 'todo' },
      { id: 'y-wire-a', title: 'Wire the display, the button and the buzzer, each from its 3D step', doneWhen: 'The board finds the display, reads the button, and you hear the beep', href: `${B}/m1-scale-brain`, status: 'todo' },
      { id: 'y-try-a', title: 'Watch and listen while Claude runs the pretend meal', doneWhen: 'The display shows 150 g and the buzzer beeps', href: `${B}/m1-scale-brain/bench`, status: 'todo' },
      { id: 'y-hx-photo', title: 'Send photos of the HX711 and of the cell’s blue connector', doneWhen: 'Claude has read the HX711’s labels', href: `${B}/m2-real-weight/meet-hx711`, status: 'todo' },
      { id: 't-lab', title: 'If the HX711’s pins came loose: solder them at the lab; ask for calibration masses', doneWhen: 'Pins on both ends', href: `${B}/m2-real-weight/headers`, status: 'todo' },
      { id: 't-wire', title: 'Wire the HX711, then the load cell to it', doneWhen: 'Claude says it still boots', href: `${B}/m2-real-weight/hx711-wires`, status: 'todo' },
      { id: 'y-mount', title: 'Hold the cell still: fixed end clamped, a light cup on the free end', href: `${B}/m2-real-weight/bench-mount`, status: 'todo' },
      { id: 't-sign', title: 'Press the cell when Claude says (swap white and green if told)', href: `${B}/m2-real-weight/sign`, status: 'todo' },
      { id: 't-cal', title: 'Put in 3 to 5 known masses, one at a time, when Claude asks', href: `${B}/m2-real-weight/calibrate`, status: 'todo' },
      { id: 'y-by-hand', title: 'Hold the button 5 s, put a mass in, click', doneWhen: 'TARE OK, the right grams, then NO CAMERA', href: `${B}/m2-real-weight/by-hand`, status: 'todo' },
    ],
    claude: [
      { id: 'c-bench', title: 'Bench page: whole-meal test, pretend weight, any command', status: 'done' },
      { id: 'c-board-tool', title: 'board.py: find, flash, read and test the boards from the laptop', status: 'done' },
      { id: 'c-one-button', title: 'One button: click for PHOTO, hold 5 s for TARE, with a countdown', status: 'done' },
      { id: 'c-no-second', title: 'No second button: the FLASH button and D3 no longer take photos', status: 'done' },
      { id: 'c-sim-real', title: 'A pretend weight that lands like a real one: wobble, settle, a backwards cell', status: 'done' },
      { id: 'c-flash-boards', title: 'Flash the pretend scale and read its boot line', status: 'done' },
      { id: 'c-whole-a', title: 'Run the whole test on the pretend scale', status: 'todo' },
      { id: 't-c-flash', title: 'Flash the real scale and check the counts', status: 'todo' },
      { id: 't-c-cal', title: 'Calibrate from your masses and save it on the board', status: 'todo' },
    ],
  },
  {
    id: 'camera',
    date: 'next',
    title: 'The camera and the light',
    summary: 'The camera joins the phone’s hotspot, the light goes on, and the two boards weigh and photograph a real meal together. The laptop is the server.',
    you: [
      { id: 'y-hotspot', title: 'Phone hotspot on 2.4 GHz, laptop joins', doneWhen: 'Laptop online through the phone', href: `${B}/m3-camera/hotspot`, status: 'todo' },
      { id: 'y-backend', title: 'Click Allow when Windows asks about Python and the network', doneWhen: 'Claude reaches the server from the hotspot address', href: `${B}/m3-camera/backend`, status: 'todo' },
      { id: 'y-cam-plug', title: 'Seat the camera on its base and plug it in', doneWhen: 'Claude flashes it and reads E boot node=b … camera=1', href: `${B}/m3-camera/flash-camera`, status: 'todo' },
      { id: 'y-cam-wifi', title: 'Type the hotspot’s password once on the bench page', doneWhen: 'The bench page says Wi-Fi up', href: `${B}/m3-camera/wifi`, status: 'todo' },
      { id: 'y-light', title: 'Camera onto the breadboard, wire the light', doneWhen: '“Light on” lights all six LEDs', href: `${B}/m4-light`, status: 'todo' },
      { id: 'y-meal-test', title: 'A real weighing with both boards: hold to tare, food in, click', doneWhen: 'SAVED on the display', href: `${B}/m5-together`, status: 'todo' },
    ],
    claude: [
      { id: 'c-gemini', title: 'Gemini recogniser, tested against a fake Gemini', status: 'done' },
      { id: 'c-flash-camera', title: 'Flash the camera and read its boot line', status: 'todo' },
      { id: 'c-server-lan', title: 'Start the server where the camera can reach it, and check it', status: 'todo' },
      { id: 'c-tests', title: 'Run the tests on the boards: test photo, the whole-meal test', status: 'todo' },
    ],
  },
  {
    id: 'online',
    date: 'then',
    title: 'Online, and in the app',
    summary: 'The server goes online, the app runs on your phone, and the scale joins your account: its meals reach the app.',
    you: [
      { id: 't-pair', title: 'From the app: the scale’s Wi-Fi and pairing code', href: `${B}/m8-pairing`, status: 'todo' },
      { id: 't-meals', title: 'Three real meals: hold the button 5 s, food in, click', doneWhen: 'They appear in the app', status: 'todo' },
    ],
    claude: [
      { id: 'c-admin', title: 'This builder’s area, behind a password', status: 'done' },
      { id: 'c-companion', title: 'The build companion: milestones 0–9, steps with your photos and the wiring', status: 'done' },
      { id: 'c-server', title: 'Server v2: accounts, pairing, the “to name” inbox, photos, Postgres', status: 'todo' },
      { id: 'c-fake', title: 'The fake scale: sends meals as if it were your paired scale', status: 'todo' },
      { id: 'c-app', title: 'App v1 in Expo: all nine screens, French first', status: 'todo' },
      { id: 'c-deploy', title: 'Put the server online and point the app at it', status: 'waiting', waitingOn: 'your Supabase, Vercel and Gemini accounts' },
      { id: 'c-wifi', title: 'Camera: Wi-Fi setup page, 3 networks, pairing code, https', status: 'todo' },
    ],
  },
  {
    id: 'last',
    date: 'last',
    title: 'Finished, then the demo',
    summary: 'No laptop: its own power and the microSD card; the cell moves from the desk into the rig and is calibrated again there. Then the accuracy, measured, and the demo.',
    you: [
      { id: 't-sd', title: 'microSD: FAT32, into the camera', doneWhen: 'Claude tests it with the hotspot off, then on', href: `${B}/m9-finish/card`, status: 'todo' },
      { id: 'y-rig', title: 'Measure the load cell’s screw holes; find two boards and screws; build the rig', doneWhen: 'The cell in its mount, the camera above', href: `${B}/m9-finish/rig`, status: 'todo' },
      { id: 'y-recal', title: 'The known masses once more, in the rig', href: `${B}/m9-finish/recalibrate`, status: 'todo' },
    ],
    claude: [
      { id: 't-c-logs', title: 'Read the boards, fix what breaks in the firmware', status: 'todo' },
      { id: 't-c-polish', title: 'App polish from what you see on your phone', status: 'todo' },
      { id: 't-c-accuracy', title: 'Measure the accuracy and write it on the accuracy page', status: 'todo' },
    ],
  },
];

export type Account = { id: string; name: string; why: string; secret: string };

export const ACCOUNTS: Account[] = [
  { id: 'acc-supabase', name: 'Supabase', why: 'Database, sign-in and photos. Free: 50,000 users a month, 500 MB, 1 GB of photos. Pauses after a week unused.', secret: 'Service key into Vercel only' },
  { id: 'acc-vercel', name: 'Vercel, a second project', why: 'Same account as the site, root folder backend. Puts the server online.', secret: 'Secrets in its environment variables' },
  { id: 'acc-gemini', name: 'Gemini key', why: 'From Google AI Studio. Names the dish in each photo.', secret: 'Vercel and backend/.env, never in chat' },
  { id: 'acc-expo', name: 'Expo + Expo Go', why: 'An Expo account, and Expo Go on your phone to run the app while it is built.', secret: 'Nothing secret' },
];

export const DECISIONS: { question: string; leaning: string }[] = [
  { question: 'Keep meal photos in the app?', leaning: 'The plan assumes yes: 1 GB holds a very large number of meals.' },
  { question: 'Is the app for you only, or can anyone sign up?', leaning: 'Both work; it only changes whether sign-up is open.' },
];

export const LATER = [
  'History charts',
  'Notifications when a meal is saved (needs a custom app build)',
  'An installable Android app',
  'Google sign-in',
  'Arabic',
  'App icon and store page',
];
