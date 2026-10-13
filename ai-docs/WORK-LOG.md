# Work log

What each AI session did, oldest first. For the current state, read
[SESSION-HANDOFF.md](SESSION-HANDOFF.md) instead; this file is the history.

Sessions ran in the Claude desktop app on the owner's Windows machine. The owner uses
more than one Claude account; when one hits its usage limit, work is resumed from
another, using the transcripts left on disk.

---

## Session 1 — 12 October 2026 — setup, redesign, first deploy

**Asked for:** understand the project and run it locally; then redo the site's design
with a proper sidebar and mobile support; then push to production.

**Setup**

- Read the repo. Two things actually run: `backend/` (FastAPI) and `web/` (Next.js).
  `firmware/` holds one `platformio.ini`; `app/` does not exist.
- Created `backend/.venv`, installed requirements, ran the tests: 145 passed. Checked
  that the unfamiliar `httpx2` dependency is the genuine pydantic package before
  installing it.
- `npm ci` in `web/`. Verified every route, hot reload, `tsc` and a production build.
- `.claude/launch.json` still pointed at the Astro site's `site/` folder on port 4321.
  Repointed it at `web/` and `backend/`.

**Redesign** (commit `87ba867`)

- Design tokens, three fonts through `next/font`, light and dark themes.
- Shell: full-height sidebar on desktop; top bar and a `<dialog>` drawer below 64rem;
  an "On this page" outline on wide screens; breadcrumbs; prev/next cards.
- Prose: tables in their own scroll box, copy buttons on fenced code with a language,
  callouts, cards, numbered steps for ordered lists.
- Home page hero with a worked equation computed from the real food table.

**Bugs found and fixed on the way**

- Dark-theme readers saw a light flash on every load: the boot script went through
  `next/script` `beforeInteractive`, which only queues code for after first paint. Now
  an inline script in `<head>`, per Next's own guide.
- Tailwind's `dark:` variant followed the OS, not the toggle. Added the custom variant.
- `npm run lint` was broken: Next 16 removed `next lint` (commit `2858c13`).

**Deployed.** Three commits pushed to `main`; Vercel built `87ba867`; live site checked.

**Started, then cut off by the usage limit**

- Three Sonnet research subagents: lab stock and Tunisian prices (finished), electronics
  verification (finished), mechanical build and app conventions (**failed: rate limit,
  no output**). The two finished reports are in [`research/`](research/).
- Three Sonnet subagents drew the part illustrations (`art/boards.tsx`, `parts.tsx`,
  `bench.tsx`) against two reference drawings and a class palette.
- The prototype simulator was written and tested: backend mirror, food-table sync
  script, 3D stage, phone app, pipeline.

## Session 2 — 12–13 October 2026 — another account, resumed from the transcript

**Asked for:** resume the interrupted work; later, a bigger load cell.

- Finished and committed the prototype (`cb6c570`).
- Rebuilt the component request from the research (`5cb22c0`): `bom.ts`, part cards,
  Tunisian prices, a "what changed" table. Design changes recorded as **D12**: white
  LEDs and a 2N2222 on Node B GPIO 13 instead of the WS2812B ring; HX711 on the
  DevKit's 3V3 pin instead of its own buck converter; ESP32-CAM-MB base instead of a
  USB-to-TTL adapter.
- Changed the load cell from 1 kg to 3 kg at the owner's request (`145a203`, **D13**),
  with a precision comparison and five-point calibration. Added `PROGRESS.md`.
- All three commits were pushed.

## Session 3 — 13 October 2026 — review, then three rebuilt pages

**Asked for, in order:** check the new work and run it locally; make sure only one
Next.js server runs; redo the Architecture and rig pages as 3D and drawings with minimal
text; a final component request for the lab technician; then document everything and
push.

**Review of session 2's work**

- Ran everything: 145 backend tests, `tsc`, food-table sync check, all routes, every
  internal link and anchor. All passed.
- Confirmed the 3 kg cell's price and stock from the shop page's own variant data
  (13 TND, in stock). The same page states **no dimensions**: the 75 × 12.7 × 12.7 mm
  in the notes is a seller-listing figure, still unverified.
- Found and fixed: `index.md` still described the old design (LED ring, level shifter,
  USB-to-TTL, buck converter); the load-cell drawing on the request still said "1 kg".
- Found and left: the site's `/reference/decisions` page stops at D6.

**One Next.js server**

- Established what was running (nothing: the app stops servers between turns), that
  Next 16 locks the project folder, and that a second `next dev` is refused. Details and
  the PID-reuse trap are in [RUNBOOK.md](RUNBOOK.md).

