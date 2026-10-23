# Session handoff

**Written:** 13 October 2026, at the end of session 3. **Rewrite this file when you
stop**; history belongs in [WORK-LOG.md](WORK-LOG.md).

## Where things stand

The site and the code are committed and pushed to `main`, which is production
(<https://web-ivory-ten-26.vercel.app>). If `git status` shows changes, someone has
worked since.

This file was last rewritten in full at `0dced01`. The Workbench lines below were
corrected when that category shipped; the owner asked for no new handoff that day, so
the rest is as it stood.

| Piece | State |
| --- | --- |
| Backend | Done. 145 tests, offline. Recognition is a stub by design |
| Food table | Done. 18 dishes, all flagged as estimates |
| Site shell and design | Done |
| Component request (`/project/component-request`) | **Final form.** A sheet for the lab technician; reasoning on `/notes` |
| Architecture (`/project/architecture`) | **Rebuilt** as a playable system map and three drawings |
| Rig (`/rig`) | **Rebuilt** on the current design, with four computed drawings |
| Prototype (`/prototype`) | Done. Simulates the whole chain in the browser |
| Firmware, Node A | **Written.** Compiles with PlatformIO (ESP32 core 2.0.17, no warnings) and runs in Wokwi (core 3.x). Never on a board: there is none |
| Firmware, Node B | **Written.** Compiles (core 2.0.17, no warnings). Its upload format was checked against the running backend by a script that builds the same bytes. No simulator runs it (no ESP32-CAM anywhere); never on a board |
| Mobile app | Not started. `web/components/sim/Phone.tsx` is the closest thing to a spec |
| Hardware | Not ordered. Waiting on the component request |

## What the owner is likely to ask next

In the order the project needs them:

1. **Take the request sheet to the lab technician**, then order what the lab cannot
   lend. The sheet prints: open it, print, and check the result (see "Not verified").
2. **Node A on a real board**: flash it from `/workbench/flash`, then check each part and
   calibrate on `/workbench/bench`. The firmware's serial line format and commands are
   in `firmware/node-a-scale/README.md`; the bench page speaks them.
3. **Node B on a real board**: flash it from `/workbench/flash`, set the hotspot and
   the backend's address on `/workbench/bench` (saved on the board, not compiled in),
   take a test photo, then tune the light's settle time and the JPEG quality in
   `firmware/node-b-camera/include/config.h` from real photos. Then both boards
   together: Node A's Find camera, then one whole meal.
4. **Move the backend off the owner's PC, with Gemini doing the recognition.** On
   13 October the owner said: "i want to not use my pc but a server" and "we are using
   gemini api to get the data". That settles D3's open choice (Gemini), though
   `docs/decisions.md` and `/reference/vision-apis` do not say so yet, and no
   `GeminiRecogniser` exists. The research and a recommendation (Vercel + Neon + Gemini
   Flash-Lite, all free, no bank card) are in
   [research/2026-10-13-free-backend-hosting.md](research/2026-10-13-free-backend-hosting.md),
   with the six code changes it needs. **Nothing is built or deployed.** The owner has
   seen the recommendation and not yet answered it. Three steps are theirs alone:
   the Gemini key, the Neon database, the second Vercel project.
5. **Finish the "Workbench" sidebar category.** Six pages are built: `/workbench`
   (build map), `/workbench/wire`, `/workbench/simulate` (the two circuits, and Node A's
   real firmware handed to Wokwi as three files), `/workbench/flash` (Node A from the
   browser), `/workbench/bench` (live readings and calibration over Web Serial, with a
   practice mode) and `/workbench/toolbox`. The wiring lives in one file,
   `web/components/workbench/wiring.ts`; the page, its pin tables and
   `firmware/node-a-scale/include/pins.h` (`npm run sync:wiring`) are made from it. The
   old `/project/wiring` redirects to `/workbench/wire`. Still to build, each waiting on
   something that does not exist yet: flash, test each part, calibrate, try the backend,
   the app, and Node A running in Wokwi (needs the firmware, and the owner's own Wokwi
   sign-in). The plan is in
   [research/2026-10-13-web-tools-for-the-build.md](research/2026-10-13-web-tools-for-the-build.md).
   Two choices were made while writing the wiring and are marked "proposed" on the
   page: the buzzer takes its supply from 5 V (VIN), and the breadboard carries a
   separate 5 V rail for it. The ESP32-CAM's pin order was not confirmed on a board.
6. **When the parts arrive**: measure the load cell and the camera's field of view and
   put the real numbers in `web/components/rig/specs.ts`. Then calibrate, and fill the
   empty tables on `/reference/accuracy`.

## Open questions nobody has decided

- **Where the LEDs point.** The rig models them in a ring around the lens, behind a
  diffuser. The parts list's own note says to put them "at an angle to the lens" so a
  glazed plate does not glare. These disagree. A test photo decides it; then make the
  model and the note agree.
- **A failed capture never reaches the phone.** When the backend cannot name the dish
  it answers the camera node. The app has nothing to show. A "pending capture" record
  on the backend would close it. The prototype page explains the gap.
- **ESP-NOW and the hotspot's channel.** Both boards must be on the Wi-Fi channel the
  hotspot picks; if it changes, Node A goes quiet. No handshake is designed yet. The
  electronics research report (question 7) has the options.
- **A 2 kg load cell** would be a third more precise than the 3 kg one, but is not
  stocked locally (D13).

## Known to be wrong or missing

Real, small, and not fixed. Fix them when you are nearby, or tell the owner.

- **`/reference/decisions` on the site stops at D6**, and its D6 still says "Astro on
  GitHub Pages". `docs/decisions.md` is current (D0–D14). The page needs regenerating
  from the file.
- **`/deliverables` (the status board) is stale**: it predates the prototype, the
  redesign and D12–D14. `PROGRESS.md` is the current status.
- **No search** on the site (noted in D6). **No CI**: nothing runs the tests on push.
- **No ESLint.** `npm run lint` is a type-check only.
- **The README lists files that do not exist** (`assets/`, `tools/`, `docs/wiring.md`,
  `docs/calibration.md`): they were in the original archive, which was never found (D0).
- **The mechanical-build research never ran**: its subagent hit a rate limit and
  returned nothing. Its questions were: how to mount a single-point cell correctly,
  what to make the platform and arm from, lighting for repeatable food photos, and what
  established calorie apps show on their "today" screen. Worth re-running before the
  build and before the mobile app.
- **An unexplained dev-only log line** on every page load. See RUNBOOK, "Known noise".

## Not verified — say so if asked

- **No firmware has run on a board.** Node A compiles and runs in Wokwi; the Flash
  page's images were checked byte by byte at their addresses, never written to a chip.
  The bench page was tested in practice mode only, never with a real serial port.
- **The two boards have never spoken.** Node A's camera search was only seen failing
  in Wokwi, and Node B's firmware has only been compiled. The Hello, ack and result
  frames, the duplicate-capture guard and the microSD queue are untested.
- **Node B's photo settings** (300 ms for the light to settle, two frames discarded,
  JPEG quality 12) are starting values, not measured ones.

