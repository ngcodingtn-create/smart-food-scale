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

**24 October 2026: the shop list** (asked: a page in French to show the shopkeeper)

- A private claude.ai page, https://claude.ai/artifact/7dsJYCyuuMqi3SevoRg3Ps: HX711 ×1, push
  button ×1, 100 nF ×4, 1000 µF 16 V ×2, each with a photo, a drawing of the marking to
  check, what also works, and what does not. Photos: Tuni Smart Innovation's product pages
  (credited and linked), Commons for the ceramic, the owner's own button.
- Reference prices read from Tuni Smart's product data on 24 October: HX711 7.100 DT,
  button 6x6 0.500, "100 nF" 0.350 (its photo is a red film capacitor marked 104, not a
  ceramic: fine for decoupling), 1000 µF 16 V 0.900. About 10.800 DT for the list.
- Tuni Smart's "Condensateur Chimique 0.1uF/50V" is an electrolytic: the page says not that one.

**25 October 2026: the plan for the app and the hosted server** (asked: everything today,
including a "perfect" mobile app with accounts, with the load cell simulated)

- [APP-PLAN.md](APP-PLAN.md): Supabase (Postgres, Auth, Storage, one free project) instead of
  Neon; the FastAPI server hosted on Vercel and still the only thing the app talks to; the
  scale paired to an account through the camera's Wi-Fi setup page and a six-character code;
  unrecognised meals kept as "to name"; the app's nine screens in French first; the order of
  work for today and tomorrow.
- Facts read on 25 October: Expo SDK 58 (`expo` 58.0.19 on npm); Supabase free: 50,000
  monthly active users, 500 MB database, 1 GB storage, paused after a week unused; Clerk free:
  50,000 monthly retained users. Web search and fetch were down; app-store rules and UI
  patterns are from general knowledge and marked so in the plan.
- BUILD-PLAN.md's dates moved: the HX711 comes 26 October.

**Same day: /admin, the builder's area** (asked: a separate layout at /admin, password
protected, with a sidebar whose first route is the plan)

- The public pages moved into `web/app/(site)/` (a route group: no URL changed), whose
  layout is the old shell, now `components/SiteShell.tsx`. The root layout keeps only
  `<html>`, fonts and the theme script. `not-found.tsx` wraps itself in `SiteShell`.
- `/admin`: `app/admin/login` (sign-in, no sidebar), `app/admin/(locked)/` (layout with
  `components/admin/AdminShell.tsx`, the same `Sidebar` component fed `lib/admin-nav.ts`),
  `/admin` redirects to `/admin/plan`. `components/Sidebar.tsx` now takes optional groups,
  header and footer.
