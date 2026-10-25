# Build plan: 25 and 26 October 2026

**Moved.** Written for 23 and 24 October; the HX711 could not be found on the 24th and
comes on **26 October**. Read "today" as 25 October and "tomorrow" as 26 October.
The app, the server and the scale's Wi-Fi setup are planned in [APP-PLAN.md](APP-PLAN.md).

**The real weight is now last** (asked 25 October). The HX711 sections below still hold,
but they run after everything else: the server, the app, pairing, the microSD and the
rig, all on the pretend scale and one button (click PHOTO, hold 5 s TARE). Whether to add
a second button is decided in milestone 9, with the HX711. The order is milestone 9 on `/admin/build`;
the stand-in is in [research/2026-10-25-simulating-the-weight.md](research/2026-10-25-simulating-the-weight.md).

Written 23 October 2026. The goal: by the evening of 24 October, **one whole meal
through the real hardware** — food weighed on the load cell, photographed by the
camera board, saved by the backend with its grams — on a calibrated scale.

Update this file as steps get done; move it to the work log when the build is finished.

## Where things stand

- **In hand** (photographed, `/workbench/parts`): ESP8266 NodeMCU (the scale's board,
  firmware moved to it), ESP32-CAM on its ESP32-CAM-MB base, load cell, OLED, one push
  button, passive buzzer module, 2 × 2N2222A, 1N4148, 6 white LEDs, resistors (6 × 100 Ω,
  470 Ω, 1 kΩ, 10 kΩ), electrolytics including a 100 µF 25 V, breadboard, 30 jumpers,
  2 USB cables.
- **Arriving 24 October** (the owner said so on 23 October): the **HX711**, the **second
  push button**, a **microSD card**.
- **Still missing after that**: 4 × 100 nF ceramics (the prototype runs without),
  2 × 1000 µF and the 5 V 2 A charger (final build only), a header strip if the HX711
  comes with loose pins. The French sheet for the lab is `/workbench/missing`.
- **Lab only**: multimeter and soldering iron. The faculty was closed on 23 October.

## Not part of these two days

Say so if asked; none of it blocks the hardware.

- **Dish recognition is the stub until the owner adds a Gemini key.** `GeminiRecogniser`
  is written and tested against a fake Gemini (23 October). To switch it on: in
  `backend/.env`, `SFS_RECOGNISER=gemini` and `SFS_GEMINI_API_KEY=<the owner's key>`
  (the owner types it; never in chat), restart the backend, then check with one photo:
  `.venv/Scripts/python.exe -m app.recognition.gemini photo.jpg` from `backend/`.
- **The backend runs on the laptop**, not a server. Hosting is researched
  ([research/2026-10-13-free-backend-hosting.md](research/2026-10-13-free-backend-hosting.md))
  and not done.
- **No mobile app.**
- **No rig**: the load cell needs two boards and screws to bend properly. Without them it
  can be tested clamped to a table edge, but not used for real meals.

## The load cell, emulated: how far it goes

Asked on 23 October: can the load cell be emulated by a script today, so that tomorrow it
is only plugged in? **Mostly yes, and it is already built; a reflash and a calibration
remain.**

- **The pretend-scale image** (`node-a-nodemcu-sim`) replaces one function of the
  firmware, `readCell()`, with a weight typed over USB. Everything above it is the real
  code: the history and medians, tare, the display, the buttons, the buzzer, the search
  for the camera, ESP-NOW, the photo, the upload, the result.
- **The whole-meal test** (Test and calibrate, added 23 October) is the script: it plays
  a plate of 420 g, TARE, 150 g of food, PHOTO, and checks every line the boards print, up
  to the backend's answer. Run it today until it passes; tomorrow the same chain runs with
  real grams.
- **What no emulation covers**, and tomorrow still needs: the HX711's eight wires, the
  load cell's sign (swap white and green if pressing it lowers the counts), the
  calibration with known masses (counts per gram depend on this cell and this HX711), and
  the mounting.
- **Tomorrow's reflash is one minute** on Flash it. An image that falls back to pretend
  weights when it finds no HX711 was considered and rejected: a loose wire would then
  produce invented weights that look real. Two images, each saying what it is, is safer.
- The pretend scale never saves a calibration, and the test never sends `cal` to a real
  board, so nothing from today can make tomorrow's scale read wrong. Accept the "erase"
  offer when flashing the real image anyway.

