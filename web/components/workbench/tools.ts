/**
 * Every outside tool the build leans on, with what it is for and where it stops.
 *
 * Read on 2026-10-13. `checked` says how each line was established:
 *   ran     it was run in a browser on this site's own address that day
 *   read    read on the tool's own page or repository that day
 *   memory  not checked that day
 * The full notes are in ai-docs/research/2026-10-13-web-tools-for-the-build.md.
 */

export type Tool = {
  name: string;
  href: string;
  /** What it does for this project. */
  does: string;
  /** Its edge: a free-tier limit, or what it cannot do. */
  limit: string;
  /** Whether it can run inside one of our pages, or only be linked. */
  frame: boolean;
  checked: 'ran' | 'read' | 'memory';
};

export type Shelf = { title: string; tools: Tool[] };

export const SHELVES: Shelf[] = [
  {
    title: 'Simulate',
    tools: [
      {
        name: 'Wokwi',
        href: 'https://wokwi.com',
        does: 'Runs real ESP32 firmware against a simulated HX711, display, buttons and buzzer. The load cell has a weight slider.',
        limit: 'No ESP32-CAM, and no link between two boards. Its load cell steps in about 2.4 g, so it proves logic, not accuracy. Free projects are public.',
        frame: true,
        checked: 'ran',
      },
      {
        name: 'Falstad CircuitJS',
        href: 'https://www.falstad.com/circuit/',
        does: 'Analogue circuit simulator. Shows the currents in the light and buzzer circuits.',
        limit: 'Ideal parts. It is as right as the values you give it.',
        frame: true,
        checked: 'ran',
      },
    ],
  },
  {
    title: 'Wire and draw',
    tools: [
      {
        name: 'wokwi-elements',
        href: 'https://github.com/wokwi/wokwi-elements',
        does: 'Open-source drawings of common parts. Its DevKit definition is what our pin order was checked against.',
        limit: 'No ESP32-CAM and no transistor among its parts.',
        frame: true,
        checked: 'read',
      },
      {
        name: 'Lopaka',
        href: 'https://lopaka.app/',
        does: 'Draw the OLED’s 128 × 64 screens and export the code for them.',
        limit: 'Has paid plans; where the free one stops was not read.',
        frame: true,
        checked: 'ran',
      },
      {
        name: 'Cirkit Designer',
        href: 'https://www.cirkitdesigner.com/',
        does: 'Drag-and-drop wiring diagrams. Its library has the HX711 and the ESP32-CAM.',
        limit: 'Its simulator covers the ESP32-S3 only. Pricing not confirmed.',
        frame: false,
        checked: 'read',
      },
    ],
  },
  {
    title: 'Build and flash',
    tools: [
      {
        name: 'GitHub Actions',
        href: 'https://docs.github.com/en/actions',
        does: 'Compiles the firmware in the cloud on every push.',
        limit: 'Free for a public repository, which this one is.',
        frame: false,
        checked: 'read',
      },
      {
        name: 'ESP Web Tools',
        href: 'https://esphome.github.io/esp-web-tools/',
        does: 'An install button on our own page that writes firmware to a board over USB.',
        limit: 'Chrome, Edge or Firefox on a computer. Not tried with our boards: there are none yet.',
        frame: true,
        checked: 'read',
      },
      {
        name: 'Web Serial',
        href: 'https://caniuse.com/web-serial',
        does: 'Lets a page read what a board prints: the live weight, the calibration readings.',
        limit: 'Never on an iPhone or in Safari.',
        frame: true,
        checked: 'read',
      },
    ],
  },
  {
    title: 'Backend and app',
    tools: [
      {
        name: 'Google AI Studio',
        href: 'https://aistudio.google.com/',
        does: 'Try the dish prompt on real photos before writing code, and make the API key.',
        limit: 'The free tier’s daily count is not published. Photos sent on it may be read by Google.',
        frame: false,
        checked: 'read',
      },
      {
        name: 'Hoppscotch',
        href: 'https://hoppscotch.io/',
        does: 'Send a photo and a weight to the backend by hand.',
        limit: 'The backend’s own /docs page does the same with no extra tool.',
        frame: false,
        checked: 'memory',
      },
      {
        name: 'Expo Snack',
        href: 'https://snack.expo.dev/',
        does: 'Runs a React Native app in the browser, and on a phone through Expo Go.',
        limit: 'Its frame loaded with our code; the running preview was not looked at.',
        frame: true,
        checked: 'ran',
      },
    ],
  },
];
