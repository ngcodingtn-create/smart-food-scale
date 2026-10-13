<!-- Research done in session 3 on 2026-10-13, at the owner's request: "research how to make me a
     perfect category in the sidebar with all the web tools available to help me build this project
     end to end ... with real wiring and simulation ... research first the online tools needed".
     A snapshot. The category itself is not built. -->

# Web tools for building the scale, and a sidebar category to hold them

Read and tested on 2026-10-13. Verification codes:

- **V**: I ran it today and saw the result.
- **O**: read on the tool's own page or repository today.
- **T**: third-party page or a search summary only. A lead, not a fact.
- **J**: my judgement. Not tested.

## What was actually run (V)

All of this was done in the browser on the production site's own address
(`https://web-ivory-ten-26.vercel.app`), with temporary frames that were removed
afterwards. Nothing on the site was changed.

- **Four tools load inside one of our pages**: Wokwi, Falstad CircuitJS, Expo Snack
  (given code in the address, no saved project) and Lopaka.
- **A real ESP32 firmware simulation ran inside our page.** A public Wokwi project with
  the same parts as Node A (ESP32 DevKit, HX711 with a load cell, SSD1306 OLED, a push
  button, using the same `HX711` and `Adafruit SSD1306` libraries as our
  `platformio.ini`) compiled, ran at about 100 % speed, lit the OLED and printed to the
  serial monitor.
- **The weight can be set by hand.** Clicking the load cell opens a "Pressure" slider in
  kilograms. At 0.27 kg the sketch printed `weight = 269.04761`.
- **Four tools refuse to be framed** (response headers): Hoppscotch, Google AI Studio,
  Tinkercad and Velxio. They can only be linked.

## The tools, by the stage of the build they serve