**The rig page, rebuilt** (`/rig`)

- `specs.ts`: 3 kg YZC-131 cell, six white LEDs on a carrier with a diffuser, lens
  320 mm above the plate, rig 420 mm tall. A helper computes the camera's frame from the
  lens's quoted angle.
- `Scene.tsx`: the cell on a Z-mount (spacer under the fixed end, riser on the free
  end) with a stop screw; the LED cluster replaces the ring; numbered markers on every
  part; taller arm; camera framing retuned.
- `RigViewer.tsx`: rewritten around a numbered legend. Pick a number and the camera
  flies to that part; layers toggle as chips.
- `Drawings.tsx`: four drawings computed from `specs.ts` — side view, plan, load path,
  camera geometry.
- The long text became three collapsed sections. `check-rig.mjs` now expects the new
  cell's dimensions.

**The Architecture page, rebuilt** (`/project/architecture`)

- A system map built from the request's own part drawings, with an eight-step player.
  The map is server-rendered; a 60-line client component sets one attribute and CSS does
  the highlighting, so the page's JavaScript grew by under 2 KiB.
- Three drawings: who does what in order, why two boards, what travels with the number.
- The capture order was corrected while redrawing it: tare the **empty** plate, then
  add food. The old page's "tare, then weigh" would zero the meal away.

**The component request, final form** (`/project/component-request`)

- Now a sheet for the lab technician: two explainer drawings, then every line with
  what it is for and **what would do instead**, a tick box per line, and print rules.
- `bom.ts` gained a `swap` line on all 32 requested parts and one numbering
  (`REQUEST`, `lineNumber`) used everywhere.
- The reasoning moved, unchanged, to `/project/component-request/notes`.

**Verified** before the push: `tsc`, production build, `check:rig`, food-table sync,
145 backend tests; no horizontal overflow at 320, 390 and 1440 px on the rebuilt pages;
the prototype's normal, tare-with-food and Wi-Fi-loss paths driven in a visible tab on
the reworked scene; console clean on fresh loads.

**Also looked at:** dark theme on the system map and the request sheet.

**Not verified:** the printed page (print rules are written, not printed); any real
phone.

**Also written:** these docs, a root `AGENTS.md`, decision **D14**, an updated
`PROGRESS.md`.

**After the push: where to host the backend**

- Asked for: a free server instead of the owner's PC, with Gemini as the vision API.
- Read the backend for what it needs from a host, then the providers' own pages for
  Vercel, Render, Neon, Hugging Face, PythonAnywhere, Cloud Run and Gemini.
- Recommended Vercel (second project, root `backend`) with Neon for the meal log and a
  Gemini Flash-Lite model, all in a US region. Report:
  [research/2026-10-13-free-backend-hosting.md](research/2026-10-13-free-backend-hosting.md).
- Two findings worth remembering: Hugging Face's Docker Spaces are no longer free, and
  no free host keeps a disk, so the SQLite file has to go whichever host is picked.
- Nothing was built, deployed or measured.

**After the push: web tools for the build, and a "Workbench" category**

- Asked for: research the online tools first, then a sidebar category that maps the
  whole build with real wiring and simulation.
- Tested in the browser, on the production address, with temporary frames: Wokwi,
  Falstad, Expo Snack and Lopaka all load inside one of our pages. A public Wokwi
  project with Node A's parts compiled and ran there; its load-cell slider at 0.27 kg
  printed 269.05 g.
- Found the limits: no simulator runs the ESP-NOW link or the camera, and Wokwi's load
  cell steps in about 2.4 g, so it proves logic and not accuracy.
- Proposed nine pages and one wiring source file feeding the page, Wokwi's
  `diagram.json` and the firmware's pin header. Report:
  [research/2026-10-13-web-tools-for-the-build.md](research/2026-10-13-web-tools-for-the-build.md).
- Then built, on "build it": the wiring as one source file, "Wire it" (a stepper over
  drawings of both boards, ticks kept in the browser), the build map, the toolbox, and
  "Simulate it" with the light and buzzer circuits running in Falstad. Measured there:
  18.2 mA per LED and 109 mA in all; the buzzer's switch-off spike held to 5.7 V by the
  diode. `npm run sync:wiring` writes the firmware's pin header from the same file.
- Verified: `tsc`, both sync checks, production build, `check:rig` on 19 routes, the
  old wiring address redirecting, no sideways scroll at 375 and desktop widths, both
  themes on "Wire it". Not verified: any of it against real boards.
