/**
 * The build plan as data: what /admin/plan draws. The reasoning behind it is in
 * ai-docs/APP-PLAN.md and ai-docs/BUILD-PLAN.md; this file is the task list.
 *
 * `status` is written here for Claude's tasks, as the work lands. The owner's
 * tasks start as "todo" and are ticked on the page, in that browser only.
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
      { id: 'y-port', title: 'Plug in the NodeMCU', doneWhen: 'A new port (CH340) shows on Flash it', href: '/workbench/flash', status: 'todo' },
      { id: 'y-flash-sim', title: 'Flash “The pretend scale”', doneWhen: 'It prints E boot node=a … simulated=1', href: '/workbench/flash', status: 'todo' },
      { id: 'y-wire-a', title: 'Wire the display, tare button and buzzer', doneWhen: 'Ticks on Wire it; female–male jumpers from the NodeMCU', href: '/workbench/wire', status: 'todo' },
      { id: 'y-try-a', title: 'Set 150 g, press TARE, press FLASH', doneWhen: 'The display shows the weight and the buzzer beeps', href: '/workbench/bench', status: 'todo' },
      { id: 'y-hotspot', title: 'Phone hotspot on 2.4 GHz, laptop joins', doneWhen: 'Laptop online through the phone', status: 'todo' },
      { id: 'y-backend', title: 'Backend on the network (backend-lan), firewall allowed', doneWhen: 'http://<laptop>:8000/docs opens on the phone', status: 'todo' },
      { id: 'y-flash-cam', title: 'Flash “The camera” on its base', doneWhen: 'It prints E boot node=b … camera=1', href: '/workbench/flash', status: 'todo' },
      { id: 'y-cam-wifi', title: 'Hotspot and backend address on the camera', doneWhen: 'The bench page says Wi-Fi up', href: '/workbench/bench', status: 'todo' },
      { id: 'y-photo', title: 'Test photo with 150 g', doneWhen: 'The meal appears in the backend', href: '/workbench/bench', status: 'todo' },
      { id: 'y-light', title: 'Camera onto the breadboard, wire the light', doneWhen: '“Light on” lights all six LEDs', href: '/workbench/wire', status: 'todo' },
      { id: 'y-meal-test', title: 'Run the whole-meal test', doneWhen: 'All six steps ticked', href: '/workbench/bench', status: 'todo' },
      { id: 'y-rig', title: 'Measure the load cell’s screw holes; find two boards and screws', doneWhen: 'Screws in hand', status: 'todo' },
    ],
    claude: [
      { id: 'c-bench', title: 'Bench page: whole-meal test, pretend weight, any command', status: 'done' },
      { id: 'c-gemini', title: 'Gemini recogniser, tested against a fake Gemini', status: 'done' },
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
    id: 'tomorrow',
    date: '26 Oct',
    title: 'Tomorrow',
    summary: 'The HX711, the second button and the microSD card. Then the scale joins your account and real meals reach the app.',
    you: [
      { id: 't-lab', title: 'At the lab: solder the HX711’s pins, check the transistor and buzzer, ask for calibration weights', status: 'todo' },
      { id: 't-wire', title: 'Wire the HX711 (8 wires) and the second button on D3', href: '/workbench/wire', status: 'todo' },
      { id: 't-flash', title: 'Flash “The scale”, the real image, and accept the erase', href: '/workbench/flash', status: 'todo' },
      { id: 't-sign', title: 'Press the cell: the numbers rise (else swap white and green); mount it', status: 'todo' },
      { id: 't-cal', title: 'Calibrate: TARE empty, then 3 to 5 known weights, Save', href: '/workbench/bench', status: 'todo' },
      { id: 't-sd', title: 'microSD: FAT32, into the camera; test with the hotspot off, then on', status: 'todo' },
      { id: 't-pair', title: 'From the app: the scale’s Wi-Fi and pairing code', status: 'todo' },
      { id: 't-meals', title: 'Three real meals: plate, TARE, food, PHOTO', doneWhen: 'They appear in the app', status: 'todo' },
    ],
    claude: [
      { id: 't-c-logs', title: 'Read your logs, fix what breaks in the firmware', status: 'todo' },
      { id: 't-c-polish', title: 'App polish from what you see on your phone', status: 'todo' },
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