## What to have on the table today

| Thing | Why |
| --- | --- |
| NodeMCU, ESP32-CAM on its MB base | The two boards |
| Two USB data cables, and two free USB ports (or a phone charger for the camera) | Both boards on at once for the whole meal |
| Breadboard; the 10 female–male, 10 male–male, 10 female–female jumpers | The NodeMCU may not fit on the breadboard: female–male from its pins |
| OLED, the one push button, the buzzer module | Node A's front panel |
| Both 2N2222A, the 1N4148, 1 kΩ, 470 Ω, 10 kΩ, 6 × 100 Ω, 6 white LEDs, the 100 µF | Buzzer driver and the light |
| Laptop with Chrome or Edge; the backend's `.venv` | Flashing, the bench page, the backend |
| Phone with mobile data, hotspot on 2.4 GHz | The camera's network; Gemini needs internet through it |
| Optional: Gemini key in `backend/.env`, a food photo to test it | Real recognition |
| Optional: a kitchen scale | Weigh four or five household things today and label them: tomorrow's calibration masses, if the lab has none |

Not needed today: the HX711, the load cell (except to measure its screw holes), a
multimeter, a soldering iron.

Wiring notes from the owner's photos, also on Wire it: the buzzer module's pins are −,
an empty middle, and S, which is its +; the camera's pins are hidden inside the MB base,
so the light is wired with the camera on the breadboard, powered and read through four
jumpers from the base's sockets.

## Today, 23 October: everything that does not need the HX711

The NodeMCU runs the **pretend scale** today: the weight is typed on the Test and
calibrate page instead of measured. Everything else is real.

### The owner, with Claude at the laptop

The owner's hands do the plugging, wiring, pressing and looking, plus the hotspot, the
Wi-Fi password (typed once on the bench page) and the firewall's Allow. Claude flashes,
reads and tests the boards with `firmware/tools/board.py` (RUNBOOK, "Driving the boards").

| # | Step | Where | Done when |
| --- | --- | --- | --- |
| 1 | Plug in the NodeMCU with a data cable and say so. Claude finds the CH340 port (`board.py ports`); if none, the other cable, then WCH's CH340 driver | Laptop | Claude names the port |
| 2 | Claude flashes **The pretend scale** (`board.py flash node-a-nodemcu-sim`). The owner does nothing unless asked to hold FLASH and tap RST | Laptop | Claude reads `E boot node=a fw=0.3.1 … simulated=1` |
| 3 | Wire the rails, the display, the tare button (D5) and the buzzer with its transistor, diode and 1 kΩ. Skip the HX711 and load-cell lines | `/workbench/wire` | Ticks on Wire it |
| 4 | Claude runs the pretend meal (`board.py meal-test --no-camera`); the owner watches the display and listens | Laptop | The display shows the weight; tare zeroes it; the buzzer beeps; PHOTO says `NO CAMERA` (no camera yet) |
| 5 | Turn on the phone hotspot **on 2.4 GHz** (the ESP32-CAM cannot see 5 GHz; on an iPhone, "Maximise compatibility"). Join it with the laptop | Phone, laptop | Laptop online through the phone |
| 6 | Start the backend so the camera can reach it: the `backend-lan` configuration (or `--host 0.0.0.0`). Allow Python through Windows Firewall on private networks when asked. Note the laptop's address on the hotspot (`ipconfig`, Wi-Fi adapter, IPv4) | Laptop | `http://<that address>:8000/docs` opens from the phone's browser |
| 7 | The owner seats the ESP32-CAM on its MB base and plugs it in; Claude flashes **The camera** (`board.py flash node-b-camera`) | Laptop | `E boot node=b … camera=1` |
| 8 | Set hotspot name, password and backend `http://<address>:8000` | `/workbench/bench` | `Wi-Fi up` |
| 9 | Take a test photo with 150 g | `/workbench/bench` | `last upload: 150 g · saved by the backend · HTTP 201`, and the meal is in `/docs` → `GET /meals` |
| 10 | Wire the light: six LEDs with their 100 Ω, the second 2N2222A, 470 Ω and 10 kΩ on IO13 | `/workbench/wire` (Node B) | `Light on` lights all six |
| 11 | Both boards at once: NodeMCU on the laptop, camera on (Wi-Fi up). On Test and calibrate, connected to the NodeMCU: **Run the whole-meal test** | Both | All six steps ticked: the last says `saved` (or, with Gemini on and a photo of nothing, that the dish could not be named: the chain still works) |
| 12 | Mechanical, any time: measure the load cell's screw holes and send a close-up of its label; find two boards (base and top plate) and screws that fit | Home or hardware shop | Photo sent; screws in hand |

