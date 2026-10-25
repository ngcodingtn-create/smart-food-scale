# Firmware and connectivity: Wi-Fi setup, pairing, HTTPS, time, updates

Researched 25 October 2026 for [APP-PLAN.md](../APP-PLAN.md) ("The scale joins an account").
Node B: ESP32-CAM AI-Thinker, Arduino-ESP32 core 2.0.17, PlatformIO board `esp32cam`.
Node A: ESP8266 NodeMCU. Read first: `firmware/node-b-camera/src/main.cpp`, `include/config.h`,
`platformio.ini`, `firmware/shared/sfs_protocol.h`, `firmware/node-a-scale/src/main.cpp`.

Web search and fetch were down; sources were read with curl and openssl. Each fact is
**verified** (with its source) or **(K)**: general knowledge, to be checked on the board.

## What the code does today (verified, from the repo)

- Node B joins one Wi-Fi network set over serial (`ssid`, `pass`, `backend`), saved with
  `Preferences`; `WiFi.mode(WIFI_STA)`, sleep off, auto-reconnect on.
- After it connects it already calls `configTime(0, 0, "pool.ntp.org")` and sends
  `eaten_on` as a UTC date (main.cpp lines ~122 and ~134).
- Uploads are multipart `POST {backend}/meals`; the body and the camera frames are in PSRAM
  (`ps_malloc`, `CAMERA_FB_IN_PSRAM`, `fb_count = 2`). An `https` address needs
  `SFS_BACKEND_ROOT_CA` compiled in; without it Node B refuses `https`.
- Upload timeout 20 s (`kUploadTimeoutMs`); failures are kept on the microSD card under
  `/queue` and retried every 15 s.
- The ESP-NOW frame is 13 bytes, five kinds (Hello … Result). Node A finds Node B by
  sending Hello on each channel 1–13.
- Last build: Node B image 1,096,909 bytes of a 3,145,728-byte app partition (34.9 %),
  RAM 16 % (PlatformIO output, 23 October).

## 1. Wi-Fi setup: a captive portal on the camera

### Library: write our own small portal, not WiFiManager

| | Core `WebServer` + `DNSServer` (our own page) | tzapu WiFiManager |
| --- | --- | --- |
| Version | Part of core 2.0.17 | 2.0.17, released 2024-03-02 (registry.platformio.org API; `library.properties` on GitHub master) |
| ESP32 / ESP8266 | Yes | `architectures=esp8266,esp32`; README: "ESP32 support ( fairly stable )" |
| Up to 3 saved networks | Ours to store | **Not supported**: the README's to-do list has "[ ] add multiple sets of network credentials" (unchecked) |
| The pairing code field | A form field | `addParameter` (supported, README "Custom Parameters") |
| Telling Node A over ESP-NOW | Ours | Needs callbacks; the portal blocks unless `setConfigPortalBlocking(false)` |

**Recommendation:** our own portal, about one page of HTML and three routes, because the
3-network memory and the ESP-NOW status messages have to be ours either way. WiFiManager is
the fallback if time runs short: one network only, plus the code as a custom parameter.
Flash is not the constraint: 34.9 % used (verified above).

### How it works

1. **Saved networks:** `Preferences` namespace `sfs-net`, slots 0–2 (`ssid0`, `pass0` …).
   A new network replaces the oldest slot. Serial commands for the bench page:
   `net list`, `net add <ssid> <pass>`, `net forget <n>`, replacing `ssid`/`pass`.
2. **Connecting:** one `WiFi.scanNetworks()`, then try the saved networks that are visible,
   strongest first, 15 s each. (Core 2.0.17 also has `WiFiMulti` (K); our own loop keeps the
   timing and the status messages in our hands.)
3. **Entering setup mode**, three ways:
   - no network saved;
   - none of the saved networks connects within one round (about 45 s with 3 networks);
   - asked for: Node A, TARE and PHOTO held together for 3 s, sends a new `SetupRequest`
     frame; or the serial command `setup`.
   Not the MB base's IO0 button: on the AI-Thinker board GPIO 0 is the camera's clock, XCLK (K).
