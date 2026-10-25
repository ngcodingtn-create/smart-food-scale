# Hardware build guide: from an empty desk to a calibrated scale and a lit camera

Research for the build companion in /admin. Written 25 October 2026 for a visual
beginner, with the owner's real parts (`web/components/workbench/kit.ts` ids) and the
wiring in `web/components/workbench/wiring.ts` (wire ids). Nothing here was tried on the
parts yet.

**Fact marks.** (V) verified on the page linked; (K) general knowledge, not checked in
this session; (P) a proposal from this project (rig geometry in `rig/specs.ts`), not a
measurement. WebSearch and WebFetch were broken; pages were read with curl.

Sources read:
- RNT, ESP8266 + HX711: <https://randomnerdtutorials.com/esp8266-load-cell-hx711/> (V):
  wire colours "usually" red E+, black E−, white A−, green A+; plates fixed "to create a
  strain between the opposite ends of the metal bar", bottom plate holds the cell, top
  plate carries the load; calibration with an object weighed on a kitchen scale; and,
  by chance, the same pins as ours: DT on GPIO 12 (D6), CLK on GPIO 13 (D7).
- SparkFun, HX711 hookup guide:
  <https://learn.sparkfun.com/tutorials/load-cell-amplifier-hx711-breakout-hookup-guide>
  (V): "there isn't a set color coded standard" for load-sensor wires. So the colours
  above are the usual case, and the sign check (step 4.5) is what settles it.
- SparkFun, getting started with load cells:
  <https://learn.sparkfun.com/tutorials/getting-started-with-load-cells/all> (V): a bar
  cell measures bending, two gauges in compression and two in tension.

## Stage 0 · Desk, safety, the parts

**0.1 Set up the desk** · parts: none
- Actions: clear, dry, non-metal surface; laptop with Chrome or Edge; the two USB data
  cables (`usb-cable`); a small tray for resistors and loose parts; good light.
- Check: both cables at hand, the bench page opens.
- Failures: a charge-only cable (no port appears in step 1.2: try the other cable).
- Visual: `usb-cable.jpg`, `breadboard.jpg`; a desk layout drawing (laptop, breadboard,
  NodeMCU to the left, camera to the right).
- Safety (K): unplug USB before moving any wire; never join the 3V3 and 5 V rails; a part
  that gets hot means unplug at once.

**0.2 Name every part** · all kit ids
- Actions: lay the parts out; tap each photo hotspot and find the real one.
- Check: every card on Our parts has its part on the desk.
- Visual: one hotspot photo per part, all on the owner's photos:
  `devkit.jpg` (NodeMCU: D1, D2, D3, D5, D6, D7, D8, 3V, G, VIN, USB socket, FLASH and RST
  buttons, the "ESP8266MOD" can), `esp32-cam.jpg` (5V, GND, IO13, the flash LED, microSD
  slot, lens), `esp32-cam-mb.jpg` (IO0, RST, USB), `oled.jpg` (VCC, GND, SCL, SDA),
  `buzzer.jpg` (−, middle, S, the moulded +), `transistor-face.jpg` (the flat face, E B C),
  `diode.jpg` (the black band), `led-white.jpg` (long leg = +), `resistor.jpg` (the
  labelled strips), `cap-100u.jpg` (the stripe = −), `load-cell.jpg` (four wires, the blue
  connector), `breadboard.jpg` (rails, centre gap), `jumpers-mf.jpg`.

## Stage 1 · Breadboard, NodeMCU, power

**1.1 How a breadboard connects** · `breadboard`
- Actions: none to build; learn: each short row of 5 holes is one connection; the long
  side rails run the length (on some boards they break in the middle: check with the
  photo); nothing crosses the centre gap. (K)
- Check: the owner can point at two holes that are joined and two that are not.
- Visual: an interactive SVG breadboard: tap a hole, its whole strip lights up.
  `breadboard.jpg` with the rails and gap marked.

**1.2 NodeMCU off the board, on USB** · `devkit`, `usb-cable`, `breadboard` jumpers M-F
- Actions: the LoLin-style board is wide; if it covers every hole beside its pins, keep
  it off the breadboard and wire it with female–male jumpers (10 needed, 10 in hand).
  Plug USB.
- Check: a new COM port (CH340) appears on Flash it.
- Failures: no port: charge-only cable; CH340 driver missing (WCH driver) (K).
- Visual: `devkit.jpg` with the 10 used pins marked; an animation of a female end going
  onto a pin.
