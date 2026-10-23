# Progress

Where the Smart Food Scale project stands, what changed recently, and what is next.
Nothing is marked done unless it has been run. Newest work first.

**Live site:** https://web-ivory-ten-26.vercel.app (deploys on every push to `main`)
**Last updated:** 13 October 2026

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
| Firmware, Node A | 🚧 Written | Compiles; runs in the Wokwi simulator; not on a board yet |
| Firmware, Node B | 🚧 Written | Compiles; upload format checked against the backend; not on a board yet |
| Mobile app | 📋 Not started | — |
| Hardware | 📋 Not ordered | Waiting on the component request |

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
