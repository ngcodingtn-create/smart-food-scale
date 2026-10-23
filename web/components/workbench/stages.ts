/**
 * The build, stage by stage: what each stage is for, which tool carries it,
 * how you know it is finished, and whether its page exists yet.
 *
 * `state` is about this site, not the hardware: "open" means the page is built
 * and usable today; "waiting" means it cannot be built honestly until the thing
 * in `waits` exists.
 */

export type Stage = {
  title: string;
  does: string;
  tools: string[];
  /** The check that says this stage is finished. */
  done: string;
  state: 'open' | 'partly' | 'waiting';
  href?: string;
  waits?: string;
};

export type Lane = { title: string; note: string; stages: Stage[] };

export const LANES: Lane[] = [
  {
    title: 'Before the parts arrive',
    note: 'Needs nothing but a browser.',
    stages: [
      {
        title: 'Simulate it',
        does: 'Run the scale’s firmware on simulated parts, and the two transistor circuits.',
        tools: ['Wokwi', 'Falstad', 'Prototype'],
        done: 'The simulated scale tares, weighs and beeps, and the light circuit draws what the sums said.',
        state: 'open',
        href: '/workbench/simulate',
      },
      {
        title: 'Try the backend',
        does: 'A phone photo and a typed weight, sent to the real backend.',
        tools: ['Camera stand-in', 'Google AI Studio'],
        done: 'A photo of a real dish comes back named, with its calories.',
        state: 'waiting',
        waits: 'The hosted backend and the Gemini recogniser.',
      },
      {
        title: 'The app',
        does: 'The phone app, running in the page and on a phone.',
        tools: ['Expo Snack'],
        done: 'Today’s meals show on a phone.',
        state: 'waiting',
        waits: 'The app.',
      },
    ],
  },
  {
    title: 'With the parts on the bench',
    note: 'In this order.',
    stages: [
      {
        title: 'Know your parts',
        does: 'Every part from the lab’s form: what it does, which board it goes on, and a photo of yours.',
        tools: ['This site'],
        done: 'Every part photographed and found; the 1000 µF capacitors bought.',
        state: 'open',
        href: '/workbench/parts',
      },
      {
        title: 'Wire it',
        does: 'Every wire, one at a time, on drawings of the two boards.',
        tools: ['This site'],
        done: 'Every wire ticked, and checked once more against the drawing before power goes on.',
        state: 'open',
        href: '/workbench/wire',
      },
      {
        title: 'Flash it',
        does: 'Write the firmware to each board from the browser, over USB.',
        tools: ['ESP Web Tools', 'PlatformIO'],
        done: 'Both boards boot and say so on the serial line.',
        state: 'open',
        href: '/workbench/flash',
      },
      {
        title: 'Test each part',
        does: 'One small test per part, read live in the page.',
        tools: ['Web Serial'],
        done: 'Display, buttons, buzzer, load cell, camera and light each pass alone.',
        state: 'open',
        href: '/workbench/bench',
      },
      {
        title: 'Calibrate',
        does: 'Five known masses, then masses it has never seen.',
        tools: ['Web Serial'],
        done: 'The accuracy tables are filled from masses not used to calibrate.',
        state: 'open',
        href: '/workbench/bench',
        waits: 'The page is ready. The masses are borrowed from a physics or chemistry lab.',
      },
    ],
  },
  {
    title: 'All of it together',
    note: 'The real thing.',
    stages: [
      {
        title: 'One whole meal',
        does: 'Plate, tare, food, photo, phone: on the hardware, as the prototype plays it.',
        tools: ['The rig', 'Prototype'],
        done: 'A meal reaches the phone with the mass the scale showed.',
        state: 'waiting',
        waits: 'Everything above. No simulator runs the link between the two boards, or the camera.',
      },
    ],
  },
];

export const STAGES = LANES.flatMap((lane) => lane.stages);
