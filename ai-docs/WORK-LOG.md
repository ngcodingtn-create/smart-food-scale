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

---

## Session 4 — 14 October 2026 — Node A's firmware, flashing and the bench

**Asked for:** "continue here". Picked up the next item the Workbench needed: firmware.

- **Node A firmware** (`firmware/node-a-scale/src/main.cpp`, `include/config.h`):
  HX711 at 10 per second, live median of 5, TARE, PHOTO as the median of 12, OLED,
  buttons, buzzer, calibration saved on the board, and ESP-NOW to Node B with a channel
  search, acks and retries. Prints one line per event for the site to read. Frames in
  `firmware/shared/sfs_protocol.h`, for Node B to share.
- **Compiled** with PlatformIO (core 2.0.17): both builds, clean, no warnings from our
  code. **Ran in Wokwi** (core 3.x): boot, `link none`, 0.42 kg read as 176 counts and
  419.0 g, TARE to 0.0 g, PHOTO 150.0 g from twelve readings of 239, `ok=0` (no camera).
- `npm run sync:wiring` now also writes Node A's Wokwi sketch and diagram into
  `web/public/workbench/wokwi/node-a/`; `/workbench/simulate` hands them over.
- **`/workbench/flash`**: ESP Web Tools install buttons for both builds. Its npm entry
  point fails under Turbopack (it imports Material Web internals that @material/web
  2.5 ships as CSS), so the page loads the library's self-contained browser build.
  Images from `firmware/tools/publish_web.py`, offsets taken from PlatformIO's own upload.
- **`/workbench/bench`**: Web Serial console with the live reading, the four commands,
  and a calibration fitted through zero and saved with `cal`. Practice mode runs a
  pretend scale in the page; checked end to end there (fit 99.9985 against a true 100).
- Verified: `tsc`, both sync checks, build, `check:rig` on 21 routes, no sideways
  scroll at 375 px on the new pages. Not verified: anything on a real board.
- `npm audit` reports issues in next, sharp and source-map-js that predate this work;
  the flagged Next code path (`next/og`) is not used here. Not fixed.

**Later the same day: Node B's firmware** (asked: "continue")

- `firmware/node-b-camera/`: joins the hotspot, answers Node A's Hello with its
  channel, acks each Capture at once (and does not re-shoot a repeated one), then light
  on, settle, one 800 × 600 JPEG, light off, `POST /meals` (`grams`, `eaten_on` once the
  clock is set, `image`). No answer or a 5xx: kept on the microSD card and retried every
  15 s. The outcome goes back to Node A as a Result.
- Added a fourth outcome to `sfs_protocol.h`, `Unknown` (the backend could not name the
  dish); Node A shows it as `NOT RECOGNISED`. Both boards' boot and info lines now say
  `node=a` or `node=b`.
- Wi-Fi name, password and backend address are serial commands saved on the board, so
  the image on the Flash page works for anyone. https needs a root certificate in
  `secrets.h`; without one Node B refuses it rather than skip the check.
- Checked: both boards compile; the request bytes Node B builds were rebuilt in Python
  and posted to the running backend: 201 with and without a date, 422 under 0.5 g (the
  three test meals were deleted afterwards). The Flash page installs all three images;
  the bench page recognises which board is attached and has a camera practice mode.
- Not checked: anything on hardware, or the two boards talking.

**23 October 2026: "Your parts"** (`/workbench/parts`)

- The lab signed the IoT form: lines 1–14 and 16 handed over, 15 crossed out, 17–19
  not given. `web/components/workbench/kit.ts` records that, per part, with a status
  (have, buy, check, skip); what each part does still comes from `bom.ts`.
- Each card has a slot for a photo of the real part. Photos the owner sends in chat go
  in `web/public/workbench/kit/` and are named in `kit.ts`; "Add photo" keeps one in that
  browser only (IndexedDB). No photos yet.

**Same day: the owner's photos** (asked: "check", then "push to prod")

- The owner uploaded 16 photos through a private claude.ai upload page. Each was looked
  at, resized to 1400 px with metadata removed, and put in `web/public/workbench/kit/`;
  `kit.ts` now names each part's photo and says what the photo showed.