- **The request sheet has not been printed.** Print styles exist (`@media print` in
  `request.css`: hides navigation, 8 pt rows, no row split across pages). Nobody has
  looked at the paper, or at a print preview.
- **No real phone.** Phone layouts were checked by emulated viewports only.
- **The load cell's dimensions** (75 × 12.7 × 12.7 mm) are a seller-listing figure. The
  shop page we would buy from gives none. The rig is drawn from it and labelled so.
- **The camera's field of view** is computed from a "66°" that vendors quote without
  saying which angle it is. The drawings assume the diagonal, which gives the smaller
  frame.
- **Every 3 kg accuracy figure** is the generic "percent of full scale" rule scaled up.
  No datasheet for the YZC-131 was found.
- **Lab availability** ("borrow") is inferred from starter kits and supplier lists. No
  faculty inventory was available.
- **Substitutes on the request sheet** (`swap` in `bom.ts`) are engineering judgement,
  written in session 3. The resistor ranges are calculated; the rest is experience.
  A technician may know better.

## If you only have five minutes

1. `git status` and `git log --oneline -8`.
2. Start one dev server and the backend ([RUNBOOK.md](RUNBOOK.md)).
3. Open `/project/component-request`, `/project/architecture`, `/rig`, `/prototype`.
4. Read the "Single sources of truth" table in [PROJECT-MAP.md](PROJECT-MAP.md) before
   editing anything that shows a number.

## Working with this owner

Observed over three sessions, not instructions from them:

- They ask in short bursts and often add a request while the last is still running.
  Finish what is in flight, then fold the new one in.
- They want things **shown, not described**: drawings, 3D, a page they can hold up. Long
  text was asked to be cut twice.
- They work across more than one Claude account and resume from transcripts. Leave the
  tree committed and this file current.
- "Push to prod" means commit to `main` and push. They ask for it explicitly each time;
  wait for that.
