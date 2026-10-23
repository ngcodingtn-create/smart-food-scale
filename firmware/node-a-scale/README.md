# Node A, the scale

An ESP8266 NodeMCU with the HX711 and the load cell, the OLED, two buttons and the
buzzer. It weighs, and on **PHOTO** hands the grams to Node B over ESP-NOW.

The request asked for an ESP32 DevKit; the lab handed over a NodeMCU, and the firmware
was moved to it on 23 October 2026. It still builds for the ESP32 too, because the
Wokwi simulator has no ESP8266. The two differ only in the `#if defined(ESP8266)`
blocks of `main.cpp` (saving settings: EEPROM instead of Preferences; the radio:
the ESP8266's older ESP-NOW calls) and in `pins.h`, which carries both pin sets.

| File | What it is |
| --- | --- |
| `src/main.cpp` | The firmware |
| `include/config.h` | Its settings: sample counts, limits, timeouts |
| `include/pins.h` | The GPIOs. **Generated**: edit `web/components/workbench/wiring.ts`, then `npm run sync:wiring` in `web/` |
| `../shared/sfs_protocol.h` | The ESP-NOW frames, shared with Node B |
| `web/public/workbench/wokwi/node-a/` | The same firmware in one file, with a diagram, for the Wokwi simulator. **Generated** the same way, and served by the site |

## Build, flash, watch

PlatformIO, from this folder:

```bash
pio run
```

```bash
pio run -e node-a-nodemcu -t upload
```

```bash
pio device monitor
```

`node-a-nodemcu-sim` needs no HX711 or load cell: set the weight from the serial
console with `sim 143.2`.

```bash
pio run -e node-a-nodemcu-sim -t upload
```

| Build | Chip | For |
| --- | --- | --- |
| `node-a-nodemcu` | ESP8266 | The board in hand |
| `node-a-nodemcu-sim` | ESP8266 | The board in hand, before the HX711 |
| `node-a-scale` | ESP32 | An ESP32 DevKit, if one turns up |
| `node-a-sim` | ESP32 | Likewise; the Wokwi sketch is the same code |

All four compiled on 23 October 2026 (ESP8266 Arduino core from PlatformIO's
`espressif8266`, ESP32 Arduino core 2.0.17) with no warnings. None has run on a board
yet.

## Using it

1. Put the empty plate on. Press **TARE**. The display shows `0.0 g` and `TARE OK`.
2. Put the food on. The display shows the food alone.
3. Press **PHOTO**. It takes twelve fresh readings (about 1.2 s at 10 per second),
   keeps the median, and sends it to Node B. Two beeps and `SENT` mean Node B
   confirmed; one long low beep and `NO CAMERA` mean it did not.

Until it is calibrated, the display shows raw counts and `NOT CALIBRATED`, and PHOTO
refuses. That is deliberate: a number in grams from an uncalibrated cell would only
look right.

## Finding Node B

Node B joins the phone's hotspot and so listens on whatever channel the hotspot
chose. Node A does not join it. At start, and whenever a capture goes unanswered, it
sends a `Hello` on each channel from 1 to 13, last good channel first, until Node B
answers. The channel is saved on the board. The display's top line shows it:
`CAMERA ch 6`, or `CAMERA ?`.

## The serial line

115200 baud, one line per event, so a page on the site can read it over Web Serial.

**What it prints**

| Line | When |
| --- | --- |
| `R raw=<counts> net=<counts> g=<grams> stable=<0\|1>` | Every reading, about 10 a second. `g=nan` until calibrated |
| `E boot fw=<version> calibrated=<0\|1> cpg=<counts per gram>` | At start |
| `E tare offset=<counts>` | After a tare |
| `E capture g=<grams> median=<counts> samples=<12 counts>` | On PHOTO, with the readings behind the median |
| `E sent seq=<n> g=<grams> ok=<0\|1>` | Whether Node B confirmed |
| `E result seq=<n> outcome=saved\|queued\|failed` | Node B's report on the upload, later |
| `E link found ch=<n> mac=<address>`, `E link none`, `E link lost` | The search for Node B |
| `E warn not-tared`, `E error <reason>` | Problems: `overload`, `too-light`, `not-calibrated`, `no-display` |

**What it accepts**

| Command | Does |
| --- | --- |
| `tare` | The same as the TARE button |
| `capture` | The same as the PHOTO button |
| `cal <counts per gram>` | Sets the calibration and saves it on the board |
| `cal clear` | Forgets it |
| `info` | Prints the settings |
| `find` | Searches for Node B again |
| `sim <grams>` | The `node-a-sim` build only: sets the pretend weight |

Calibration is a straight line through zero: tare the empty plate, put known masses
on, read `net=` for each, and the slope is counts per gram. Decision D13 asks for five
masses across the range, then a check with masses not used to fit.
