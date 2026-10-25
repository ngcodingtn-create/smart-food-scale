# The build companion in /admin

Designed 25 October 2026. The owner, a beginner who learns visually, asked for the whole
project end to end, one step at a time, with the parts identified on their own photos and
interactive drawings, in the builder's area.

## Routes

| Route | What it shows |
| --- | --- |
| `/admin/plan` | Today and tomorrow (exists) |
| `/admin/parts` | Every part with its photo, filterable (exists) |
| `/admin/build` | The milestone map: every milestone, its state, what it unlocks |
| `/admin/build/[milestone]` | One milestone: its goal, the parts laid out, its steps, how to know it is done |
| `/admin/build/[milestone]/[step]` | One step: the visual, the actions, the checks, what you should see, what to do if not |

Static params from the data file, so every page prerenders behind the password. The
sidebar gains a "Milestones" group, one link per milestone, in order.

## One source of truth: `web/components/admin/roadmap.ts`

Like `wiring.ts` and `kit.ts`: the pages are drawn from it, nothing is typed twice.

```ts
type Milestone = {
  id: string;            // 'm1-scale-brain'
  number: number;
  title: string;         // 'The scale's brain'
  goal: string;          // one sentence: what works at the end
  when: string;          // '25 Oct', or 'after M6'
  parts: string[];       // kit.ts ids laid out before starting
  needs?: string[];      // milestone ids that must be done first
  steps: Step[];
  doneWhen: string;      // the milestone's own check
};

type Step = {
  id: string;            // 'oled-wires'
  title: string;
  goal: string;
  parts?: string[];                       // kit ids, shown as chips with the owner's photo
  wires?: { node: 'a' | 'b'; ids: string[] };   // wiring.ts ids lit in the drawing
  photo?: { file: string; alt: string; spots: Spot[] };  // an owner photo with hotspots
  actions: string[];                      // what to do, in order
  expect?: Expected;                      // what the board or page should show
  checks: string[];                       // ticked by the owner
  trouble?: { symptom: string; fix: string }[];
  tool?: 'flash' | 'bench' | 'wire';      // a live tool embedded in the step
};

type Spot = { x: number; y: number; label: string; part?: string; note?: string };  // % of the photo
type Expected = { kind: 'serial' | 'display' | 'page'; lines: string[] };
```

Checks are stored per browser (localStorage, one key per step), like Wire it's ticks.
Wire ticks reuse Wire it's own store (`sfs-wired-v1`), so ticking a wire in a step also
ticks it on the public Wire it page. A server store is only worth it once two people
build together.

## Components (`web/components/admin/build/`)

| Component | Does | On a phone |
| --- | --- | --- |
| `StepLayout` | Visual on the left, instructions on the right; prev/next; ← → keys | Visual on top, instructions under it, prev/next stuck to the bottom |
| `PhotoHotspots` | The owner's photo with numbered dots; tap a dot or its label to read it; the list beside it is the same points in words | Dots stay; the list sits under the photo |
| `StepWiring` | Wire it's drawing (`boards.tsx`, `ART`) with this step's wires lit, earlier ones done, later ones faded; tap a wire to read it | Scrolls sideways inside its own box |
| `PartChip` | A part's own photo and name, inline; links to its card | Wraps |
| `StepChecks` | The checks, ticked and remembered | Large tap targets |
| `Expected` | What the serial line or display should show, styled like the device (mono, the OLED's black and white) | Same |
| `Trouble` | "If you see X, do Y", folded | Same |
| `MilestoneMap` | The milestones as a route with states (done, now, next, later) | One column |

The bench (`Bench.tsx`) and the flash buttons (`FlashButton.tsx`) are embedded where a
step needs them, rather than linking out.

## Visual design

The site's tokens (`globals.css`) and the admin frame. Copper for "do this now", teal for
"measured or done", the OLED drawn as it is (white on black). Reduced motion respected;
every photo has alt text; every hotspot is also in a list, so nothing depends on seeing
the photo.

## Implementation order

1. `roadmap.ts` with every milestone and the steps of the first two in full.
2. `/admin/build` (map), `/admin/build/[milestone]`, `/admin/build/[milestone]/[step]`.
3. `StepLayout`, `PartChip`, `StepChecks`, `Expected`, `Trouble`, `StepWiring`.
4. `PhotoHotspots`, with hotspot coordinates measured on the owner's photos.
5. The other milestones' steps, from the research files of 25 October.
