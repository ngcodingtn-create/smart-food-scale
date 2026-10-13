# Smart Food Scale — IoT Component Request

**A connected kitchen scale that photographs a meal and returns its calories and
macronutrients to a phone app.**

University IoT team project. This page is both the project homepage and the
component request submitted to the faculty.

---

## The idea in one paragraph

Calorie-tracking apps that work from a single photo — Cal AI and its imitators — have
to guess how much food is on the plate. That guess is their dominant source of error:
a photo cannot tell a 90 g portion of couscous from a 160 g one, and granular foods
like rice only show their top surface. **This device removes the guess by weighing the
food.** A camera on a fixed arm answers *what* the dish is; a load cell under the plate
answers *how much* of it there is. Nutrients per 100 g are then multiplied by a
measured mass rather than an estimated one.

---

## Architecture

Two ESP32 nodes, talking over ESP-NOW (no router required):

```
   ┌────────────────────────┐         ESP-NOW        ┌────────────────────────┐
   │  Node A — SCALE        │ ─────────────────────► │  Node B — CAMERA       │
   │  ESP32 DevKit V1       │   "tared, 143.2 g,     │  ESP32-CAM (AI-Thinker)│
   │                        │    shoot now"          │                        │
   │  HX711 + 3 kg cell     │                        │  OV2640 @ SVGA         │
   │  SSD1306 OLED          │                        │  6 white LEDs, diffused│
   │  tare / capture btns   │                        │  microSD fallback      │
   │  buzzer                │                        │                        │
   └────────────────────────┘                        └───────────┬────────────┘
              master                                             │ Wi-Fi
                                                                 │ multipart POST
                                                                 │ (JPEG + grams)
                                                                 ▼
                                                     ┌────────────────────────┐
                                                     │  Backend (FastAPI)     │
                                                     │  identify → look up    │
                                                     │  → scale by mass       │
                                                     │  → persist             │
                                                     └───────────┬────────────┘
                                                                 │ HTTP
                                                                 ▼
                                                     ┌────────────────────────┐
                                                     │  React Native app      │
                                                     │  daily log · macros    │
                                                     └────────────────────────┘
```

**Why two boards.** The ESP32-CAM is pin-starved, and its 3.3 V rail sags when the
camera initialises while Wi-Fi is transmitting. Hanging the HX711 off the same board
causes brownout resets and weight readings that drift during the capture — exactly
when the reading matters. Splitting the roles costs one extra board and removes the
whole failure class.

---

## Essential bill of materials

A summary. The maintained request — three lists (buy, borrow, book), Tunisian prices and a
drawing of every part — is on the site:
<https://web-ivory-ten-26.vercel.app/project/component-request>. Its data file is
`web/components/request/bom.ts`.

| # | Component | Qty | Notes |
| --- | --- | --- | --- |
| 1 | ESP32 DevKit V1 (WROOM-32) | 1 | Node A. **WROOM**, not WROVER — see wiring note below |
| 2 | ESP32-CAM, AI-Thinker, with OV2640 | 1 | Node B |
| 3 | ESP32-CAM-MB programmer base | 1 | The ESP32-CAM has no USB; this is how it is flashed |
| 4 | Load cell, straight bar, 3 kg | 1 | Any plate plus the largest meal |
| 5 | HX711 24-bit ADC breakout | 1 | Channel A, gain 128, 10 SPS |
| 6 | SSD1306 OLED, 128×64, I²C | 1 | Address `0x3C` |
| 7 | Tactile push buttons | 2 | Tare and capture |
| 8 | Passive buzzer | 1 | Driven through a transistor, not straight off a GPIO |
| 9 | 2N2222 transistor | 2 | One switches the buzzer, one the lights |
| 10 | Resistors: 6 × 100 Ω, 470 Ω, 1 kΩ, 10 kΩ | 9 | One per LED; transistor bases |
| 11 | White LED, 5 mm | 6 | Light over the plate, behind a diffuser |
| 12 | 1N4148 diode | 1 | Across the buzzer coil |
| 13 | 5 V / 2 A power supply | 1 | **2 A minimum** — see power discipline below |
| 14 | Capacitor 1000 µF | 2 | At the ESP32-CAM’s 5 V pin, and where the supply splits |
| 15 | Capacitor 100 nF ceramic | 4 | Decoupling, close to each board |
| 16 | Capacitor 10 µF | 1 | At the HX711, which runs from Node A’s 3V3 pin |
| 17 | microSD card (optional) | 1 | Holds captures on Node B while Wi-Fi is down |
| 18 | Mounting hardware for the camera arm | 1 set | Fixed height above the plate |

