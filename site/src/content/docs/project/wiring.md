---
title: Wiring & pin map
description: Full pin map for both nodes, and the pin conflicts that cost real time to work out.
sidebar:
  order: 3
---

:::caution[Reconstructed, not verified]
The original `IoT_Food_Tracker_Component_Request.xlsx` wiring sheet could not be found
on the build machine. This page was reconstructed from the project brief. **Diff it
against the original workbook** when someone locates it — see
[decision D0](/smart-food-scale/reference/decisions/).
:::

## Node A — ESP32 DevKit V1

| Signal | GPIO | Notes |
| --- | --- | --- |
| HX711 DT | 16 | ⚠️ see the WROVER warning below |
| HX711 SCK | 17 | ⚠️ see the WROVER warning below |
| OLED SDA | 21 | I²C |
| OLED SCL | 22 | I²C, SSD1306 at `0x3C` |
| Tare button | 18 | `INPUT_PULLUP` |
| Capture button | 19 | |
| Buzzer | 23 | Through a 2N2222/BC547 with a **1 kΩ base resistor** |
| WS2812B data | 5 | Through an **SN74AHCT125** level shifter, **330 Ω** series |

:::danger[If the board is a WROVER, not a WROOM-32]
**GPIO 16 and 17 are the PSRAM lines on a WROVER.** Move the HX711 to **GPIO 25/26**.

Check the shield on the module before wiring. This one silently half-works — the
board boots, the display runs, and the weight readings are garbage.
:::

## Node B — ESP32-CAM (AI-Thinker)

Almost every pin is spoken for. The forbidden list:

| Pins | Why |
| --- | --- |
| 0, 5, 18, 19, 21, 22, 23, 25, 26, 27, 32, 34, 35, 36, 39 | Camera bus |
| 16, 17 | PSRAM |
| 2, 14, 15 | microSD in 1-bit mode — DATA0, CLK, CMD |
| 4 | Flash LED |

With the microSD in 1-bit mode — `SD_MMC.begin("/sdcard", true)` — **only GPIO 4, 12
and 13 come free.**

:::danger[GPIO 12 is the MTDI strapping pin]
Never put a line that **idles high** on GPIO 12. The ESP32 samples it at boot to pick
the flash voltage; held high, the board fails to start. This is the kind of fault that
looks like a dead board.
:::

## Load cell → HX711

| Wire | Terminal |
| --- | --- |
| **Red** | E+ |
| **Black** | E− |
| **White** | A− |
| **Green** | A+ |

:::tip[Readings coming out negative?]
Swap **White** and **Green**. It's the expected first-boot symptom, not a fault.
:::

## Power discipline

The ESP32-CAM browns out if this is done casually, and a brownout mid-capture is a
corrupt frame and a lost weight reading.

- **5 V / 2 A** supply into the 5 V pin — 2 A minimum, not 1 A
- **470–1000 µF low-ESR** plus **100 nF** across the rail, as close to the board as
  physically possible
- **Thick, short cables**
- **No breadboard in the power path** — the contact resistance is enough on its own
- **HX711 on its own buck rail**, not shared with the camera

## HX711 configuration

| Setting | Value | Why |
| --- | --- | --- |
| Channel | A | The only one with gain 128 |
| Gain | 128 | Matches the load cell's mV/V output |
| Rate | **10 SPS** | 80 SPS is far noisier; we are weighing a stationary plate |
| Averaging | 10–16 samples | Median filter, not mean — rejects single-sample spikes |

See [Accuracy](/smart-food-scale/reference/accuracy/) for what this actually buys.