- Uncertain: the LoLin V3 pin-row spacing (K, said to be 1.1 in): the owner's own board on
  the breadboard settles it in ten seconds.

**1.3 Flash the pretend scale** · `devkit`
- Actions: Flash it → "The pretend scale".
- Check: serial `E boot node=a fw=0.2.1 … simulated=1`.
- Failures: will not connect: hold FLASH, tap RST, release FLASH; wrong port chosen.
- Visual: the Flash button live in the step; `devkit.jpg` hotspots on FLASH and RST.

**1.4 The three rails** · wires `a-3v3`, `a-gnd`, `a-5v`
- Actions: 3V (the one between D4 and G) → + rail on one side (3V3); G → − rail; VIN →
  the other side's + rail (5 V). Mark the rails with tape: "3V3", "5V".
- Check: the board still boots with the rails attached; nothing warm.
- Failures: board dead → a rail shorted to another: unplug, remove the three wires,
  re-check; 5 V rail joined to 3V3.
- Visual: StepWiring with those three wires lit; red/black colours.

## Stage 2 · Node A's front panel (pretend weight)

**2.1 The display** · `oled`; wires `a-oled-vcc`, `a-oled-gnd`, `a-oled-scl`, `a-oled-sda`
- Actions: VCC → 3V3 rail, GND → GND rail, SCL → D1, SDA → D2 (module order VCC, GND,
  SCL, SDA, from its photo).
- Check: the display shows a weight (pretend) and the bottom line READY.
- Failures: `E error no-display`: SCL/SDA swapped; a loose jumper; address 0x3D instead
  of 0x3C (firmware change needed); VCC/GND reversed (unplug at once).
- Visual: `oled.jpg` hotspots; StepWiring with the four wires.

**2.2 The tare button** · `push-button`; wires `a-tare`, `a-tare-gnd`
- Actions: button across the centre gap; one leg → D5; the diagonally opposite leg → GND.
- Check: press → serial `E tare offset=…`, display `TARE OK`.
- Failures: always "pressed": two legs on the same side used (they are already joined);
  nothing: legs not across the gap.
- Visual: an animation of the 4-leg button showing which legs are joined inside.

**2.3 The buzzer driver** · `buzzer`, `transistor`, `diode`, `resistor` (1 kΩ); wires
`a-buz-base`, `a-buz-emitter`, `a-buz-collector`, `a-buz-supply`, `a-buz-diode`
- Actions: transistor flat face towards you, legs E B C (K: usual for 2N2222A in TO-92;
  some makers reverse the outer two). D8 → 1 kΩ → B; E → GND; module S → 5 V rail;
  module − → C; middle pin empty; 1N4148 across − and S, band towards S.
- Check: TARE → a short beep (2700 Hz in config.h).
- Failures: silent: transistor reversed (turn it round), S/− swapped, buzzer is a piezo
  (faint click; then drive from D8 directly — ask Claude); the board no longer boots:
  something holds D8 high; diode backwards: shorts the buzzer (silent, transistor warm).
- Visual: `transistor-face.jpg` E B C hotspots, `buzzer.jpg` (−, middle, S, +),
  `diode.jpg` band; StepWiring with the five wires; a current-flow animation.

**2.4 PHOTO for now** · `devkit`
- Actions: none: the board's own FLASH button is on D3 = PHOTO until the second button.
- Check: FLASH → `E capture g=…` then `NO CAMERA` and the low error beep.
- Failures: pressed during power-up → the board enters flashing mode (re-plug).
- Visual: `devkit.jpg` hotspot on FLASH.

**2.5 The front panel works** · bench page
- Actions: set the pretend weight 150 g, TARE, PHOTO.
- Check: the whole-meal test passes steps 1–4.
- Visual: the bench page embedded.

## Stage 3 · Node B, the camera

**3.1 Flash the camera on its base** · `esp32-cam`, `esp32-cam-mb`
- Actions: seat the camera on the MB (photo shows the right way round); USB; Flash it →
  "The camera".
- Check: `E boot node=b … psram=1 camera=1`.
- Failures: will not connect: hold IO0, tap RST, release IO0; `camera=0`: the ribbon
  cable unseated; brownout resets: another USB port, a shorter cable.
- Visual: `esp32-cam-mb.jpg` with IO0/RST; `esp32-cam.jpg` ribbon latch.