An optional BOM (spare cells, a second camera, enclosure material) is kept in the
workbook rather than here.

📄 **[Full component request workbook](assets/IoT_Food_Tracker_Component_Request.xlsx)** —
five sheets: project brief, essential BOM, optional BOM, wiring and pin map, and
risks with software notes.

---

## Wiring, in short

**Node A — ESP32 DevKit V1**

| Signal | GPIO |
| --- | --- |
| HX711 DT | 16 |
| HX711 SCK | 17 |
| OLED SDA | 21 |
| OLED SCL | 22 |
| Tare button | 18 (`INPUT_PULLUP`) |
| Capture button | 19 |
| Buzzer | 23 (via transistor + 1 kΩ base) |
| HX711 VCC | 3V3 pin, with 10 µF + 100 nF |

⚠️ **If the board turns out to be a WROVER rather than a WROOM-32, GPIO 16/17 are the
PSRAM lines — move the HX711 to GPIO 25/26.**

**Node B — ESP32-CAM.** Almost everything is spoken for. Never use GPIO 0, 5, 18, 19,
21, 22, 23, 25, 26, 27, 32, 34, 35, 36 or 39 (camera bus), nor 16/17 (PSRAM). GPIO 4 is
the flash LED. With the microSD in 1-bit mode only **GPIO 4, 12 and 13** come free —
GPIO 2, 14 and 15 stay in use by the card. **GPIO 12 is the MTDI strapping pin: never
put a line that idles high on it.** GPIO 13 switches the light: six white LEDs through a
2N2222.

**Load cell → HX711.** Red = E+, Black = E−, White = A−, Green = A+. If readings come
out negative, swap White and Green.

Full detail, including the reasoning behind each conflict, is in
[docs/wiring.md](docs/wiring.md).

---

## Accuracy, honestly

Realistic load-cell performance is **~0.01–0.02 % of full scale** readable with
averaging, and **~0.05–0.1 % FS absolute** once creep and temperature drift are
included. On the 3 kg cell that is roughly:

- **0.3–0.6 g** readable
- **1.5–3 g** absolute, with about 1 g the target after five-point calibration

We do not claim better. The calibration procedure and a results table to fill in once
the hardware arrives live in [docs/calibration.md](docs/calibration.md).

---

## Known risks

| Risk | Mitigation |
| --- | --- |
| ESP32-CAM brownout during capture | 5 V / 2 A supply, 470–1000 µF + 100 nF across the rail, thick short cables, **no breadboard in the power path**, HX711 on Node A’s 3V3 pin and never on the camera’s rail |
| Campus Wi-Fi blocks the ESP32 | Captive portals block it outright. WPA2-Enterprise works but is fragile. Assume a phone hotspot or dedicated AP; SSID/password are configurable, never hard-coded |
| Nutrition API rate limits | USDA FoodData Central is free but capped at 1,000 requests/hour per key — results are cached on disk by `fdcId` |
| Tunisian dishes absent from every food database | We maintain our own food-composition table. See below |
| Load cell drift with temperature | Tare immediately before every capture, never once at boot |

---

## The part we think is actually original

Couscous, lablabi, brik, ojja and mloukhia are **not in USDA FoodData Central, not in
Nutritionix, and not in any commercial food-recognition API's label set.** A photo
recogniser trained on Western meals cannot name them, and a nutrient database built on
Western meals cannot cost them.

So we build our own small Tunisian food-composition table, and we drive dish
identification from *our* candidate list rather than a vendor's. Every entry carries
kcal, protein, carbohydrate and fat per 100 g, and a cited source — with estimated
figures flagged as estimates rather than quietly passed off as measurements.

This is treated as a first-class deliverable of the project, not an afterthought.

---

*Source: [github.com/ngcodingtn-create/smart-food-scale](https://github.com/ngcodingtn-create/smart-food-scale)*
