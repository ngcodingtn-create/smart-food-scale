# Project map

Where things are, and which file to change when you want something to change.

## The repo

| Path | What it is | State |
| --- | --- | --- |
| `backend/` | FastAPI service: recognise the dish, look up nutrients, multiply by the measured grams, store the meal | Built, 145 tests |
| `backend/data/tunisian_foods.json` | The food table: 18 dishes, every value flagged as an estimate | Built. **The only place a nutrient figure may be edited** |
| `web/` | Next.js 16 site: docs, the component request, the 3D rig, the prototype simulator | Built, deployed |
| `firmware/node-a-scale/` | PlatformIO project for the scale node | Written, compiles, runs in Wokwi; see its README |
| `firmware/shared/sfs_protocol.h` | The ESP-NOW frames both nodes speak | Node A uses it; Node B must |
| `firmware/tools/publish_web.py` | Builds Node A and writes the images the Flash page installs | Run after firmware changes |
| `web/public/workbench/` | Generated: firmware images, and Node A's Wokwi files | Never edit by hand |
| `firmware/node-b-camera/` | PlatformIO project for the camera node | Written, compiles; see its README. Wi-Fi and backend set over serial |
| `app/` | React Native app | Does not exist yet |
| `docs/decisions.md` | Decision log, D0–D14 | Current |
| `PROGRESS.md` | Human-facing status | Current |
| `index.md` | Old one-page summary from the GitHub Pages era. Pages no longer serves it | Summary only; points at the site |
| `ai-docs/` | These notes | — |

The README mentions `assets/`, `tools/`, `docs/wiring.md`, `docs/calibration.md` and a
workbook. **They are not in the repo**: the original archive was never found (decision
D0). The wiring and accuracy content lives on the site instead.

## Single sources of truth

Change the source, never the copy.

| To change | Edit | What follows automatically |
| --- | --- | --- |
| A dish or a nutrient value | `backend/data/tunisian_foods.json`, then `npm run sync:foods` in `web/` | Backend, the simulator, the home page's worked example, the Architecture data-flow drawing |
| A line of the component request, a price, a substitute | `web/components/request/bom.ts` | The request sheet, its line numbers, the parts map, the notes page's cards, cost table and totals |
| A dimension of the rig | `web/components/rig/specs.ts` (`DIM`) | The 3D model, all four drawings, the dimension table, the captions. Then update the string `scripts/check-rig.mjs` expects |
| The sidebar | `web/lib/nav.ts` (`NAV`) | Sidebar, mobile drawer, prev/next links, breadcrumbs. Pages that exist but are not listed go in `UNLISTED` |
| The steps of a capture, as drawn | `STEPS` in `web/components/arch/SystemMap.tsx` | Both layouts of the system map, the stepper, the screen-reader text |
| Backend behaviour the simulator shows | `backend/app/` first, then mirror it in `web/lib/sim/backend.ts` | The prototype. The mirror follows the backend, never the reverse |
| Colours, type, spacing | Tokens at the top of `web/app/globals.css` | Everything, both themes |

## The site (`web/`)

Routes are `.mdx` files under `app/`. A page is content plus a few components; logic
lives in `components/`.

```
app/
  layout.tsx                 shell: sidebar, top bar, outline, footer; fonts; the theme boot script
  globals.css                design tokens, shell, prose, home hero
  page.mdx                   /            overview
  project/
    component-request/       /project/component-request        the sheet for the lab technician
      notes/                 /project/component-request/notes  the reasoning behind it (not in the sidebar)
    architecture/            /project/architecture             system map + three drawings
    wiring/  risks/
  rig/                       /rig         3D model + four drawings
  prototype/                 /prototype   the end-to-end simulator
  deliverables/  reference/  eight pages that are served but not in the sidebar
components/
  Sidebar.tsx                sidebar and the mobile drawer (a native <dialog>)
  ThemeToggle.tsx            light / dark / system; state lives outside React
  InlineScript.tsx           the pre-paint theme script (see "Things that look wrong but are right")
  Toc.tsx  Breadcrumb.tsx  PageNav.tsx  Callout.tsx  Cards.tsx  CopyButton.tsx  icons.tsx
  Figure.tsx  figure.css     captioned drawings, and the palette every <svg class="fig"> uses
  home/Hero.tsx              the worked equation on the home page
  request/
    bom.ts                   THE parts list
    Handout.tsx              the technician sheet: explainer, rows, sign-off
    PartList.tsx             cards, summary and cost table for the notes page
    PartArt.tsx              one drawing by id; PartGlyph embeds it inside a larger SVG
    art/*.tsx                ~44 part drawings on a 120 × 90 grid
    request.css              drawing palette, cards, the sheet, print rules
  rig/
    specs.ts                 THE dimensions, the part list, the provenance table
    Scene.tsx                the three.js scene (dense one-liners: that is its existing style)
    RigViewer.tsx            viewer UI; the only place Scene is imported, dynamically
    Drawings.tsx             side view, plan, load path, camera geometry — computed from specs.ts
  arch/
    SystemMap.tsx            the map, drawn on the server, wide and tall
    MapPlayer.tsx            client stepper; sets data-step, nothing else
    Diagrams.tsx             sequence, why-two-boards, data-flow
    arch.css
  sim/
    Simulator.tsx            the simulator's state machine and bench
    Phone.tsx                the simulated app: Today, History, Add, Settings
    SimStage.tsx             the rig Scene, reused with live props
lib/
  nav.ts                     navigation
  sim/backend.ts             the backend, mirrored in TypeScript
  sim/food-table.json        generated copy of the food table — do not edit
scripts/
  check-rig.mjs              production check: routes, <h1>, WebGL bundle isolation
  sync-food-table.mjs        copies the food table; `--check` fails when stale
```

