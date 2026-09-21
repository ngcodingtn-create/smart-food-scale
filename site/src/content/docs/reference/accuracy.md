---
title: Accuracy & calibration
description: What this scale can honestly claim, and the procedure to verify it.
sidebar:
  order: 2
---

## What we claim

Realistic load-cell performance:

| | Of full scale | On a 1 kg cell |
| --- | --- | --- |
| **Readable** (with averaging) | 0.01–0.02 % FS | **0.1–0.2 g** |
| **Absolute** (incl. creep + temperature drift) | 0.05–0.1 % FS | **0.5–1 g** |

**We do not claim better than this.** The gap between the two rows is the interesting
part: "readable" is what the display can resolve, "absolute" is how close it is to
truth once the cell has been sitting under a warm plate for a minute.

## Why the distinction matters

A scale that *displays* 0.1 g and is *accurate* to 1 g will show a stable, precise,
wrong number. That is the same failure mode as a photo-estimating app showing
"247 kcal" — precision that implies an accuracy it does not have.

For food logging the absolute figure is what matters, and **0.5–1 g on a 350 g plate
is ~0.2 % error** — against the 20–30 % a photo-only estimate can carry.

## Reading configuration

| Setting | Value | Why |
| --- | --- | --- |
| Channel | A | Only channel with gain 128 |
| Gain | 128 | Matches the cell's mV/V output |
| Sample rate | **10 SPS** | 80 SPS is far noisier; the plate is stationary |
| Averaging | 10–16 samples | **Median**, not mean — rejects single-sample spikes |
| Tare | Before **every** capture | Never once at boot — the cell drifts |

## Calibration procedure

Needs known masses. Kitchen items are not accurate enough.

1. Power the scale and let it **warm up for 10 minutes**. Drift is worst in the first
   few minutes.
2. With nothing on the pan, record the raw HX711 reading — this is `offset`.
3. Place a known mass (500 g is a good choice on a 1 kg cell) and record the raw
   reading.
4. `scale = (raw_loaded − offset) / known_mass_g`
5. Store `offset` and `scale` in NVS so they survive a reboot.
6. Verify with a **different** mass than you calibrated with. Calibrating and
   verifying on the same mass proves nothing.

## Results table

To be filled in once the hardware is in hand. **Empty on purpose** — inventing these
numbers would be exactly the dishonesty this project is built against.

### Linearity

| Known mass (g) | Reading 1 | Reading 2 | Reading 3 | Mean | Error (g) | Error (% FS) |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 0 | | | | | | |
| 100 | | | | | | |
| 200 | | | | | | |
| 500 | | | | | | |
| 1000 | | | | | | |

### Repeatability

Same mass, removed and replaced 10 times.

| Trial | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Reading (g) | | | | | | | | | | |

Standard deviation: ____ g

### Creep

Leave a 500 g mass in place and read at intervals.

| Elapsed | 0 s | 30 s | 1 min | 5 min | 10 min | 30 min |
| --- | --- | --- | --- | --- | --- | --- |
| Reading (g) | | | | | | |

Total drift: ____ g

### Temperature

| Ambient (°C) | Zero offset | Reading at 500 g |
| ---: | ---: | ---: |
| | | |

## How to report this

State **both** figures, and say which one the app displays. If the measured absolute
error comes out worse than 1 g, report the measured number — not the spec.
