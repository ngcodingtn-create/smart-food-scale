# Node B, the camera

AI-Thinker ESP32-CAM on its MB base, with the six white LEDs on GPIO 13 and a microSD
card. It waits for Node A, photographs the plate, and posts the photo with the grams to
the backend.

| File | What it is |
| --- | --- |
| `src/main.cpp` | The firmware |
| `include/config.h` | Its settings: photo size and quality, light timing, upload timeout |
| `include/camera_pins.h` | The camera's pins, fixed by the board |
| `include/pins.h` | The light's GPIO. **Generated**: edit `web/components/workbench/wiring.ts`, then `npm run sync:wiring` in `web/` |
| `include/secrets.example.h` | Optional compiled-in defaults. Copy to `secrets.h`, which git ignores |
| `../shared/sfs_protocol.h` | The ESP-NOW frames, shared with Node A |

## Build, flash, set up

PlatformIO, from this folder:

```bash
pio run
```

```bash
pio run -t upload
```

Or flash it from the site's **Flash it** page. Either way, set the Wi-Fi and the backend
once, from the site's **Test and calibrate** page or a serial monitor at 115200:

```
ssid My phone
pass the hotspot password
backend http://192.168.43.10:8000
wifi
```

They are saved on the board. Until the backend is hosted, its address is the laptop's
address on the hotspot, with the backend started on `--host 0.0.0.0`.

Built on 14 October 2026 (PlatformIO, ESP32 core 2.0.17, no warnings from our code).
The request it sends was checked against the running backend by a script that builds
the same bytes: `201` with and without a date, `422` for a mass under 0.5 g. The
firmware itself has not run on a board: there is no board yet.

## What it does with a capture

1. A `Capture` arrives from Node A. It answers `CaptureAck` at once, so Node A stops
   waiting. A repeat of the same capture (Node A missed the ack) is acked, not re-shot.
2. Light on, 300 ms to settle, two frames thrown away while the exposure catches up,
   one 800 × 600 JPEG, light off. The 300 ms and the two frames are starting values, to
   be tuned with a test photo on the rig.
3. `POST /meals`, multipart: `grams`, `eaten_on` once the clock is set from the
   network (UTC), and `image`.
4. The answer goes back to Node A as a `Result`:

| Backend says | Node B does | Node A shows |
| --- | --- | --- |
| `201` | Nothing more | `SAVED` |
| `422`, dish not identified | Nothing more: enter it in the app | `NOT RECOGNISED` |
| Another `4xx` | Nothing more: a retry would get the same answer | `UPLOAD FAILED` |
| No answer, or `5xx` | Keeps photo and grams on the card, sends them later | `QUEUED` |

Kept captures live in `/queue` on the card, one `.jpg` and one `.txt` each. While the
Wi-Fi is up, the oldest is retried every 15 seconds.

**https.** A backend on https needs the root certificate of its host in `secrets.h`
(`SFS_BACKEND_ROOT_CA`). Without one, Node B refuses https rather than send photos to a
server it cannot check.

## The serial line

**What it prints**

| Line | When |
| --- | --- |
| `E boot node=b fw=<version> psram=<0\|1> camera=<0\|1> card=<0\|1>` | At start |
| `E wifi up ch=<n> ip=<address>`, `E wifi down`, `E wifi not-set` | When the Wi-Fi changes |
| `E hello from=<address>` | Node A looked for it |
| `E capture seq=<n> g=<grams> from=<address>` | A capture from Node A; `repeat` if already taken |
| `E photo bytes=<n> ms=<n>` | The photo |
| `E upload g=<grams> status=<http status or -1> outcome=saved\|queued\|unknown\|failed` | How the upload went |
| `E flush id=<file> status=<n> done\|kept left=<n>` | A kept capture retried |
| `E error <reason>` | `camera-init`, `no-photo`, `backend-not-set`, `https-needs-root-ca`, … |

**What it accepts**

| Command | Does |
| --- | --- |
| `ssid <name>`, `pass <password>`, `backend <url>` | Saves the setting on the board. The password is never printed |
| `wifi` | Connects with the saved settings |
| `shoot <grams>` | A capture without Node A: light, photo, upload |
| `light on`, `light off` | The light alone |
| `flush` | Sends the oldest kept capture now |
| `info` | Prints the settings and state |