| Stage | Tool | What it does for this project | In our page? | Free limits | Code |
| --- | --- | --- | --- | --- | --- |
| Wiring | **Our own page** | Every wire, one at a time, from one source file | Native | n/a | J |
| Wiring | [`@wokwi/elements`](https://github.com/wokwi/wokwi-elements) | Realistic drawings of the DevKit, HX711, SSD1306, button, buzzer, LED, resistor, microSD as web components | Native (MIT) | None | O |
| Wiring | [Cirkit Designer](https://docs.cirkitdesigner.com/component/812a29fd-b61d-4d97-9f2d-cb04dd6ab76e/hx711) | Drag-and-drop wiring diagrams; its library has the HX711 and several ESP32-CAM boards | Link | Pricing not confirmed | T |
| Firmware simulation | **[Wokwi](https://wokwi.com)** | Runs the real Node A firmware against simulated parts | **Frame** | Unlimited public projects, Wi-Fi included; private projects, own libraries and the VS Code plug-in are paid | V, O |
| Circuit simulation | **[Falstad CircuitJS](https://www.falstad.com/circuit/)** | Proves the two transistor stages (LED driver, buzzer driver): currents, saturation | **Frame**, circuit carried in the address (`?ctz=`) | Free, GPL-2.0 | V, O |
| Whole-chain simulation | Our `/prototype` | Scale, camera, backend and phone together | Native | n/a | V (earlier) |
| OLED screens | [Lopaka](https://lopaka.app/) | Draw the 128×64 screens, export Adafruit GFX or U8g2 code | Frame | Open source (Apache-2.0); has paid plans, limits not read | V, O |
| Build | PlatformIO (already in `firmware/`) + [GitHub Actions](https://docs.github.com/en/billing/concepts/product-billing/github-actions) | Compile the firmware in the cloud on every push | n/a | Free for public repositories | O |
| Flash | **[ESP Web Tools](https://esphome.github.io/esp-web-tools/)** | An "Install" button on our own page writes the firmware over USB | Native (Apache-2.0) | None. Needs HTTPS (we have it) and a merged `.bin` | O |
| Bench and calibrate | **Web Serial API** | Our page reads the board's serial output: live weight, calibration wizard | Native | Chrome, Edge, Firefox 151+ on desktop; Chrome on Android 150+; never iPhone or Safari | T ([caniuse](https://caniuse.com/web-serial)) |
| Backend | FastAPI `/docs`, [Hoppscotch](https://hoppscotch.io/) | Send a photo and a weight by hand | Link | Free | J |
| Recognition | [Google AI Studio](https://aistudio.google.com/) | Try the dish prompt on real photos before writing code; make the API key | Link | Free tier (see the hosting report) | J |
| Backend, before hardware | **Our own "camera stand-in"** | A phone or laptop camera takes the photo, you type the weight, the real backend answers | Native | n/a | J |
| App | **[Expo Snack](https://snack.expo.dev/)** | The React Native app running in the browser and on a phone through Expo Go | **Frame**, code given inline | Free | V, O |
| Automated checks | [Wokwi CI](https://docs.wokwi.com/wokwi-ci/getting-started) | Scripted test: set the load, expect the serial line | n/a | 50 minutes per rolling 30 days; needs a token; scenarios are "alpha" | O |
| Mechanical | Tinkercad 3D, Onshape, boxes.py | Draw the arm and platform, generate laser-cut panels | Link | From memory, not checked today | J |

Details that matter for Wokwi ([HX711 part](https://docs.wokwi.com/parts/wokwi-hx711),
[SSD1306 part](https://docs.wokwi.com/parts/board-ssd1306),
[ESP32 guide](https://docs.wokwi.com/guides/esp32),
[Wi-Fi guide](https://docs.wokwi.com/guides/esp32-wifi),
[pricing](https://wokwi.com/pricing),
[libraries](https://docs.wokwi.com/guides/libraries),
[diagram format](https://docs.wokwi.com/diagram-format), all O):

- The simulated ESP32 joins a virtual network, `Wokwi-GUEST`, and can reach the
  internet over HTTP and HTTPS on the free plan. So a simulated board can post to our
  real hosted backend.
- A project is two text files we can keep in the repository: the sketch and
  `diagram.json` (parts, and connections written as `["part:pin", "part:pin", "colour"]`).
- Saving a project needs a Wokwi sign-in. Free projects are public.

## What no web tool can do

Say this plainly on the page; it is the honest edge of "simulate everything".

- **The ESP-NOW link between the two boards.** Wokwi's request for it has been open
  since 2022 and depends on running several boards at once, which is also still open
  ([#446](https://github.com/wokwi/wokwi-features/issues/446),
  [#186](https://github.com/wokwi/wokwi-features/issues/186), O).
- **The camera.** There is no ESP32-CAM among Wokwi's boards and the request is open
  ([#592](https://github.com/wokwi/wokwi-features/issues/592), O). No other simulator
  found does it.
- **Precision.** Wokwi's 5 kg cell gives raw readings from 0 to 2100, which is about
  2.4 g per step (O, and consistent with the 269.05 g reading above, V). The real HX711
  is thousands of times finer. Wokwi proves the logic (tare, median, display, buttons),
  never the accuracy.
- **Tinkercad Circuits has no ESP32** (T). **Velxio** is an open-source newcomer, but a
  reviewer's ESP32 builds failed in April 2026 (T,
  [CNX Software](https://www.cnx-software.com/2026/04/04/velxio-open-source-self-hosted-arduino-raspberry-pi-and-esp32-simulator/)).

So the chain is covered in three overlapping pieces, not one:

| Piece | Covered by |
| --- | --- |
| Node A firmware | Wokwi, for real |
| Node B's upload code (HTTPS, multipart, retry) | Wokwi on a plain ESP32 with a stored JPEG (J, not tried) |
| The photo and the answer | The camera stand-in page against the real backend |
| ESP-NOW, camera, light | The real boards only |
| All of it as behaviour | `/prototype` |

## The proposed category: "Workbench"

A new group in `web/lib/nav.ts`, after "The project". Each page is one stage, with the
tool inside the page where the table says it can be, and a "done when" check.

| # | Page | What is on it | Needs first |
| --- | --- | --- | --- |
| 1 | **Build map** | The whole path on one screen: stage, tool, check, state | Nothing |
| 2 | **Wire it** | Pick a board. One wire at a time: where from, where to, colour, why. Tick each off | Nothing |
| 3 | **Simulate it** | Wokwi with Node A; the two Falstad circuits; a link to `/prototype` | Node A firmware; the owner's Wokwi sign-in |
| 4 | **Flash it** | Install buttons for the test sketches and the final firmware | Firmware; a build in GitHub Actions |
| 5 | **Test each part** | Live serial readout; one small test per part (display, buttons, buzzer, load cell, camera, light) | Firmware; the parts |
| 6 | **Calibrate** | The five-point wizard from D13, reading the scale over USB, filling the accuracy tables | Firmware; the parts; masses |
| 7 | **Try the backend** | Camera stand-in: photo + typed weight, sent to the hosted backend | The hosted backend (see the hosting report) |
| 8 | **The app** | The app in a Snack, in the page and on a phone | The app |
| 9 | **Toolbox** | Every outside tool, what it is for, its limits | Nothing |

The existing "Wiring & pin map" page folds into "Wire it". "Prototype" stays where it is
and is linked from "Simulate it".

**One source for the wiring (J).** Today the pin map lives in prose tables on the wiring
page. Put it in one file (`wiring.ts`: each connection as part, pin, part, pin, colour,
note) and generate from it: the "Wire it" page, Wokwi's `diagram.json`, and the
firmware's pin header. Then the drawing, the simulation and the code cannot disagree.
This follows the project's rule about single sources of truth.

**What can be built now, with nothing else:** pages 1, 2 and 9, and the two Falstad
circuits on page 3. Everything else waits on firmware, the hosted backend, or parts.

## Only the owner can do

- Sign in to Wokwi once and save the Node A project, so the page has an address to
  frame. (An agent cannot create accounts.)
- Optionally, create a Wokwi CI token for the scripted tests.

## Not verified

- A simulated board in Wokwi posting to our backend. Documented, not tried.
- Web Serial and browser flashing with our actual boards, including the ESP32-CAM-MB's
  CH340. No hardware yet.
- A Wokwi frame that shows only the simulation. The frame shows Wokwi's whole editor.
- That the Snack preview runs at the size of a page column. The frame loaded and showed
  the code; the running preview was not looked at.
- Lopaka's and Cirkit Designer's free limits.
- The mechanical tools.