`web/AGENTS.md` says the installed Next.js differs from what a model may remember, and
to read `web/node_modules/next/dist/docs/` before writing Next-specific code. It is
right: `next lint` is gone, `beforeInteractive` does not run before paint, and
`mdx-components.tsx` is called with no arguments.

## Design system, in one screen

The site has two voices, because the project has one idea: the camera answers *what*,
the load cell answers *how much*.

| | What | How much |
| --- | --- | --- |
| Type | Fraunces (serif, headings) | IBM Plex Mono (labels, readouts) |
| Colour | terracotta `--accent` | teal `--measure` |

Body text is Instrument Sans. Everything else is warm near-neutral "paper". Tokens:
`--ink`, `--ink-soft`, `--ink-faint`, `--paper`, `--paper-raised`, `--paper-sunken`,
`--rule`, `--rule-strong`, plus `--note/--tip/--caution/--danger` with `-ink` and
`-wash` variants. Dark theme is the `dark` class on `<html>`; never use literal colours.

Three SVG palettes, each a small set of classes:

| Class on the `<svg>` | For | Defined in |
| --- | --- | --- |
| `.part-art` | Part drawings, 120 × 90 | `components/request/request.css` |
| `.fig` | Diagrams and dimensioned drawings, ~360 wide | `components/figure.css` |
| (plain) | The home hero and the simulator's camera frame | their own CSS |

Drawings are authored about 360 units wide and shown at about that many pixels, so 10 px
labels stay readable on a phone without a second layout. The one exception is the system
map, which is drawn twice (760 wide and 360 tall) from the same tables.

## How to add things

- **A page:** create `app/<path>/page.mdx`, add it to `NAV` (or `UNLISTED`) in
  `lib/nav.ts`. Restart the dev server if the route 404s.
- **A part:** add an object to `PARTS` in `bom.ts` with `source`, `role` and `swap`. If
  it needs a drawing, add one to `art/*.tsx` using only the `.part-art` classes.
- **A drawing:** an `<svg className="fig" viewBox="0 0 360 …">` inside a `<Figure>`.
  Compute coordinates from data where data exists.
- **Markdown inside a component in MDX** (`<Card>`, `<Callout>`): leave a blank line
  either side, or the `**bold**` markers come through literally.

## Things that look wrong but are right

- **`InlineScript.tsx` renders a `<script>` whose `type` differs on server and
  client.** That is Next's documented pattern for running code before first paint
  without a React warning. `next/script` cannot do it. Do not "fix" it.
- **Code blocks use the system monospace, not the web font.** The architecture page
  used to hold a box-drawing diagram; a subsetted web font lacks those glyphs.
- **The drawer is a `<dialog>`, not a div with a focus trap.** The browser supplies the
  trap, Esc, and inertness.
- **`.rig-parts` is a `<div role="list">`, not an `<ol>`.** Inside `.prose`, an `<ol>`
  is restyled as numbered steps.
- **The simulator's recogniser reports no confidence value.** Inventing one would be the
  false precision the project exists to avoid.
- **`Scene.tsx` is written as dense one-liners.** That is the file's existing style;
  match it there, and nowhere else.

## The builder's area (/admin), added 25 October 2026

| What | Where |
| --- | --- |
| Public pages (unchanged URLs) | `web/app/(site)/`, frame in `web/components/SiteShell.tsx` |
| Admin pages | `web/app/admin/` (`login/`, `(locked)/`), frame in `web/components/admin/AdminShell.tsx` |
| Admin sidebar | `web/lib/admin-nav.ts` (every link stays in /admin) |
| Our parts (admin) | `web/app/admin/(locked)/parts/page.tsx`, cards from `web/components/workbench/KitCards.tsx` |
| The plan's tasks | `web/components/admin/plan.ts` (the source), drawn by `PlanBoard.tsx` |
| Password check | `web/lib/admin-auth.ts`, `web/proxy.ts`; password in `SFS_ADMIN_PASSWORD` |
| Step animations | `web/components/admin/build/scenes/`: `iso.tsx` (projection, blocks, timing), `parts.tsx` (the parts in 2.5D), `bench-scenes.tsx` and `world-scenes.tsx` (the scenes), `index.ts` (which scene each step plays: a step without one fails the build), `StepScene.tsx` (the player). All of them on `/admin/build/scenes` |
| Close-ups | `web/components/admin/build/scenes/closeup.tsx` (wiring, one wire at a time, from `wiring.ts`; part positions in `PLACES_A`/`PLACES_B`; bench-only wires `BENCH_B`, `SUPPLY_B`), `hands.tsx` (USB plug, camera onto its base, hotspot, microSD); which step gets which: `closeupFor()` and `HANDS` in `scenes/index.ts` |
