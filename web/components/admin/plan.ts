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

export const PLAN_UPDATED = '25 October 2026';

export const GOAL =
  'One real meal, weighed on the load cell, photographed, named by Gemini and shown in the app under your account.';

export const DAYS: Day[] = [
  {
    id: 'today',
    date: '25 Oct',
    title: 'Today',
    summary: 'Everything except the real weight. The scale runs the pretend-scale image; the laptop is the server.',
    you: [
      { id: 'y-port', title: 'Plug in the NodeMCU and say “plugged in”', doneWhen: 'Claude finds its CH340 port and flashes it', status: 'todo' },
      { id: 'y-wire-a', title: 'Wire the display, the button and the buzzer', doneWhen: 'Ticks on the step pages; Claude says it still boots', href: '/admin/build/m1-scale-brain', status: 'todo' },
      { id: 'y-try-a', title: 'Watch and listen while Claude runs the pretend meal', doneWhen: 'The display shows 150 g and the buzzer beeps', status: 'todo' },
      { id: 'y-hotspot', title: 'Phone hotspot on 2.4 GHz, laptop joins', doneWhen: 'Laptop online through the phone', status: 'todo' },
      { id: 'y-backend', title: 'Click Allow when Windows asks about Python and the network', doneWhen: 'Claude reaches the server from the hotspot address', status: 'todo' },
      { id: 'y-cam-plug', title: 'Seat the camera on its base and plug it in', doneWhen: 'Claude flashes it and reads E boot node=b … camera=1', status: 'todo' },
      { id: 'y-cam-wifi', title: 'Type the hotspot’s password once on the bench page', doneWhen: 'The bench page says Wi-Fi up', href: '/workbench/bench', status: 'todo' },
      { id: 'y-light', title: 'Camera onto the breadboard, wire the light', doneWhen: '“Light on” lights all six LEDs', href: '/workbench/wire', status: 'todo' },
      { id: 'y-rig', title: 'Measure the load cell’s screw holes; find two boards and screws', doneWhen: 'Screws in hand', status: 'todo' },
    ],
    claude: [
      { id: 'c-bench', title: 'Bench page: whole-meal test, pretend weight, any command', status: 'done' },
      { id: 'c-gemini', title: 'Gemini recogniser, tested against a fake Gemini', status: 'done' },
      { id: 'c-admin', title: 'This builder’s area, behind a password', status: 'done' },
      { id: 'c-companion', title: 'The build companion: milestones 0–9, steps with your photos and the wiring', status: 'done' },
      { id: 'c-board-tool', title: 'board.py: find, flash, read and test the boards from the laptop', status: 'done' },
      { id: 'c-flash-boards', title: 'Flash the pretend scale and the camera; read their boot lines', status: 'todo' },
      { id: 'c-server-lan', title: 'Start the server where the camera can reach it, and check it', status: 'todo' },
      { id: 'c-tests', title: 'Run the tests on the boards: pretend meal, test photo, the whole-meal test', status: 'todo' },
      { id: 'c-rehearse', title: 'Rehearse the real weight on the pretend one: the sign check and a calibration', status: 'todo' },
      { id: 'c-one-button', title: 'One button: click for PHOTO, hold 5 s for TARE, with a countdown', status: 'done' },
      { id: 'c-sim-real', title: 'A pretend weight that lands like a real one: wobble, settle, a backwards cell', status: 'done' },
      { id: 'c-server', title: 'Server v2: accounts, pairing, the “to name” inbox, photos, Postgres', status: 'todo' },
      { id: 'c-fake', title: 'The fake scale: sends meals as if it were your paired scale', status: 'todo' },
      { id: 'c-app', title: 'App v1 in Expo: all nine screens, French first', status: 'todo' },
      { id: 'c-deploy', title: 'Put the server online and point the app at it', status: 'waiting', waitingOn: 'your Supabase, Vercel and Gemini accounts' },
      { id: 'c-wifi', title: 'Camera: Wi-Fi setup page, 3 networks, pairing code, https', status: 'todo' },
    ],
  },
  {
    id: 'tomorrow',
    date: '26 Oct',
    title: 'Tomorrow',
    summary: 'The microSD card goes in; the scale joins your account and meals reach the app, still on the pretend weight and the one button. The HX711 and the second button stay in the bag: they are the last thing.',
    you: [
      { id: 't-lab', title: 'At the lab: solder the HX711’s pins, check the transistor and buzzer, ask for calibration weights', status: 'todo' },
      { id: 't-sd', title: 'microSD: FAT32, into the camera', doneWhen: 'Claude tests it with the hotspot off, then on', status: 'todo' },
      { id: 't-pair', title: 'From the app: the scale’s Wi-Fi and pairing code', status: 'todo' },
      { id: 't-pretend-meals', title: 'Three pretend meals from the scale', doneWhen: 'They appear in the app', status: 'todo' },
    ],
    claude: [
      { id: 't-c-logs', title: 'Read the boards, fix what breaks in the firmware', status: 'todo' },
      { id: 't-c-polish', title: 'App polish from what you see on your phone', status: 'todo' },
    ],
  },
  {
    id: 'last',
    date: 'once everything else works',
    title: 'Last: the real weight',
    summary: 'Everything else works first. Then the HX711 and the load cell replace the pretend weight, and real meals go from the plate to the app.',
    you: [
      { id: 't-wire', title: 'Wire the HX711 (8 wires)', href: '/admin/build/m9-real-weight', status: 'todo' },
      { id: 't-button', title: 'One button or two: keep the hold-to-tare, or wire PHOTO its own button on D3', href: '/admin/build/m9-real-weight/photo-button', status: 'todo' },
      { id: 't-flash', title: 'Plug the NodeMCU back in: Claude flashes “The scale”, the real image', status: 'todo' },
      { id: 't-sign', title: 'Press the cell when Claude says (swap white and green if told); mount it', status: 'todo' },
      { id: 't-cal', title: 'Put on 3 to 5 known weights, one at a time, when Claude asks', status: 'todo' },
      { id: 't-meals', title: 'Three real meals: plate, hold the button 5 s, food, click', doneWhen: 'They appear in the app', status: 'todo' },
    ],
    claude: [
      { id: 't-c-flash', title: 'Flash the real scale and check the counts', status: 'todo' },
      { id: 't-c-cal', title: 'Calibrate from your weights and save it on the board', status: 'todo' },
      { id: 't-c-accuracy', title: 'Measure the accuracy and write it down', status: 'todo' },
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