**3.2 The network** · phone, laptop
- Actions: hotspot on 2.4 GHz; laptop joins; backend with `backend-lan`; allow Python in
  the firewall (private network); note the laptop's IPv4.
- Check: `http://<laptop>:8000/docs` opens on the phone.
- Failures: 5 GHz hotspot; firewall; the laptop on another network.
- Visual: a network diagram (phone, laptop, camera on one hotspot).

**3.3 The camera online** · bench page
- Actions: hotspot name, password, backend `http://<ip>:8000`.
- Check: `Wi-Fi up`; a test photo of 150 g → `saved`, HTTP 201; the meal in `/docs`.
- Failures: `queued`: backend address or firewall; `Wi-Fi down`: password, 5 GHz.

**3.4 The camera onto the breadboard** · `esp32-cam`, `esp32-cam-mb`, jumpers M-M
- Actions: note the camera's orientation on the MB; lift it off; across the centre gap;
  four male–male jumpers from the MB's empty sockets to the camera's pins of the same
  name: 5V, GND, U0R, U0T.
- Check: the boot line still on the bench page; `Wi-Fi up` again.
- Failures: nothing on the serial line: U0R/U0T crossed (each goes to the same name, the
  MB already crosses them) (K); resets: power through the breadboard (add the 100 µF).
- Visual: a two-frame animation, camera on MB → camera on breadboard with 4 jumpers.
- **Gap:** wiring.ts has no wires for this MB-as-power arrangement (`b-5v`/`b-gnd` assume
  a supply lead). Add four wires (e.g. `b-mb-5v`, `b-mb-gnd`, `b-mb-rx`, `b-mb-tx`) before
  the step page draws them.

**3.5 The light** · `led-white` ×6, `resistor` (6×100 Ω, 470 Ω, 10 kΩ), `transistor`;
wires `b-light-base`, `b-light-pulldown`, `b-light-emitter`, `b-light-leds`,
`b-light-collector`
- Actions: IO13 → 470 Ω → B; 10 kΩ B → GND; E → GND; six times 5 V → 100 Ω → LED long
  leg; all short legs → C.
- Check: `light on` lights all six, `light off` puts them out; one at a time first.
- Failures: one dark: that LED reversed; all dark: transistor reversed or IO12 used by
  mistake; board will not start: something on IO12 (K, the flash-voltage strap).
- Visual: `led-white.jpg` long leg; StepWiring building up one LED branch at a time.

**3.6 The 100 µF on the camera** · `cap-10u` (the 100 µF) — optional now
- Actions: across the camera's 5V and GND, stripe to GND.
- Check: photos without resets.
- Visual: `cap-100u.jpg` stripe hotspot.

**3.7 Both boards, one meal** · bench page
- Check: the whole-meal test: all six steps ticked, the last `saved`.
- Failures: `CAMERA ?`: camera not yet `Wi-Fi up`; press Find camera.

## Stage 4 · The HX711 and the load cell (26 October)

**4.1 Solder the HX711's pins** (at the lab) · `hx711`, `header-pins`
- Actions: pins short side into the board, breadboard holds them straight; heat pad and
  pin together, then solder; shiny cone joints. (K)
- Check: every pin firm, no bridge between neighbours.
- Failures: a bridge (two pins joined); a cold joint (dull, cracked).
- Visual: the HX711 photo (taken tomorrow) with E+ E− A− A+ / GND DT SCK VCC hotspots;
  a good/bad joint drawing.

**4.2 HX711 to the NodeMCU** · wires `a-hx-vcc`, `a-hx-gnd`, `a-hx-dt`, `a-hx-sck`,
`a-hx-caps`
- Actions: VCC → 3V3 rail (not 5 V), GND → GND, DT → D6, SCK → D7; the 100 µF across VCC
  and GND at the module, stripe to GND.
- Check: after step 4.4, raw counts on the display.

**4.3 The cell's four wires** · `load-cell`; wires `a-cell-red/black/white/green`
- Actions: red E+, black E−, white A−, green A+ (usual colours, (V) RNT; no standard,
  (V) SparkFun). B− and B+ stay empty.
- Visual: `load-cell.jpg` wire hotspots; StepWiring with the four coloured wires.

**4.4 Flash the real scale** · Flash it → "The scale", accept erase.
- Check: `E boot node=a … calibrated=0`, raw counts that change when the bar is pressed.
- Failures: counts stuck: DT/SCK swapped; `0` or `-1` always: HX711 not powered.

**4.5 The sign check**
- Actions: press the free end of the bar.
- Check: counts rise. If they fall, swap white and green.

