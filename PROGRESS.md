# Progress

Where the Smart Food Scale project stands, what changed recently, and what is next.
Nothing is marked done unless it has been run. Newest work first.

**Live site:** https://web-ivory-ten-26.vercel.app (deploys on every push to `main`)
**Last updated:** 26 October 2026

---

## ▶ Continue here (26 October 2026)

To pick up, tell Claude: **"continue from progress.md"**. **Milestone 1 is done.** The build
is at **milestone 2, step 2.4: mount the cell, bolted as in the finished scale**
(http://localhost:3000/admin/build/m2-real-weight/bench-mount): a board on feet, a block under
the wired end screwed from below, a block and the top plate on the label end screwed from
above. 2.1, 2.2, 2.3 and 2.6 are ticked; the board runs the real-scale firmware. Your cell is
**20 kg**. Still to check: the jumper order on the blue connector (yellow E+, red E−, brown A−,
green A+).

### The plan, in order (changed 26 October)

| # | Milestone | 3D for every hands-on step |
| --- | --- | --- |
| 0 | Know the parts | 2.5D |
| 1 | The scale's brain (pretend weight) | ✅ |
| **2** | **Real weight: HX711, load cell, calibration** | ✅ your XFW-HX711, drawn from your photos |
| 3 | The camera online | ✅ |
| 4 | The light (needs about 8 male–male jumpers: get more) | ✅ |
| 5 | Both boards together | ✅ |
| 6–8 | Server, app, pairing (on the laptop and phone) | ✅ simpler scenes; the software is still to write |
| 9 | Finished scale: microSD, power, rig, calibrate again, accuracy, demo | ✅ |

**One button only**: a click is PHOTO, a 5-second hold is TARE. The second button is gone
everywhere.

**Waiting on you:** one photo on Bench Photos, the blue connector on the cell's wires, close
(your HX711 photos are in: an XFW-HX711, pins already soldered). And before milestone 4,
more male–male jumpers.

### Milestone 1, the scale's brain

| Step | State |
| --- | --- |
| 1.1 USB port | ✅ COM5, CH340 |
| 1.2 Flash | ✅ Pretend scale, now firmware 0.3.6 (one button) on the NodeMCU |
| 1.3 Rails | ✅ 3V and G from the outer row; **5 V now from VU** (see below) |
| 1.4 Display | ✅ Four female–female jumpers straight to the board; it lights up |
| 1.5 Button | ✅ The board reads it |
| 1.6 Buzzer | ✅ It beeps (5 V from VU; the buzzer rewired from the 3D) |
| 1.7 Whole test | ✅ All six checks passed; the owner saw 150.0 g, then NO CAMERA with the long beep |

### The buzzer, so far

- **Fixed:** the transistor faced the wrong way; the diode was checked (the board no longer
  drops off USB on a beep).
- **Found and fixed:** on this NodeMCU, **VIN gives no 5 V on USB**. Click tests proved it:
  silent on VIN, a click on **VU** (outer row, 3rd pin from the far end: A0, G, VU). Every
  page now says VU (commit `faa0fc9`). The brown wire is on VU.
- **The buzzer itself works:** it clicked wired straight to the NodeMCU.
- **Last seen:** back in the breadboard, the board answered `E beep` and stayed on USB, but
  no beep was heard, only a **constant faint hiss**. That means current flows through the
  buzzer all the time: the transistor is on all the time, or the buzzer's − reaches ground
  without it. The Hiss Test (pull the transistor out, listen) was sent; its answer is not in.
- **Then the owner said "I messed up"** and is **rewiring the whole buzzer** from the full 3D
  on the build page: http://localhost:3000/admin/build/m1-scale-brain/buzzer. Everything for
  the buzzer comes out (transistor, 1 kΩ, diode, module, their wires); rails, display and
  button stay. The 3D puts it in rows 14–18: transistor column c rows 16–18 (flat face to the
  gap, E in 16), 1 kΩ b14→b17, D8 (11th pin) → a14, a16 → left − rail, module down column j
  (S row 16, − row 18), d18 → f18, g16 → right + rail row 24, diode h16→h18 band at 16.

### Next, in order

1. The owner says the buzzer is rewired and the USB is in. Claude runs `beep`
   (`firmware/.venv/Scripts/python.exe firmware/tools/board.py send beep --expect "E beep"`;
   close the Wire it, live tab first). **Tick 1.6 only when the owner hears it.**
2. Still silent or hissing: the Hiss Test, then check the D8 wire really is on D8 (a pin
   that is always on would keep the transistor on).
3. Step 1.7, the whole test.
4. Claude flashes firmware 0.3.6 (one button) when the board is free.
5. Milestone 2, real weight: redraw the HX711 and the cell's jumpers from the photos, then
   the steps at `/admin/build/m2-real-weight`.
6. Every step of milestones 1 to 9 now has its 3D (milestone 0 stays 2.5D).
7. **Asked, not yet answered:** "the final 3D, how it should be after all": the whole
   bench in one 3D view. The step 1.7 page draws milestone 1's; step 2.9 draws it with the
   HX711 and the cell.

### Open questions on the bench

- The owner's photos put the breadboard beside the NodeMCU's **outer** row; the 3D scenes
  draw it beside the D row. Pin counts from the far end are right either way. Confirm with a
  photo before mirroring the scenes.
- The 3D's buzzer rows (14–18) are a clean layout, not where the owner first put it.

### 3D pages made for the buzzer (claude.ai artifacts, sources in `ai-docs/artifacts/`)

| Page | What it answers |
| --- | --- |
| [Buzzer, Straight to the Board](https://claude.ai/artifact/Jr2bSJtndwYhR1H5xbmxd2) | Does the module itself work? (yes) |
| [Find the 5 V](https://claude.ai/artifact/Wm53mCXzA14eaYvtgG6SgD) | Where the 5 V stops (VIN) |
| [VIN or VU](https://claude.ai/artifact/KSjaDit9K26vnimfEXa53W) | VU carries it (it clicked) |
| [Buzzer, Back in Place](https://claude.ai/artifact/XDmqoG4FhwWFVF1LoQmJ9a) | Put it all back, then the beep |
| [The Hiss Test](https://claude.ai/artifact/4auBFx4pdLSJ7Feh8dh5qF) | Transistor stuck on, or − grounded? (answer pending) |

Photos come in through **Bench Photos** (https://claude.ai/artifact/KAKPb1zWgcn6Tv6pjPx9fV).
The full technical handoff for Claude is `ai-docs/SESSION-HANDOFF.md`.

---

## At a glance

| Area | State | Evidence |
| --- | --- | --- |
| Backend API (FastAPI, SQLite) | ✅ Done | 145 tests passing, offline |
| Tunisian food table | ✅ Done | 18 dishes, every figure sourced and flagged as an estimate |
| Recogniser | 🟡 Stub | Interface done; the vision API is not chosen yet |
| Component request | ✅ Final sheet, to show the lab technician | Every line with what it is for and what would do instead; 90,400 TND to buy |
| Prototype simulation (`/prototype`) | ✅ Done | Every documented scenario driven in the browser |
| Architecture (`/project/architecture`) | ✅ Rebuilt | A playable system map and three drawings |
| 3D rig (`/rig`) | ✅ Rebuilt | 3 kg cell, six white LEDs, lens at 320 mm; four drawings computed from one dimension file |
| Docs site | ✅ Live | 16 pages, static, on Vercel |
| Firmware, Node A | 🚧 On the board | 0.3.5 on the NodeMCU as a pretend scale (0.3.6, one button, built); display and button work; buzzer being fixed |
| Firmware, Node B | 🚧 Written | Compiles; upload format checked against the backend; not on a board yet |
| Mobile app | 📋 Not started | — |
| Hardware | 🚧 Being wired | Parts in hand except the HX711; milestone 1 on the breadboard |

---

## 13 October 2026 — Architecture, rig and the request sheet rebuilt

The owner asked for the Architecture and rig pages redone with minimal text, "all in 3D
and SVGs", and for a final component request to show the lab technician.

- **Component request, final form.** One sheet: two drawings (what we are building,
  where each part goes), then all 32 lines with **what each is for** and **what would
  do instead**, a tick box per line, and print styles. The reasoning, prices and links
  moved to `/project/component-request/notes`.
- **Architecture.** One system map built from the request's own part drawings, with a
  player that steps through the eight stages of a capture. Then three drawings: who does
  what in order, why two boards, and what travels with the number.
- **Rig.** The 3D model now matches the design: the 3 kg cell on a proper mount with a
  stop screw, six white LEDs with a diffuser in place of the ring, the lens 320 mm above
  the plate. Every part is numbered; pick a number and the camera flies to it. Four
  drawings beside it: side view, plan, load path, and what the camera sees.
- **One dimension file** (`web/components/rig/specs.ts`) now drives the 3D model, the
  four drawings and the dimension table, so they cannot disagree.
- **Corrected along the way:** the capture order (tare the *empty* plate, then add the
  food); `index.md`, which still described the LED ring and the buck converter.
- **Notes for whoever continues**, human or AI, are in `ai-docs/`. Recorded as **D14**.

## 13 October 2026 — 3 kg load cell

The owner asked whether 1 kg was enough and wanted 2–3 kg, as precise as possible.

- **1 kg was not enough.** A 420 g ceramic plate plus a large meal goes past it.
- **The cell is now the 3 kg YZC-131**, Didactico, 13,000 TND, in stock. None of the
  three shops checked (Didactico, Tuni Smart, CoThings) lists a 2 kg cell; that would
  be an import.
- **Precision trade-off, stated on the site.** Errors scale with capacity:

  | Cell | Room for food on a 420 g plate | Readable | Absolute (spec) |
  | --- | ---: | ---: | ---: |
  | 1 kg | ~480 g | 0.1–0.2 g | 0.5–1 g |
  | 2 kg (import) | ~1.5 kg | 0.2–0.4 g | 1–2 g |
  | **3 kg** | **~2.5 kg** | **0.3–0.6 g** | **1.5–3 g** |

  Worst case, 3 g on 350 g of couscous is 5 kcal of 585, well inside the food table's
  own error.
- **Precision comes from method:** five-point calibration (100 g to 2 kg) with
  interpolation, tare before every capture, a proper mount with a stop screw, warm-up,
  median of 12 samples at 10 SPS. **Target ~1 g, to be measured.**
- Updated: component request, accuracy page, simulator (3 kg limit), home-page gauge,
  backend's over-range message, README, `index.md`. Recorded as **decision D13**.

## 12 October 2026 — Component request rebuilt, prototype finished

Work started in another account's session, which hit its usage limit mid-task, and
was resumed from its saved transcript.

### Component request (`/project/component-request`)

Rebuilt around what a faculty electronics lab already has:

- **Buy (7 lines, 90,400 TND):** ESP32-CAM, ESP32-CAM-MB programmer base, 3 kg load
  cell, HX711, SSD1306 OLED, 5 V / 2 A charger, 2 × 1000 µF capacitors. Each with a
  Tunisian shop price and link.
- **Borrow (15 lines):** DevKit (or 28,500 TND if the lab has none), buttons, buzzer,
  2N2222s, 1N4148, white LEDs, resistors, capacitors, cable, breadboard, headers,
  screws, microSD, USB cables.
- **Book (10 lines):** bench supply, multimeter, soldering station, calibration masses
  (physics lab — no Tunisian shop sells them), FabLab time, materials, camera arm,
  plate, laptop, phone hotspot.
- 44 SVG part drawings, a "what changed" table, arrival checks, and a hand-in table,
  all generated from one data file: `web/components/request/bom.ts`.

Design changes from the research (decision **D12**):

- **Lighting:** six white LEDs + a 2N2222 on **Node B GPIO 13** replace the WS2812B ring
  and its 74AHCT125 level shifter, which no Tunisian shop checked stocks. This also
  settled a contradiction between the wiring and architecture pages.
- **HX711 power:** Node A's 3V3 pin with 10 µF + 100 nF; its separate buck converter is
  dropped.
- **Programmer:** ESP32-CAM-MB base replaces the USB-to-TTL adapter (kept as backup).
- **Added:** 1N4148 across the buzzer coil, shielded cable for the load cell.
- **microSD** becomes borrowed and optional.
- Wiring, architecture, risks, firmware pages and README updated to match.

### Prototype (`/prototype`)

An in-browser simulation of the whole chain: 3D rig, Node A's display and buttons,
ESP-NOW hand-over, Node B's capture, the multipart upload, the backend's arithmetic
and the phone app. Backend logic is mirrored from `backend/app`; the food table is
copied by `npm run sync:foods` (`-- --check` fails when stale).

Driven end to end in the browser: normal capture, skipped tare, tare with food on,
unknown dish then manual entry, Wi-Fi loss then recovery from microSD, plate lifted
after tare, and a ceramic plate with the largest portion (logs normally on 3 kg).

### Earlier, same day

- Site redesigned around a sidebar shell and mobile drawer.
- `next lint` (removed in Next 16) replaced by a type-check.
- Launch config pointed at `web/` and `backend/`.

## 21 September 2026 — Foundations

- Backend: FastAPI + SQLite, local food table → USDA → fail loudly, `grams` validated
  hard, 145 tests with no network.
- Docs site ported from Astro to Next.js and moved to Vercel.
- To-scale 3D rig explorer with sourced dimensions.
- Repo reconstructed from the project brief; the original archive could not be found
  (decision D0).

---

## Next

1. **Confirm the request with the lab technician**, then order the buy list. Check
   each link first; prices and stock change.
2. **Ask Didactico for the YZC-131 3 kg datasheet** (creep, overload, combined error).
3. **Decide where the LEDs point** with a test photo: around the lens (as modelled) or
   at an angle (as the parts list suggests, against glare).
4. **Node A firmware:** HX711 reading, tare, median filter, OLED, buttons.
5. **Node B firmware:** ESP-NOW receive, light, capture, upload, microSD fallback.
6. **Choose the vision API** — see `/reference/vision-apis`.
7. **When hardware arrives:** five-point calibration, fill the tables on
   `/reference/accuracy`, and report the measured figure.

## Open questions

- **Original archive missing.** The BOM and wiring are reconstructions until diffed
  against the original workbook (D0).
- **Capture failures never reach the phone.** When the backend can't name a dish it
  answers the camera node, not the app. A "pending capture" record would fix it.
- **ESP-NOW and the hotspot's Wi-Fi channel** must match; a hotspot that changes
  channel silently cuts Node A off.
- **No CI.** Tests pass locally; nothing enforces it on push.
- **Unfinished research:** the mechanical-build report was cut off by the usage limit.
  The two that finished are kept in `ai-docs/research/`.
- **Unmeasured:** the size of the load cell and the field of view of the camera are
  seller and vendor figures. The rig is drawn from them and says so.

## Where things are written down

| What | Where |
| --- | --- |
| Every design decision, with reasoning | `docs/decisions.md` (D0–D14) |
| Notes for the next agent or person: handoff, runbook, project map | `ai-docs/` |
| Rig dimensions (single source) | `web/components/rig/specs.ts` |
| Parts list (single source) | `web/components/request/bom.ts` |
| Pin map and wiring | `/workbench/wire` |
| Accuracy claims and calibration | `/reference/accuracy` |
| Deliverable status | `/deliverables` |