If something does not behave, copy the log from **Everything the board said** on the
bench page into the chat.

### Claude

| Step | State |
| --- | --- |
| Bench page: a pretend-weight box for a real board running the pretend scale, and a box for any command | Done 23 October (Node A 0.2.1 reports `simulated=1` in `info`) |
| `backend-lan` in `.claude/launch.json`: the backend on `0.0.0.0:8000`, reachable from the hotspot | Done 23 October |
| The whole-meal test on the bench page (tried in practice mode: steps 1–4 pass, 5 fails as it should with no camera) | Done 23 October |
| Wire it: the NodeMCU's width, the camera off its base for the light, the buzzer module's S pin | Done 23 October, from the photos; not tried on the parts |
| Answer the owner's logs through steps 1–11; fix what breaks | As it happens |
| `GeminiRecogniser`, tested against a fake Gemini | Done 23 October. Never called with a real key |

## Tomorrow, 24 October: the HX711, the second button, the microSD

### At the lab

1. If the HX711's pins are loose, **solder them** (4 on the GPIO side, 4 on the cell side).
2. **Multimeter**: the 2N2222A's legs (diode test, red on the middle leg, the slightly
   higher reading is the emitter); the buzzer between S and − (tens of ohms: a coil, keep
   the transistor; open: a piezo); VIN to G on the NodeMCU on USB.
3. Ask whether the lab lends **calibration masses** (100 g to 1 kg). If not, a kitchen
   scale to weigh a few household things, whose weights become the references.
4. If they have them: the 100 nF ceramics.

### Then

| # | Step | Done when |
| --- | --- | --- |
| 1 | Wire the HX711 (VCC 3V3, GND, DT D6, SCK D7) and the load cell's four wires (red E+, black E−, white A−, green A+), with the 100 µF across the HX711's VCC and GND | Ticks on Wire it |
| 2 | Second button on D3 (PHOTO) | Pressing it does what FLASH did |
| 3 | Flash **The scale** (the real build) | `E boot node=a fw=0.3.1 calibrated=0` and raw counts on the display |
| 4 | Press on the cell: counts should rise. If they fall, swap white and green | Counts rise under load |
| 5 | Mount the cell between base and top plate | Readings settle (`settled` on the bench page) |
| 6 | Calibrate: TARE empty, then three to five known masses, Save | `calibrated=1`; a known mass reads within a gram or two |
| 7 | microSD: format FAT32 on the laptop, insert in the ESP32-CAM, restart it | `card=1` in its boot line |
| 8 | Offline test: hotspot off, PHOTO, then hotspot on, `Send what is kept` | First `QUEUED`, then `saved` |
| 9 | Three real meals: plate, TARE, food, PHOTO | Three meals in the backend with real grams and photos |
| 10 | Record what was measured: load-cell dimensions and capacity in `web/components/rig/specs.ts`, the calibration results on `/reference/accuracy` | Real numbers replace the labelled estimates |

## Risks, and what to do

| Risk | Sign | What to do |
| --- | --- | --- |
| Laptop USB too weak for the camera | `Brownout detector was triggered`, resets during a photo | Shorter cable; the 100 µF across the camera's 5V and GND; another USB port; a phone charger |
| Hotspot on 5 GHz | Camera never says `Wi-Fi up` | Switch the hotspot to 2.4 GHz |
| Firewall blocks the backend | Phone cannot open `/docs`; uploads `no answer` | Allow Python on private networks; check the laptop's address again |
| Transistor legs reversed | Buzzer silent, or LEDs dim | Turn the transistor round, flat face the other way |
| Buzzer is a piezo, not a coil | Very faint click through the transistor | Tell Claude: drive it straight from D8 instead |
| NodeMCU does not start | Nothing on the display, no boot line | Something holds D3 low or D8 high at power-on: unplug the button and the buzzer line, retry |
| Camera not found by the scale | `CAMERA ?`, `link none` | Camera must be `Wi-Fi up` first; press Find camera |
| HX711 missing again tomorrow | — | Keep running the pretend scale; the rest is already proven |
