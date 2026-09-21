# Smart Food Scale

A connected kitchen scale that photographs a meal and returns its calories and
macronutrients to a React Native app.

Apps like Cal AI estimate portion size from a single photo, and that estimate is
their dominant source of error. This device removes it by physically weighing the
food. **The camera answers _what_ the food is; the load cell answers _how much_ of
it there is.** Every design decision in this repo protects that split.

---

## Repository layout

```
smart-food-scale/
├── index.md                  GitHub Pages homepage (must stay at root)
├── README.md                 you are here
├── assets/                   generated BOM workbook, diagrams
├── tools/                    build_bom.py, add_dropdown.py — regenerate the workbook
├── docs/                     architecture, wiring, calibration, decisions
├── firmware/
│   ├── node-a-scale/         ESP32 DevKit V1 — load cell, OLED, buttons, buzzer
│   └── node-b-camera/        ESP32-CAM  — OV2640, LED ring, Wi-Fi upload
├── backend/                  FastAPI — recognition, nutrition lookup, meal store
└── app/                      React Native (Expo development build)
```

Both firmware projects are **PlatformIO**, not Arduino IDE — they build from the
command line, which is what makes them testable in CI and on a machine that has no
board attached.

---

## The two nodes, and why there are two

| | Node A — scale | Node B — camera |
| --- | --- | --- |
| Board | ESP32 DevKit V1 (WROOM-32) | ESP32-CAM (AI-Thinker) |
| Owns | Weight, local UI, capture trigger | JPEG capture, Wi-Fi upload |
| Peripherals | HX711 + 1 kg load cell, SSD1306 OLED, tare + capture buttons, buzzer | OV2640, WS2812B ring, microSD |
| Role | **Master** | Slave |

The ESP32-CAM is pin-starved, and its 3.3 V rail sags when the camera initialises
while Wi-Fi is transmitting. Hanging the HX711 off the same board causes brownout
resets and weight readings that drift during capture. Two boards is the fix.

**Capture sequence.** Node A tares → takes a median-filtered weight → commands Node B
over ESP-NOW → Node B shoots and POSTs `multipart/form-data` (JPEG + grams) to the
backend → backend identifies the dish, looks up nutrients per 100 g, multiplies by the
measured mass, persists the meal → app reads it back over HTTP.

ESP-NOW between the nodes needs no router. Only Node B needs Wi-Fi.

---

## Quick start

Nothing here requires the hardware. The backend and the app run standalone.

### Backend

```bash
cd backend
python -m venv .venv && .venv/Scripts/activate   # Windows; use source .venv/bin/activate elsewhere
pip install -r requirements.txt
pytest                                            # runs fully offline
uvicorn app.main:app --reload
```

Open <http://127.0.0.1:8000/docs> for the generated API reference.

### App

```bash
cd app
npm install
npx expo start
```

The backend URL is configurable in-app — it does **not** need a rebuild to repoint.

### Firmware

```bash
cd firmware/node-a-scale
cp include/secrets.example.h include/secrets.h    # then edit it; it is gitignored
pio run                                            # compiles without a board attached
```

Node A has a **simulation mode** (`SIMULATE_SCALE` in `include/config.h`) that fakes
weight readings, so the whole pipeline can be exercised on a bare DevKit before the
load cell arrives.

---

## Accuracy — what this scale can and cannot claim

Realistic load-cell performance is **~0.01–0.02 % of full scale** readable with
averaging, and **~0.05–0.1 % FS absolute** once creep and temperature drift are
included. On a 1 kg cell that is roughly **0.1–0.2 g readable, 0.5–1 g absolute**.

The HX711 runs at 10 SPS, channel A, gain 128, averaging 10–16 samples. Do not claim
better than the figures above. `docs/calibration.md` carries the measurement
procedure and an empty results table to fill in once the hardware exists.

---

## Documentation

| Document | What it covers |
| --- | --- |
| [docs/architecture.md](docs/architecture.md) | System diagram, capture sequence, data flow |
| [docs/wiring.md](docs/wiring.md) | Full pin map, pin conflicts, load-cell colour code |
| [docs/calibration.md](docs/calibration.md) | Calibration procedure and the honest accuracy table |
| [docs/setup.md](docs/setup.md) | Toolchain setup for all four sub-projects |
| [docs/decisions.md](docs/decisions.md) | Every judgement call made while building, with reasoning |

The Pages site is published from `index.md` at
<https://ngcodingtn-create.github.io/smart-food-scale/>.

---

## Project status

Hardware has been requested from the faculty and is **not in hand**. Everything in
this repo is therefore built and tested without it: the backend has an offline test
suite, the firmware compiles without a board, and Node A can fake its own weight
readings.

## Licence

Coursework project. No licence chosen yet — see `docs/decisions.md`.