- **The board handed over as "ESP32 DevKit V1" is an ESP8266 NodeMCU** (module reads
  ESP8266MOD, pins D0–D8 and A0, CH340). New status `swap` on the parts page. The owner
  has been told to ask the lab for a swap; porting Node A to the ESP8266 is the fallback.
- The ESP32-CAM's printed pin names match `wiring.ts`: marked as checked. The display's
  pins run VCC, GND, SCL, SDA: the drawing in `boards.tsx` was changed to match.
- Not settled by the photos: transistor part number (leg order), electrolytic values,
  load-cell capacity, buzzer type (multimeter), a second push button. Not photographed:
  HX711, ESP32-CAM-MB, 100 nF ceramics.
- Checked: `tsc`, `sync:wiring --check`, build; `/workbench/parts` shows all 16 photos
  with no console errors.
- A 17th photo: the ESP32-CAM seated on its ESP32-CAM-MB (IO0, RST, micro-USB), so
  line 3 is in hand. The blue part on the load cell's wires is a 4-way connector, not
  an HX711; the HX711 is still unaccounted for and is required.
- An 18th photo: a close-up of one electrolytic, 100 µF 25 V. Judged good enough for
  the 10 µF beside the HX711 (more bulk capacitance on 3.3 V is harmless), so line 14
  is marked in hand and `bom.ts`'s substitute range for it widened to 4.7–100 µF.
  That widening is engineering judgement, not a measurement.
- A 19th photo: the transistor's face reads 2N2222A, the part asked for; `kit.ts` gives
  the usual leg order and the multimeter check, since makers differ.
- Asked: can the kit build the prototype? Yes, once the HX711 is found and the ESP8266
  is swapped or Node A ported to it. Written up, with a proposed NodeMCU pin map, in
  [research/2026-10-23-can-the-kit-build-the-prototype.md](research/2026-10-23-can-the-kit-build-the-prototype.md).
  Web search failed this session; the two facts it rests on were read from the source pages.

**Same day: Node A moved to the ESP8266** (asked: "move the firmware to the ESP8266";
the faculty was closed, so no HX711 and no swap)

- `main.cpp` builds for both chips; the differences are two `#if defined(ESP8266)`
  blocks: settings in EEPROM (a magic-tagged struct) instead of Preferences, and the
  ESP8266's ESP-NOW calls (role COMBO, `wifi_set_channel`, the broadcast peer re-added on
  each channel). On the ESP8266, Wi-Fi persistence, auto-connect and modem sleep are
  turned off so the radio stays on the channel it searches. Version 0.2.0.
- `wiring.ts`: Node A's board is the NodeMCU, pins read off the owner's photo (LoLin V3
  layout). GPIOs: capture D3/0, SDA D2/4, SCL D1/5, HX711 DT D6/12, SCK D7/13, tare
  D5/14, buzzer D8/15, chosen around the boot pins. Each also names its old ESP32 pin
  (`esp32`), which `sync-wiring.mjs` uses for the `#else` half of `pins.h` and for the
  Wokwi diagram (Wokwi has no ESP8266, checked on docs.wokwi.com).
- `platformio.ini`: four environments. `publish_web.py`: one image per chip, both listed
  in each manifest, so the Flash page writes whichever chip is plugged in. Files renamed
  to `<name>-<chip>.bin`.