**4.6 The second button** · `push-button`; wires `a-capture`, `a-capture-gnd`
- Actions: D3 and the diagonal leg to GND.
- Check: it does what FLASH did.

## Stage 5 · Mounting the bar

**5.1 Read the cell** · `load-cell`
- Actions: find the capacity label and the arrow on the side (K: the arrow shows the
  direction of the load); measure the screw holes (bom.ts: sellers give M4, (P)).
- Check: capacity known (the firmware assumes 3 kg; change config.h if different).

**5.2 Fix it between two plates**
- Actions: one end bolted to the base through a spacer, the other end to the platform
  through a spacer, so the middle of the bar floats ((V) RNT: opposite ends). Screws only
  through the end holes; nothing presses on the white-coated gauge area; the arrow
  pointing down, the way the food pushes (K).
- Check: tap the platform: the reading moves and returns to its value.
- Failures: reading does not return: something rubs (cable, platform edge); reading jumps
  when touching the table: the base is not rigid.
- Visual: an exploded SVG (base, spacer, bar, spacer, platform) with the bending
  animated; the 3D rig on /rig.

**5.3 An overload stop** (K, (P) "stop screw" in specs.ts)
- Actions: a screw under the free end leaves a small gap, so a dropped plate cannot bend
  the bar too far. Set the gap by trial: it must not touch under the heaviest plate.

## Stage 6 · Calibration

**6.1 Settle and tare**
- Actions: power on a few minutes before calibrating (K); empty platform; TARE.
**6.2 Known masses** · bench page
- Actions: three to five masses across the range: lab masses, or household things
  weighed on a kitchen scale ((V) RNT does exactly this with a glass of water); record
  each on the bench page; Save.
- Check: `calibrated=1`; each mass, put back, reads close to its value.
- Failures: readings drift: warm-up, air currents, a cable pulling the platform.
- Visual: the bench page's fit chart.
**6.3 Write the results down**
- The real readings go on `/reference/accuracy`; the cell's dimensions into `specs.ts`.

## Stage 7 · The camera above the plate

**7.1 Arm and focus**
- Actions: the lens about 320 mm above the plate surface ((P) `CLEARANCE` in specs.ts);
  test photos; turn the lens to focus (K: the OV2640 lens screws in and out).
- Check: the whole plate in frame, sharp.
**7.2 The light's angle**
- Actions: LEDs around the lens behind a diffuser, or at an angle (open question in the
  handoff); test photos of a glazed plate decide.

## Stage 8 · Standing alone

**8.1 microSD** · `microsd`
- Actions: FAT32 on the laptop (K: cards up to 32 GB are sold FAT32); into the camera;
  restart.
- Check: `card=1`; hotspot off → PHOTO → `QUEUED`; hotspot on → `Send what is kept` → saved.
**8.2 Power without the laptop** · `charger` (missing), `cap-1000u` ×2 (missing)
- Actions: 5 V 2 A supply, one lead to each board joined only at the supply, 1000 µF at
  the camera's 5V pin and at the split; no breadboard in the camera's supply; wires
  `a-supply`, `a-supply-gnd`, `b-5v`, `b-gnd`, `b-bulk`, `b-split`.
- Check: photos without resets for a run of meals.
**8.3 An enclosure**
- Options: cardboard first (fast, to find the layout); MDF or plywood cut at the FabLab;
  3D-printed boxes. Keep the USB sockets reachable, the display and buttons on the front,
  cables tied so they do not pull the platform. (K)

## Visuals the companion needs

| Visual | Source |
| --- | --- |
| Hotspots on 13 owner photos | listed in 0.2; HX711, microSD and second button photos still to take |
| StepWiring: board drawings with only a step's wires lit | `boards.tsx` + wire ids above |
| Breadboard strip explorer | new SVG |
| Button legs, LED legs, transistor E B C, diode band | owner photos + small SVGs |
| Camera MB → breadboard | new two-frame SVG; needs the 4 wires added to wiring.ts |
| Bar mounting, exploded and bending | new SVG; the 3D rig exists on /rig |
| Expected output | serial lines from the firmware READMEs |

## Open points found while writing

- wiring.ts lacks the camera-on-breadboard power and serial jumpers (step 3.4).
- The cell's capacity is unknown; `kCellCapacityG` is 3000 in config.h.
- The 2N2222A leg order (K) is still to be checked with the lab multimeter (4.1 visit).
