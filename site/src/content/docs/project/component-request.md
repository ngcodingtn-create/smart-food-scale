---
title: Component request
description: The bill of materials submitted to the faculty.
sidebar:
  order: 1
---

:::caution[Reconstructed]
The original five-sheet workbook could not be found on the build machine; this BOM was
rebuilt from the project brief. Quantities should be treated as a reconstruction until
diffed against the original — [decision D0](/smart-food-scale/reference/decisions/).
:::

## Essential

| # | Component | Qty | Notes |
| --- | --- | :---: | --- |
| 1 | ESP32 DevKit V1 (WROOM-32) | 1 | Node A. **WROOM**, not WROVER — [see why](/smart-food-scale/project/wiring/) |
| 2 | ESP32-CAM, AI-Thinker, OV2640 | 1 | Node B |
| 3 | USB-to-TTL programmer (CP2102 / FTDI) | 1 | ESP32-CAM has no USB; required to flash it |
| 4 | Load cell, straight bar, 1 kg | 1 | Full scale sized to a plate of food |
| 5 | HX711 24-bit ADC breakout | 1 | Channel A, gain 128, 10 SPS |
| 6 | SSD1306 OLED, 128×64, I²C | 1 | Address `0x3C` |
| 7 | Tactile push buttons | 2 | Tare and capture |
| 8 | Passive buzzer | 1 | Through a transistor, not off a GPIO |
| 9 | 2N2222 or BC547 transistor | 1 | Buzzer driver |
| 10 | Resistors: 1 kΩ, 330 Ω | 1 each | Transistor base; WS2812B data series |
| 11 | WS2812B LED ring (12 or 16 px) | 1 | Controlled lighting over the plate |
| 12 | SN74AHCT125 level shifter | 1 | 3.3 V → 5 V for WS2812B data |
| 13 | **5 V / 2 A** power supply | 1 | 2 A minimum — see power discipline |
| 14 | Capacitor 470–1000 µF, low ESR | 1 | Across the ESP32-CAM 5 V rail |
| 15 | Capacitor 100 nF ceramic | 2 | Decoupling, close to each board |
| 16 | Buck converter (5 V → 3.3 V) | 1 | Dedicated rail for the HX711 |
| 17 | microSD card, 4–8 GB | 1 | Upload fallback buffer on Node B |
| 18 | Camera arm mounting hardware | 1 set | Fixed height above the plate |

## Why each of the less obvious ones

**USB-to-TTL programmer (#3).** The ESP32-CAM has no USB port. Without this the board
cannot be flashed at all — it is not optional.

**SN74AHCT125 level shifter (#12).** WS2812B data expects a 5 V logic level. Driving
it from a 3.3 V ESP32 pin works *sometimes*, which is worse than not working: it
passes on the bench and fails in the demo.

**Separate buck converter (#16).** Keeping the HX711 off the camera's rail is the
single most important power decision in the build. Shared, the camera's inrush shows
up as weight noise.

**470–1000 µF capacitor (#14).** The ESP32-CAM draws a large current step when the
camera initialises while Wi-Fi is transmitting. Without bulk capacitance close to the
board, the rail sags and the board resets.

**1 kg load cell (#4), not 5 kg.** Accuracy is a percentage of **full scale**, so a
cell rated far above the load you actually weigh throws away resolution. A plate of
food is comfortably under 1 kg.

## Optional / nice to have

| Component | Why |
| --- | --- |
| Spare load cell | The most fragile part; over-loading one bends it permanently |
| Spare ESP32-CAM | The most brownout-prone part |
| Enclosure material (acrylic / 3D print) | Presentation, and keeping the cell square |
| Bench power supply | Diagnosing brownouts without guessing |
| Calibration masses (100 g, 200 g, 500 g) | Required for the calibration procedure |

:::tip[Calibration masses are not optional in practice]
The [accuracy claims](/smart-food-scale/reference/accuracy/) cannot be verified
without known masses. Kitchen items are not accurate enough to calibrate against.
:::