- Pages: the Wire it drawing and callouts (NodeMCU boot pins; the 2N2222A's legs), Flash
  it, Simulate it, and the parts card (`given` in `kit.ts`).
- Checked: all four builds compile with no warnings; the ESP8266 images start with the
  0xE9 header; `tsc`; `sync:wiring --check`; the Wire it drawing in the browser (every
  wire on its pin); the manifests and images load. Not checked: anything on the board.

**Same day: "Ce qui manque encore"** (`/workbench/missing`; asked: a page in French, with
drawings and web images, to show the lab)

- Which parts are missing is read from `kit.ts` (status not have/skip): HX711, a second
  push button, 4 × 100 nF, 2 × 1000 µF, header strip, 5 V charger, microSD. The French
  words, urgency and photos are in `web/components/workbench/missing.ts`, which fails the
  build if it and `kit.ts` disagree. `kit.ts` gained `given` for the 100 µF standing in
  for the 10 µF; the push button is now "check" (only one came).
- Photos: the owner's own where a received part shows what is wanted (button, 100 µF),
  otherwise freely licensed ones in `web/public/workbench/missing/`, each credited on the
  page: SparkFun HX711 (Flickr, CC BY 2.0, found through Openverse), and Wikimedia
  Commons for the 100 nF, header, charger and microSD (CC BY-SA). Commons has no HX711.
- A French SVG map of where each missing part goes, a summary table, one card per part.
- Checked: `tsc`, build, all seven photos load, no sideways scroll, no text overlap in the
  map (measured with getBBox). Screenshots of the hidden browser pane were unreliable.

**Same day: the plan for finishing** (asked: "tomorrow i will get the HX711, the second
button and the microSD … figure out the best plan to do everything today")

- [BUILD-PLAN.md](BUILD-PLAN.md): today, everything except the real weight, on the
  pretend scale; tomorrow, the HX711, the button and the card, calibration, real meals.
  Each step says where and how to tell it worked; a risks table at the end.
- The bench page could not set the weight of a real board running the pretend scale (only
  practice mode had a slider). Added a pretend-weight box, shown when the board reports
  `simulated=1` (Node A 0.2.1 now says so in `info` as well as at boot), and a box that
  sends any command. Images republished as 0.2.1.
- `backend-lan` in `.claude/launch.json`: uvicorn on `0.0.0.0:8000`, so the camera board
  on the hotspot can reach the laptop. The firewall prompt is the owner's to answer.
- `kit.ts`: the HX711, second button and microSD marked as coming 24 October.

**Same day: the Gemini recogniser** (asked: "write the Gemini recogniser now")

- `backend/app/recognition/gemini.py`, registered as `gemini`. It sends the photo and our
  18 dishes to `generateContent` over `httpx` (no SDK), asks for JSON
  `{dish_key, confidence, reason}`, and keeps D3: `unknown`, a key outside our list, or a
  confidence under `SFS_GEMINI_MIN_CONFIDENCE` (0.5, a starting value) all give
  `dish_key=None`, so the API answers 422 and the camera reports NOT RECOGNISED.
- Settings: `SFS_GEMINI_API_KEY`, `SFS_GEMINI_MODEL` (default `gemini-3.5-flash-lite`,
  which Google's model page recommended for new projects on 23 October),
  `SFS_GEMINI_TIMEOUT_S` (15, under the camera's 20 s), `SFS_GEMINI_BASE_URL`.
- Request and response shape from the generateContent examples on Google's "Migrating to
  the Interactions API" page, which says generateContent "remains fully supported". The
  Interactions API itself was not used: its pages disagreed on its version and on
  `response_format`. Web search and fetch were down; the pages were read with curl.
- `RecognitionUnavailable` (no key, no network, any non-200 from Gemini) now gives a 502,
  as `base.py` always claimed; before, it would have been a 500. The camera board keeps the
  capture and retries on either.
- `POST /meals` calls the recogniser on a worker thread, so a slow Gemini call does not
  stall the server.
- Checked: 162 tests pass (17 new, all against an `httpx.MockTransport`); the check
  command with no key says so; with a made-up key Google answered 400 "API key not valid",
  so the address and header reach Gemini. Not checked: a real answer, the model name or the
  request body with a real key.

**Same day: can the load cell be emulated, and what the owner needs today** (asked: research
everything needed today; emulate the load cell with a script so tomorrow it is only plugged in)

- Verdict in `BUILD-PLAN.md`: the pretend-scale image already emulates the cell (only
  `readCell()` differs). Added the script that was missing: **Run the whole-meal test** on
  the bench page plays plate, TARE, food, PHOTO and checks each line up to the backend's
  result. Tried in practice mode (steps 1–4 pass; 5 fails as it should). It listens before
  it sends, because practice answers synchronously. It never sends `cal` to a real board.
- An auto-fallback image (pretend weights when no HX711 answers) was rejected: a loose
  wire would give invented weights that look real.
- From the owner's photos: the LoLin-style NodeMCU may cover every breadboard hole beside
  its pins (female–male jumpers, ten needed, ten in hand); the ESP32-CAM's pins are
  unreachable on its MB base (camera on the breadboard, four jumpers from the base's
  sockets, not tried); the buzzer module reads −, middle, S, with the + moulded on the S
  side, so `wiring.ts` now names S and leaves the middle empty.
- A "what to have on the table today" list in the plan.
