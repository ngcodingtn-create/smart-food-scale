# Simulating the weight until the HX711 goes in

Asked on 25 October: put the real weight last, and find the best way to stand in for
the HX711 and the load cell until then, with the parts in hand.

## The answer

**Keep the pretend scale, and make it behave like a real cell.** It is the only option
that runs on the owner's NodeMCU, needs no part and no wire, and exercises every line of
the firmware above the one function that reads the converter. Since 0.2.2 it:

- **lands like a plate**: a new weight overshoots about 16 % and settles within a gram in
  about 1.3 s (checked by stepping the same equations in Python for 420 g). Tare, the
  "steady" test, the photo's twelve readings and the whole-meal test now meet a weight
  that moves, as they will on the real cell. Both whole-meal tests wait 2.5 s before TARE.
  The spring and damping are chosen to look like a plate set down, not measured on our arm.
- **can be wired backwards**: `sim sign -1` makes the counts fall when weight goes on,
  which is what a load cell with its white and green swapped does. The sign check of the
  last milestone can be rehearsed.
- **can be calibrated, without keeping it**: `cal clear` leaves it uncalibrated, as a fresh
  real scale is; `board.py counts --grams <g>` and `cal <cpg>` then run the real
  calibration procedure. The pretend scale answers `E cal cpg=… saved=0` and keeps it in
  memory only, so nothing it does can be read by the real image later.

The rehearsal is milestone 4's third step (`/admin/build/m4-together/rehearse`).

**The real HX711 code** is the one part the pretend scale skips. It runs in Wokwi, which
has a virtual HX711 with a weight slider, on the ESP32 pins (`/workbench/simulate`). The
library is the same one the NodeMCU build uses.

## What was considered and set aside

| Option | Why not |
| --- | --- |
| Read the load cell on the NodeMCU's A0, without the HX711 | The cell gives about 1 mV per volt at full load (a seller's figure for the YZC-131, not measured): about 3.3 mV for 3 kg at 3.3 V. The NodeMCU's A0 steps by about 3.2 mV (10 bits over 0–3.3 V). The whole 3 kg would be one or two steps. |
| An image that falls back to the pretend weight when no HX711 answers | Rejected on 23 October: a loose wire would then show invented weights that look real. Two images, each saying what it is, stay. |
| The ESP32-CAM pretending to be an HX711 on two wires, so the real image runs | It is the camera; its free pins are taken by the light and the microSD; and answering the HX711's clock edges reliably needs timing an interrupt on it does not give. Much work, thrown away once the HX711 is wired. |
| A potentiometer on A0 as a weight knob | Not in the kit. It would only replace typing a number, which the laptop already does. |

## What no simulation covers

The HX711's eight wires, the cell's real sign, its real counts per gram, its noise and
creep, and the mounting. Those are milestone 9, the last one.