- The password is `SFS_ADMIN_PASSWORD`: `web/.env.local` locally (git-ignored), the Vercel
  project's environment variables in production. Unset means locked. `lib/admin-auth.ts`
  signs a 7-day cookie (expiry + HMAC keyed by the password), checked by `web/proxy.ts`
  (Next 16's renamed middleware) and again by the locked layout. A wrong password waits
  0.9 s. The owner chose an 8-digit password "for now"; it is weak for a public address.
- `/admin/plan`: `components/admin/plan.ts` (the tasks, the source) drawn by
  `PlanBoard.tsx`. The owner's ticks live in that browser's localStorage.
- Checked: wrong password refused, right one opens the plan, sidebar marks the current
  page, ticks save, no console errors, no sideways scroll; `tsc`; build (public pages
  still static, /admin dynamic, the proxy built). Not checked: production, which has no
  `SFS_ADMIN_PASSWORD` yet, so /admin there stays locked until the owner adds it.

**Same day: Our parts inside /admin** (asked: remove the public links from the admin sidebar, add our parts, staying in admin)

- The admin sidebar is one group, Build: The plan, Our parts. Every link stays in /admin.
- `/admin/parts`: the same cards as the public page (`KitCards.tsx`, renamed from `Kit.tsx`,
  which Windows could not tell from `kit.ts`), with filter tabs as links (`?status=check` …).
- The plan's links to public tools (Flash it, Wire it, Test and calibrate) open in a new tab.
- Checked: sidebar marks Our parts, 21 cards and 14 photos, the To check filter shows 6, no
  console errors, no sideways scroll; the public parts page still renders; `tsc` clean.

**Same day: the build companion** (asked: plan the project end to end, research it with as
many subagents as possible, milestones in /admin built one step at a time, explained visually
with the owner's photos and interactive SVG)

- Research: five subagents on the default model and five on Sonnet all failed at once
  (`model_not_found`); four forks of this session ran and wrote
  `research/2026-10-25-{hardware-build-guide,firmware-connectivity,backend-hosting-auth,mobile-app}.md`.
  The admin design was written here: `research/2026-10-25-admin-build-companion.md`.
- [ROADMAP.md](ROADMAP.md): ten milestones, why in that order, what the research changed
  (SDK 57 for Expo Go, Supabase's new keys, 201 `to_name`, `eaten_at`, Vercel's two CA roots,
  the setup-mode channel, our own captive portal, missing camera-on-breadboard wires).
- `web/components/admin/roadmap.ts`: milestones 0 and 1 in full (13 steps), the rest as drafts.
  Hotspots on the owner's photos measured on a percent grid, with a `view` window per photo.
- `/admin/build`, `/admin/build/[milestone]`, `/admin/build/[milestone]/[step]`; components in
  `web/components/admin/build/` (PhotoHotspots, StepWiring reusing Wire it's drawing and ticks,
  StepChecks, Expected drawn like the OLED or the serial log, PartChip, StepTool embedding the
  flash button or the bench, MilestoneMap, StepKeys for the arrow keys). Sidebar: Build map and
  a Milestones group; `NavItem.prefix` keeps a milestone current on its steps.
- `Bench.tsx` renamed `SerialBench.tsx` (Windows could not tell it from `bench.ts`).
- Checked: `tsc`, build; in the browser the map, a photo step (10 dots, the window frames the
  board), a wiring step (4 wires lit and listed), the flash and bench steps, no console errors in
  a fresh tab, no sideways scroll.

**Same day: the stepper redesign** (asked: better UI and UX, a stepper end to end, bars you can see)

- `components/admin/build/Stepper.tsx` + `stepper.css`: ProgressBar (visible track, count and
  percent), MilestoneStepper (ten circles on a line, a progress arc, the current one ringed),
  StepStepper (a milestone's steps as dots on a line), OverallCard (whole-build progress and
  "Continue where you left off", from `nextUp()` in progress.ts), MilestoneBadge (done/total in
  the sidebar; `Sidebar` takes an `extra` renderer).
- Step pages: the step stepper under the title; a sticky footer (back, step n of m with a bar,
  next) whose Next turns primary when the checks are done; a "Step done" card in the checks.
- Milestone pages: the milestone stepper on top, steps as a vertical stepper with Start/Continue
  on the next one, then the parts on the desk.
- Fixed: grid children of .admin-page could not shrink, so the stepper widened the page on a phone.
- Checked: tsc, build; desktop 1280 and phone 375 widths on the map, a milestone, three steps,
  the plan and parts (no sideways scroll); the done states by ticking checks in the built-in
  browser, whose test ticks were then cleared.

**Same day: Claude drives the boards** (asked: push to prod; keep localhost running; "you do
everything yourself, flashing etc., I just plug the node in")

- Pushed `363b2c0`. The dev server now runs in a Terminal tab of the app ("site
  (localhost:3000)"), not as a preview process the app stops at the end of a turn;
  `.claude/launch.json` "web" attaches to http://localhost:3000, "web-start" still starts one.
- `firmware/tools/board.py`, run with `firmware/.venv/Scripts/python`: `ports`, `flash <env>`
  (PlatformIO upload), `listen --reset`, `send "<cmd>" --expect`, `meal-test [--no-camera]`,
  `counts --grams` (median steady net count, and the counts per gram it implies). Finds the one
  USB board by itself (CH340, CH9102, CP210x); opens the port without pulsing DTR/RTS; refuses
  to send `pass`, so the Wi-Fi password stays with the owner.
- `roadmap.ts`: a `claude` field on each step. Step pages show "You do" (hands only: plug in,
  wire, press, look, the hotspot, the one password, the firewall prompt, the weights) and
  "Claude does, from the laptop". M1 rewritten that way; M2–M5's flashing, checks and
  calibration too. The flash button and the bench stay on the steps as "or do it yourself".
- `plan.ts`: flashing, the server on the network and the board tests moved to Claude's list.
- Checked: `tsc`, build; two step pages in the browser; `board.py` with no board attached
  (clear messages, right exit codes). **Not run against a board yet.**

**Same day: the real weight last** (asked: make Real weight the last milestone; research the
best way to stand in for the HX711 meanwhile, with what is in hand)

- Milestones reordered: 5 server, 6 app, 7 pairing, 8 finished scale (second button,
  microSD, power, rig), 9 real weight (HX711, cell, sign, mount, calibrate, accuracy, demo).
  Ids renamed to match their numbers; none had ticks (all drafts). `plan.ts`: tomorrow keeps
  the HX711 in its bag; a new last day holds its tasks.
- [research/2026-10-25-simulating-the-weight.md](research/2026-10-25-simulating-the-weight.md):
  keep the pretend scale and make it behave like a cell; A0 without the HX711, a fallback
  image, the ESP32-CAM faking an HX711 and a potentiometer were set aside, each with why.
- Node A 0.2.2, `-sim` builds only: a weight lands with a damped wobble (16 % overshoot,
  within 1 g by 1.3 s, checked by stepping the equations in Python); `sim sign -1`; `cal`
  kept in memory only (`saved=0`), `cal clear` leaves it uncalibrated. Both whole-meal
  tests wait 2.5 s before TARE. All images rebuilt and published, no warnings.
- M4 gained a written step, "Rehearse the real weight on the pretend one".
- Checked: `tsc`, build, firmware builds; the map, the rehearsal step and the plan in the
  browser. **The wobble and the rehearsal have not run on the board yet.**

**Same day: one button** (asked: one button, hold 5 s for tare, click for photo; the change
to more buttons, if any, in the last milestone with the HX711)

- Node A 0.3.0: `MainButton` on D5. A click (under 0.8 s) is PHOTO; held 5 s it tares; let go
  in between and nothing happens. The bottom line counts down `HOLD: TARE IN n s`. D3 stays
  PHOTO. `kClickMaxMs`, `kHoldToTareMs` in config.h. All four Node A builds clean; images
  republished; `pins.h` and the Wokwi files regenerated from `wiring.ts`.
- M1's button step rewritten (hold, then click); the second button left M8 and is M9's
  "One button or two" (draft). `plan.ts`, `wiring.ts` (part names, say/why), `kit.ts`,
  the French missing-parts sheet (a second button is now optional), the bench page's check
  table, the Wokwi note, the drawing's card titles, the firmware README.
- Not updated: `/prototype`, `/rig`, `/project/architecture` still show TARE and PHOTO as
  two buttons. **Not run on the board yet.**
- Checked: tsc, build, the step page and M9 in the browser.

**Same day: audit of /admin/build end to end** (asked: push, and check every page with
subagents). Three forks: M0–M4 text, M5–M9 and the plan, and a browser crawl of 62 URLs.
Fixed: a click with nothing on the scale shows NOTHING ON IT (`too-light`), not NO CAMERA;
M2's Wi-Fi step (the owner types name and password on the bench page, Claude gives the
server address); stale "tomorrow"/"24 October" notes for the HX711 and microSD; M7's
meal is pretend-weighed; `board.py counts` no longer waits for `stable=1`, which the
firmware never prints before calibration; the button's role in `bom.ts`. Crawl: all 200,
no console errors, no sideways scroll at 1280 and 375 px.

**Same day: every step animated** (asked: each step, start to finish, explained with a 3D or
2.5D SVG animation)

- `web/components/admin/build/scenes/`: an isometric kit (projection, blocks, cylinders, drawing
  on faces, timing helpers), the parts in 2.5D (laptop, NodeMCU, ESP32-CAM and base, breadboard,
  display, button, buzzer, transistor, LEDs, load cell, HX711, rig, plate, phone, charger, card),
  22 scene kinds with variants, and a player: requestAnimationFrame timeline, captions that
  light up in time and say who acts, play/pause, a scrubber, replay, a following camera on the
  wiring and the button, paused offscreen, still for reduced motion.
- Every one of the 48 steps has a scene (`scenes/index.ts`; a missing one fails the build); it
  opens each step page, drafts included. `/admin/build/scenes` shows them all, in the sidebar
  as "Every step, animated".
- Checked: tsc, build; each scene frame by frame in the browser (seeking, since the hidden pane
  throttles animation); a step at 375 px with no sideways scroll.

**Same day: the NodeMCU on the laptop, first time** (the owner plugged it in)

- Windows saw a CH340 (`USB\VID_1A86&PID_7523`) with no driver; the owner installed WCH's
  CH341SER. Then `board.py ports`: COM5, CH340.
- Flashed `node-a-nodemcu-sim` (ESP8266EX, MAC dc:4f:22:42:db:16, hash verified). It answered
  `info`: fw 0.3.0, calibrated, simulated.
- Found on the board: at power-on it read 840.0 g with nothing on it (untared: the pretend
  zero is 84 000 counts). Node A 0.3.1 tares itself at power-on, like a kitchen scale; a tare
  with no fresh readings now says `E error no-readings` instead of reading past an array; a
  blank line before the boot line so it does not join the ESP8266's start-up noise.
- `board.py`: strips that noise from the front of a line, and no longer crashes printing it on
  a cp1252 console.
- On the board, 0.3.1: `E boot node=a fw=0.3.1 calibrated=1 cpg=100.000000 simulated=1`,
  `E tare offset=84001`, `E link none`; `sim 150` read 150.0 g, steady. Steps 1.1 and 1.2 done.

**Same day: close-ups for every hands-on step, and the hand-off** (the owner was lost on the
rails step: "I want it in depth and close up for each step… showing all like it's real", then
"make it perfect for all the steps end to end", then asked for a hand-off to another account)

- `web/components/admin/build/scenes/closeup.tsx`: the wiring close-up, from `wiring.ts`. Node A:
  the NodeMCU from above with its printed pin names, the breadboard beside it, each wire made
  one at a time (pin found by its neighbours, F-M socket landing, wire, pin into the hole, the
  joined rail or row of five glowing). Node B: the ESP32-CAM on the breadboard (columns b and
  i), its empty MB base beside it, bench-only wires (`BENCH_B`) and a charger (`SUPPLY_B`); the
  light with its six LEDs, 100 Ω each, the right − rail as their common line. Positions are
  examples and say so. Earlier steps' wires stay drawn.
- `scenes/hands.tsx`: the micro-USB plug, the camera onto its base, the phone's hotspot, the
  microSD.
- `scenes/index.ts`: `closeupFor()` (wiring steps, M3 off-the-base, M8 power) and `HANDS`.
  The step page shows the close-up under the overview scene.
- Checked in the browser, frame by frame: rails (all three wires, rail glow, final view),
  display, buzzer, camera off the base, the light, the USB plug. **Not yet checked**: camera
  onto its base (may be offset), hotspot, microSD, M8 power, the M9 wiring steps. tsc and the
  build pass.
- `ai-docs/SESSION-HANDOFF.md` rewritten in full for the next account;
  `ai-docs/NEXT-SESSION-PROMPT.md` holds the prompt to start it.

**Same day, night: a second account takes over** (the owner: finish the close-ups, then
carry on the build from the rails step)

- Close-ups checked frame by frame, rendered to PNG offline (jiti + react-dom/server +
  sharp). The ESP32-CAM redrawn from the owner's photo; at its real length it covers rows
  1-14, so the light's transistor and LEDs moved below it; LED wires no longer go into the
  rails' gaps. Camera onto its base, microSD, hotspot, edge labels, power step fixed. tsc,
  build, and the pages at the pane's ~390 px width: no sideways scroll.
- The owner's ticks were only in one browser. Now mirrored to `web/data/progress.json`
  through `/admin/api/progress`, merged on load; checked by ticking, unticking and wiping
  the browser's storage (progress came back from the file).
- Found on the board: `E error no-display` could never appear (`oled.begin()` succeeds with
  nothing wired). Node A 0.3.2 probes the display on I2C first; flashed and confirmed with no
  display: the error shows.
- Step 1.3 rails: the owner wired 3V, G, VIN; the board boots and reads 0.0 g steady.

**Same night: the display step, with the board checking itself** (the owner: "still nothing,
figure out all possible causes"; then "an artifact from start to end that checks if I did it
right")

- Bench Photos (artifact, db + assets): the owner photographs the bench; Claude reads and
  answers under each photo. Display Fix (artifact): the answer in 2.5D on the owner's bench,
  later the SCL checks.
- Found from photos: the display's pins bare; the NodeMCU kept upside down (its rows swap
  sides); 3V and G jumpers lying flat (female ends).
- Firmware 0.3.3 to 0.3.5: `i2c` (pull-up test per line, ground test, bus scan both ways,
  switches a late display on), `button`, `beep`. On the bench: SCL missing, then flickering,
  then held to ground (a 25 s scan), then both lines fine but no answer.
- `/admin/wire`, "Wire it, live": milestone 1 end to end; each step's close-up (NodeMCU now
  drawn upside down) and a live panel fed by `/admin/api/board` (board.py, one at a time,
  killed with its tree on timeout, laptop only). Checked against the real board: it reads
  Power, SDA, SCL, Answers and gives the matching advice.
- Not done: the display still does not answer (GND row, a yellow in the wrong row, or a
  damaged display).

**26 October: the display lights up; 3D becomes the standard** (the owner: "this approach of
3D is the perfect one … continue always like this, change it in all steps")

- Display, Four Wires (artifact, three.js): the display wired straight to the D row with four
  female–female jumpers. The owner did it; the board found the display (`found=3c`); step 1.4
  ticked by the live page.
- `ai-docs/EXPLAINING.md`: the 3D standard; pointed to from AGENTS.md and memory.
- `web/components/admin/build/bench3d/`: a 3D bench for the step pages (scenes as data,
  three from npm, loaded only where shown). All of milestone 1 converted and checked frame by
  frame in the browser; tsc and the build pass.

**26 October, small hours: the silent buzzer (step 1.6) traced to VIN**

- Click tests in 3D, one page per answer: Transistor Check (it faced the wrong way), Diode
  Check (each beep had dropped the board off USB), Click Test (no click: the 5 V side),
  Buzzer, Straight to the Board (clicked on 3V: the module works), Find the 5 V (test A on
  the VIN wire: no click), VIN or VU (clicked on VU).
- One false lead caught from the owner's photos: the S jumper had gone onto the module's
  middle pin. Redone on S, test A still gave no click.
- Fix, commit `faa0fc9`: the 5 V rail takes VU, not VIN, in `wiring.ts` and everything
  generated from it or drawn by hand (3D rails step, 2.5D scene, board drawing, close-up,
  roadmap, live page, wiring page). tsc and the build pass.
- Noticed: the photos put the breadboard beside the outer row; the 3D scenes draw it beside
  the D row. Pin counts are unaffected; the scenes need mirroring.
- Not done: the buzzer back in place and a `beep` from the board; step 1.6 is still un-ticked.

**26 October: the HX711 arrived; real weight becomes milestone 2; one button** (the owner:
"make fixing the hx711 not in the end but in the correct order … only one button, hold for
tare … perfect 3D … end to end")

- Plan reordered: real weight is milestone 2, right after the scale's brain; the camera, the
  light and the rest move down one; the rig milestone recalibrates once the cell is mounted;
  the pretend-weight rehearsal is dropped. Plan page, scene keys and Bench Photos follow.
- One button: the second button is gone from the wiring, drawings, Wokwi sketch, kit and
  missing pages; firmware 0.3.6 (built, published, not yet flashed) no longer takes a photo
  on D3/FLASH; the `/prototype` front panel has one button timed like the firmware.
- Milestone 2 in 3D, nine scenes, checked in the browser: HX711, its pins, its wires and
  capacitors, the cell on a book with a cup, its wires, flashing, the sign (a finger presses
  the cup), calibration (a known mass), and the scale by hand (hold, mass, click).
- Not done: the HX711 and the cell's jumper colours wait for the owner's photos; 3D for
  milestones 3–9; flashing 0.3.6; the buzzer (1.6).