4. **The portal:** `WiFi.mode(WIFI_AP_STA)`, open access point `Balance-Setup-XXXX` (XXXX: the
   last two bytes of the camera's station MAC, in hex), `DNSServer` answering every name with
   192.168.4.1, and `WebServer` routes:
   - `/` the form: a list from one scan (with a "rescan" link), password, pairing code;
   - `/save` stores the network and the code, answers "Connecting… you can rejoin your Wi-Fi",
     then leaves setup mode;
   - phone captive-portal probes redirected to `/`: `/generate_204` (Android),
     `/hotspot-detect.html` (Apple), `/connecttest.txt` (Windows) (K).
   The portal closes after 5 minutes, then tries the saved networks again.
5. **An open access point** is a judgement for the prototype: it exists only in setup mode,
   for 5 minutes, and a stranger who joins it still cannot pair the scale without a code from
   the owner's account. A WPA2 password shown on Node A's display is the later improvement.

### ESP-NOW while the camera runs its access point

- Espressif (ESP-IDF v4.4.7 Wi-Fi guide, "Home Channel", **verified**): in station + access
  point mode the two must share one channel, and **the station's channel wins**: if the
  station connects elsewhere, the access point moves and announces it (Channel Switch
  Announcement).
- Espressif ESP-NOW reference (**verified**): a peer's `channel` of 0 means "the current
  channel"; ESP-NOW can be sent over the station or the access point interface.
- So: in setup mode, do not let the station roam. Scan once when the portal opens, and only
  connect after `/save`. Node A then finds the camera as it does today (Hello on each
  channel), since the camera answers Hello on whatever channel it is on. When the camera
  joins the home Wi-Fi, the channel changes and Node A's next capture says "link lost" and
  searches again: existing behaviour.

### A status frame for Node A's display

`sfs_protocol.h` gains two kinds, with no change to the 13-byte layout:

```
Status = 6        // B → A, on every state change and in reply to Hello
SetupRequest = 7  // A → B, TARE + PHOTO held 3 s
```

A `Status` frame carries the state in the existing `outcome` byte:
`0 online · 1 setup mode · 2 not paired · 3 no internet · 4 code expired · 5 server certificate rejected`.
Node A builds the network name itself from the sender's MAC, which it already has
(`Balance-Setup-` + its last two bytes), so no text crosses the radio. Both nodes are rebuilt
together, as the header already says.

## 2. Pairing: the code, the claim, the device key

1. The app asks the server for a code: 6 characters from an alphabet without look-alikes
   (no 0/O, 1/I/L), valid 15 minutes. (Server side: the backend research.)
2. The owner types it on the portal page; Node B saves it as `claim` in `Preferences`.
3. Online, Node B sends `POST {backend}/device/claim` with JSON `{code, hw_id, fw}`, where
   `hw_id` is the station MAC.
   - 200 `{device_id, device_key}`: both saved in `Preferences`, `claim` erased, state online.
   - 404/410 (unknown or expired code): state "code expired"; Wi-Fi kept; Node A says
     `CODE EXPIRED` / `NEW CODE IN APP`.
4. Every upload carries `X-Device-Key: <key>`. Queued captures on the card are sent with the
   key current at the time they are sent.
5. A 401 means the key was revoked (scale removed in the app): the key is erased, state
   "not paired", and Node A shows `PAIR IN APP`. Captures queue on the card meanwhile.
6. Reset: serial `forget` erases networks, key and code. A physical reset (both buttons held
   10 s at power-on) is a later convenience.
7. The key sits in flash in plain text: flash encryption is not enabled (K). The server stores
   only its hash, and the key can only post meals to one account. Acceptable for the
   prototype; said here so nobody assumes otherwise.

## 3. HTTPS to Vercel

### Which root the certificates end at (verified with openssl, 25 October 2026)

| Host | Chain |
| --- | --- |
| `web-ivory-ten-26.vercel.app` (any `*.vercel.app`) | `*.vercel.app` (until 27 Nov 2026) → Google Trust Services **WR1** (until 20 Feb 2029) → **GTS Root R1**, as sent cross-signed by **GlobalSign Root CA** (that copy until 28 Jan 2028) |
| `vercel.com` | Let's Encrypt **YR1** → ISRG **Root YR** → **ISRG Root X1** |

So Vercel issues from **both** Google Trust Services and Let's Encrypt. The backend's own
address will be a `*.vercel.app` name, but a custom domain or a change at Vercel could move
it to the other authority.

### What to compile in

- `WiFiClientSecure` in core 2.0.17 has `setCACert`, `setCACertBundle`, `setInsecure` and
  `setHandshakeTimeout` (**verified**, `libraries/WiFiClientSecure/src/WiFiClientSecure.h`
  at tag 2.0.17).
- **Recommendation:** one PEM string with three roots, **GTS Root R1** (the self-signed one),
  **GlobalSign Root CA** and **ISRG Root X1**, passed to `setCACert` through
  `SFS_BACKEND_ROOT_CA`. mbedTLS reads several certificates from one PEM (K); this covers both
  authorities Vercel uses today. A CA bundle (`setCACertBundle`) is the heavier alternative.
- Never `setInsecure`: the photos and the device key would go to anyone in the middle.
- **Expiry:** the self-signed GTS Root R1 runs to 2036 (K), well past this project. If the
  chain ever stops verifying, Node B keeps captures on the card and reports state 5 to
  Node A; a firmware update with a new root fixes it. That is the main argument for OTA
  (section 5).
- **Time and certificates:** mbedTLS may check certificate dates against the board's clock
  (K). NTP is already started on connect; the upload should wait for a set clock (year ≥ 2026)
  before its first `https` request, or the first upload after boot may fail. Check on the board.

### Memory, timeouts, size

- TLS needs a few tens of KB of internal RAM for the handshake (K). The frames and the
  upload body are already in PSRAM, so internal RAM is mostly free for TLS. Log
  `ESP.getFreeHeap()` before each upload in the first builds; an assumption to measure.
- `setHandshakeTimeout(15)` (seconds) and the existing 20 s HTTP timeout. A Vercel cold
  start plus a Gemini call must fit inside 20 s (the backend research covers Vercel's limits).
- Vercel's request-body limit (4.5 MB, from the hosting research): an 800 × 600 JPEG at
  quality 12 is far below it. Real sizes still unmeasured.

## 4. Time: when the meal was eaten

- NTP is already configured on connect (verified, main.cpp).
- **Problem:** `eaten_on` is the **UTC** date. Tunisia is UTC+1 all year (no daylight saving
  since 2009) (K), so a meal between midnight and 01:00 local time is dated the day before.
- **Fix:** send `eaten_at`, the full UTC timestamp, and let the server and app turn it into
  the user's local date with their time zone. The queue's `.txt` files get `eaten_at` too.
  Captures made before the clock is set send no time; the server uses its receive time and
  marks it (server side).

## 5. Firmware updates over the air: not this week

- The `esp32cam` board uses the `huge_app` table: **one** 3 MB app slot and no second slot
  (**verified**: `boards.txt` `esp32cam.build.partitions=huge_app`, `tools/partitions/huge_app.csv`
  at tag 2.0.17). OTA needs two slots.
- `min_spiffs` gives two 1.9 MB slots (`app0`/`app1` 0x1E0000 each, **verified**,
  `min_spiffs.csv`); today's 1.10 MB image fits, with room for the portal and TLS (K: their size).
  Both tables keep NVS at 0x9000, so saved settings may survive the switch (K).
- **Recommendation:** USB flashing from the site is enough while the boards sit on the bench.
  Add HTTP OTA (the scale asks the server for a newer version) once the camera is closed in
  its rig: the certificate argument above makes it worth having then.

## 6. What Node A's display says

The OLED at text size 1 holds about 21 characters per line (K). States, from the camera's
`Status` frames and Node A's own:

| Top line | Bottom line | When |
| --- | --- | --- |
| `CAMERA ?` | weight as now | camera not found (existing) |
| `CAMERA ch 6` | weight | camera online (existing) |
| `WIFI SETUP` | `Balance-Setup-1A2B` | camera in setup mode |
| `PAIR IN APP` | weight | camera online, not paired |
| `CODE EXPIRED` | `NEW CODE IN APP` | claim refused |
| `NO INTERNET` | weight | camera's Wi-Fi down: captures queue on the card |
| `SERVER CERT` | weight | TLS verification failed |

`SAVED`, `QUEUED`, `UPLOAD FAILED` and `NOT RECOGNISED` stay as they are. Node A's
ESP-NOW search is unchanged; it only handles two new kinds.

## 7. Firmware milestones, small and testable

Wokwi (verified, docs.wokwi.com/guides/esp32-wifi): an ESP32 can join the open
`Wokwi-GUEST` network and make HTTP and HTTPS requests; nothing on that page covers an
ESP32 running its own access point, and the wokwi-elements part list has no camera (checked
`src/index.ts`). So only the network and server logic can be simulated, with a plain-ESP32
build of Node B that skips the camera (a build flag, `SFS_NO_CAMERA`).

| # | Step | Test without hardware | Test on the bench |
| --- | --- | --- | --- |
| F1 | Protocol: `Status`, `SetupRequest`, the state codes; Node A shows them | Both builds compile; Node A's pretend scale on the bench page | Two boards: states appear on the OLED |
| F2 | 3 saved networks, the connect round, `net …` commands | Wokwi, plain ESP32 + `SFS_NO_CAMERA`, joins `Wokwi-GUEST` | Home Wi-Fi and the hotspot both saved; switch the hotspot off and on |
| F3 | The captive portal: AP+STA, DNS, form, scan, 5-minute window | Compile only (no access point in Wokwi) | A phone joins `Balance-Setup-XXXX`, the page opens, a network is saved |
| F4 | Node A asks for setup (TARE + PHOTO 3 s); status frames on change | Compile | Hold the buttons: the display says `WIFI SETUP` |
| F5 | HTTPS with the three-root PEM; wait for NTP; handshake timeout; heap logged | Wokwi: `GET` the deployed backend's `/health` over `https` | Same on the ESP32-CAM; log free heap during an upload |
| F6 | Claim with the code, device key saved, `X-Device-Key` on uploads, 401 handled | Wokwi against the deployed server's `/device/claim` (needs the backend milestone) | Pair from the app; remove the scale in the app → `PAIR IN APP` |
| F7 | `eaten_at` timestamps, also in the card queue | Wokwi: check the request body | A capture at a known time, queued then flushed |
| F8 | Later: `min_spiffs` partitions and HTTP OTA | Compile, size check | One update over Wi-Fi |

Each step ends with `publish_web.py`, so the Flash page always offers the current images.

## Open points to check on the board

- Whether the first `https` upload after boot fails before NTP sets the clock.
- Free internal heap during a TLS upload with two PSRAM frame buffers.
- Which phones open the captive page by themselves (Android and iPhone behave differently (K)).
- Real JPEG sizes at SVGA, quality 12.
