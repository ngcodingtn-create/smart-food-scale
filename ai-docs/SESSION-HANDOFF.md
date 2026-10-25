# Session handoff

**Written:** 25 October 2026, evening, Tunis time, at the end of the long session that built
`/admin` and the build companion, by an account about to hit its usage limit. **The next
session is another Claude account on the same machine and the same folder.** Read this whole
file before doing anything. History is in [WORK-LOG.md](WORK-LOG.md) (newest at the end); how
to run things is in [RUNBOOK.md](RUNBOOK.md); where things are is in
[PROJECT-MAP.md](PROJECT-MAP.md). **Rewrite this file when you stop.**

The full transcript of this session is on disk:
`C:\Users\ouede\.claude\projects\D--smart-food-scale\daa36be0-6861-4d52-b4b3-5c4f4544efc5.jsonl`
(subagents under the folder of the same name). Read it only for a detail this file lacks; the
owner's own messages are the `type:"user"` lines. Mine it with Python run as `python -I`, after
`sys.stdout.reconfigure(encoding='utf-8')`.

---

## 0. Latest (second account, 25 Oct, night): read this first

- **Section 5.A is done** (commit `5de43de`). The close-ups were checked frame by frame by
  rendering them to PNG sheets offline (see "Checking scenes offline" below). The ESP32-CAM
  is redrawn from the owner's photo (27 × 40.5 mm, microSD slot at the top under the lens);
  at that length it covers breadboard rows 1–14, so in the light's example the transistor
  moved to rows 19–21 and the LEDs to 15–26. Fixed too: camera onto its base, microSD,
  hotspot tag, pin labels at the frame's edge, the power step's tag.
- **Ticks are saved to a file** (commit `801cb91`): `web/data/progress.json`, through
  `/admin/api/progress` (`web/lib/progress-file.ts`, `web/components/admin/saved.ts`). The
  owner asked for it after their ticks vanished. Read it to see where the owner is. On load,
  the file and the browser are merged; a tick rewrites the whole key, so **do not edit the
  file while the owner has a build page open** (their next tick overwrites it). Commit it
  when you stop.
- **Firmware 0.3.2** (commit `d72ce14`): `E error no-display` now really appears with no
  display (the old check could never fail). Flashed to the NodeMCU, images published.
- **Step 1.3 rails: done and checked.** The owner wired 3V, G and VIN; `listen --reset`
  showed the boot line and steady 0.0 g. **Next: step 1.4, the display.** Before it, the
  board says `E error no-display`; after it, that line must be gone.
- Signing in: the owner types the admin password in the browser pane. Minting a cookie
  from `.env.local` was refused by the safety classifier; do not try again.
- Checking scenes offline: a script in the session scratchpad (`frames.mjs`) loaded the
  scene modules with `jiti`, rendered frames with `react-dom/server` and rasterised them
  with `sharp` (both in `web/node_modules`). Recreate it if needed; it is faster and more
  reliable than seeking scenes in the hidden browser pane.
- Not done: the HX711 is drawn as a generic module; redraw it from a photo when it arrives.
- **Bench Photos** artifact, for the owner to send photos of the bench:
  <https://claude.ai/artifact/KAKPb1zWgcn6Tv6pjPx9fV> (source `ai-docs/artifacts/bench-photos.html`,
  capabilities `db` + `assets`). Each photo is a doc in collection `photos`
  `{asset, step, stepTitle, note, at, status: new|seen|answered, reply}`. To look: `ArtifactData`
  list `photos`, then `Artifact` read with `path` = the asset id, then Read the saved image.
  To answer: `ArtifactData` update with `status: "answered"` and `reply` (pin `if_version`).
  It belongs to the second account; another account must recreate it.
- **Display Fix** (<https://claude.ai/artifact/9mw8eKFAWRwLkZuSTf4pMT>, source
  `ai-docs/artifacts/display-fix.src.html`, the published file `display-fix.html` embeds the
  photo): the answer to the owner's first bench photos, a 2.5D stepper of their real bench.
  **Found from the photos:** the display's pins were bare (not connected), and the owner keeps
  the NodeMCU **upside down, pins up** to plug F-M jumpers on. Then its rows swap sides: USB
  toward you, the row next to the breadboard is D0…3V from the far end, the outer row A0…VIN.
  The site's close-ups (`closeup.tsx`) draw it face up; **redraw them upside down** to match.

---

## 0b. Later the same night: the display step, live

- **The owner is on step 1.4, the display.** Their bench: NodeMCU **upside down, pins up, USB
  away**; display in the breadboard turned round (from the far end: SDA, SCL, GND, VCC); 3V and
  G taken from the **outer** row (pins 10 and 11 from the far end), VIN the outer row's last pin;
  yellows on D1 and D2 (2nd and 3rd pins of the row next to the breadboard).
- **Latest reading (firmware 0.3.5):** `sda_pullup=1 scl_pullup=1 sda_ground=0 scl_ground=0
  found=none`: both signal wires reach a powered display but **nothing answers**. Suspects, in
  order: the display's GND row not reaching ground; a yellow in the VCC row or on the + rail
  (also reads high); a damaged display. Ask for a photo straight down on the display's rows.
- **Wire it, live** (`/admin/wire`, `components/admin/build/LiveWire.tsx`, `lib/board.ts`,
  `app/admin/api/board/route.ts`): milestone 1 end to end with the board read live by the
  laptop's server through `board.py`. Laptop only. It holds COM5 while open on the display or
  button step: **close that tab before running board.py yourself.**
- Firmware commands added: `i2c` (0.3.3, ground flags 0.3.5), `button`, `beep` (0.3.4).
- The wiring close-ups now draw the NodeMCU upside down (`NodeMCUBack` in `closeup.tsx`);
  pins are described as "Nth pin from the far end".
- Lessons: a `board.py send` can hang if the USB is jostled and keeps COM5; killing it was
  refused by the safety classifier, so ask the owner to unplug and replug. "No USB board" after
  a replug was a plug not fully in.
- Artifacts: Display Fix (SCL checks, 2.5D) and Bench Photos (the owner's photos; answered
  through ArtifactData). Both in this second account.
- **Next fix proposed (not yet done by the owner):** take the breadboard out of the display's
  path: four female–female jumpers, display VCC → 6th pin (3V), GND → 7th (G), SCL → 2nd (D1),
  SDA → 3rd (D2), all on the D row (next to the breadboard), counted from the far end. Shown in
  3D in **Display, Four Wires** (<https://claude.ai/artifact/Ape5eHUNFwnXMfbNmTy84M>, source
  `ai-docs/artifacts/display-four-wires.html`, three.js r128 + OrbitControls 0.128).

## 1. Where things are, right now

### The physical build (the owner is mid-step)

- **The owner is at milestone 1, step 3, "Power rails"** (`/admin/build/m1-scale-brain/rails`).
  They said they did not know what to do there, which is why the close-ups (section 4) were
  built. They have not said "rails done" yet.
- **Steps 1.1 and 1.2 are done**, by Claude, on the real board:
  - Windows saw the NodeMCU's CH340 (`USB\VID_1A86&PID_7523`) with no driver. The owner
    installed WCH's `CH341SER.EXE` from <https://www.wch-ic.com/downloads/CH341SER_EXE.html>.
  - `board.py ports` → `COM5	CH340	USB-SERIAL CH340 (COM5)`.
  - Flashed `node-a-nodemcu-sim` (ESP8266EX, MAC `dc:4f:22:42:db:16`, hash verified).
  - Its first lines, firmware 0.3.1: `E boot node=a fw=0.3.1 calibrated=1 cpg=100.000000
    simulated=1`, `E tare offset=84001`, `E link none`. `sim 150` read `150.0 g`, steady; set
    back to `sim 0`.
  - The owner ticks each step's checks on the page (localStorage in their browser; Claude cannot
    tick them). They may not have ticked 1.1 and 1.2 yet.
- **Parts in hand**: NodeMCU (ESP8266, "LoLin V3" layout), ESP32-CAM on its ESP32-CAM-MB base,
  SSD1306 OLED, one 12 mm push button, passive buzzer module (pins −, empty, S), two 2N2222A,
  a 1N4148, resistors, 6 white LEDs, a 10 µF, breadboard and jumpers (M-M, F-M, F-F), the load
  cell (3 kg YZC-131, 4 wires, no HX711 on it), USB cables. Photos on `/admin/parts` and in
  `web/public/workbench/kit/`; data in `web/components/workbench/kit.ts`.
- **Missing**: the **HX711** (it was expected 26 Oct; the plan now puts the real weight
  **last**, milestone 9), the 100 nF ceramics (unconfirmed), 2 × 1000 µF (final build only),
  a microSD (milestone 8). A second push button is now **optional** (the one-button design).

### The code

- Branch `main`; the tree is committed **locally**. To see what is committed but not yet on
  production: `git log origin/main..main --oneline`. At hand-off that is `9fb1167` (firmware
  0.3.1, board.py fixes) and the close-up commit made at the end of this session. Production is
  at `10fafa2` (every step animated).
- **Never push unless the owner says "push" / "push to prod".** Pushing `main` deploys to
  Vercel production, <https://web-ivory-ten-26.vercel.app>. Check the deploy with
  `curl -s https://api.github.com/repos/ngcodingtn-create/smart-food-scale/commits/<sha>/status`
  (context `Vercel`; wait for `success`). Neither `gh` nor the Vercel CLI is installed.
- `/admin` on **production** stays locked until the owner adds `SFS_ADMIN_PASSWORD` in Vercel
  (website project → Settings → Environment Variables, then redeploy). Offered several times,
  not done. Changing Vercel settings needs the owner's explicit yes. Locally the password is in
  `web/.env.local` (git-ignored). Never print it in the chat.

### Localhost

- The dev server ran in a Terminal tab of the Claude app called **"site (localhost:3000)"**
  (`npm run dev` in `D:\smart-food-scale\web`). A new account will not have that tab: check
  `http://localhost:3000` first; if nothing answers, start it in a terminal tab
  (`mcp__terminal__run_in_terminal`), not as a preview process: the app stops preview
  processes at the end of a turn, which the owner disliked ("make sure localhost is always
  running").
- `.claude/launch.json`: `web` **attaches** to `http://localhost:3000` (starts nothing),
  `web-start` starts one, `backend` and `backend-lan` start FastAPI on port 8000.
- **Exactly one Next dev server.** Next refuses a second in the same folder. Never kill a PID
  taken from a stale lock file without checking what it is.

---

## 2. The owner, and how they want to work

Observed over many sessions; treat these as standing instructions.

- **A beginner and a visual learner.** Every step must be *shown*: their own photos, SVG,
  animation, close-ups. Long text gets cut. French when it is for the lab technician or a shop.
- **Claude does everything that is not physical.** Asked explicitly on 25 Oct: "I just plug the
  node and you do all yourself". The owner plugs in, wires, presses, looks, turns on the phone
  hotspot, types the Wi-Fi password once, clicks Allow on the firewall prompt, places weights,
  solders at the lab. Claude finds ports, flashes, reads first lines, sends commands, runs tests
  and calibrates from the laptop with `firmware/tools/board.py`. Every step page says
  "You do" / "Claude does, from the laptop".
- **Secrets**: the Wi-Fi password is typed by the owner on the bench page, never sent by Claude
  (`board.py` refuses `pass …`). API keys never go in the chat: the owner puts them in
  `backend/.env`. The admin password stays out of code and chat.
- **Short bursts, mid-turn messages.** New requests often arrive while you work. Finish what is
  in flight, fold the new one in, say so.
- **"push to prod"** is how they ask for a deploy. Wait for it every time.
- **Several Claude accounts**, resumed from transcripts and this file. Leave the tree committed
  and this file current, every time you stop.
- When they say they are lost ("I don't know what to do here"), answer with a closer, more
  literal visual of exactly what their hands do, not with more text.

---

## 3. The machine and its quirks

- Windows 11, Git Bash and PowerShell. Node 24, Python 3.14, Next.js **16.3.5** (Turbopack,
  App Router). Read `web/AGENTS.md` and `web/node_modules/next/dist/docs/` before writing
  Next-specific code: `proxy.ts` replaces middleware; `params`, `searchParams`, `cookies()` are
  async.
- PlatformIO and pyserial live in `firmware/.venv` (`firmware/.venv/Scripts/pio.exe`,
  `firmware/.venv/Scripts/python`). The backend's venv is `backend/.venv`.
- **Subagents**: in this account, `Agent` with the default, opus or sonnet types failed with
  `model_not_found`; only `subagent_type: "fork"` worked. Try the normal ones in your account.
  Spawn subagents only when the owner asks.
- **WebSearch / WebFetch** failed here ("model aipilot-fast"); `curl` and the built-in browser
  worked.
- **Bash heredocs with quotes or backticks** sometimes break. Write a Python script with the
  Write tool into the scratchpad and run it with `python -I`. Many files are CRLF: keep their
  line endings (read with `newline=''`).
- **The built-in browser pane is usually hidden.** `requestAnimationFrame` then runs at about
  10 frames a second and the scenes' IntersectionObserver may think they are off screen (the
  animation sits on its first frame). To check a scene, seek it by script, then zoom:
  ```js
  window.__seekIn = (fig, v) => { const el = document.querySelectorAll('.step-scene')[fig].querySelector('.step-scene-scrub'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(el, String(v)); el.dispatchEvent(new Event('input', { bubbles: true })); document.querySelectorAll('.step-scene')[fig].querySelector('.step-scene-stage').scrollIntoView({ behavior: 'instant' }); return el.max; };
  ```
  Figure 0 is the step's overview scene, figure 1 its close-up; the return value is the length
  in seconds. Screenshots of the 1024 px page come back cropped at 800 px: use `computer` →
  `zoom` on the region `[262, 20, 800, 380]`.
- Two console errors on admin pages (a 404, and "Encountered a script tag") are stale noise from
  earlier tabs; a fresh tab has none.

---

## 4. What exists (built 23 to 25 October)

### /admin, the builder's area

- Route groups: `web/app/(site)/` public, `web/app/admin/(locked)/` behind the password. Login
  in `web/app/admin/login/`, actions in `web/app/admin/actions.ts` (0.9 s delay on a wrong
  password), cookie `sfs_admin` (HMAC, 7 days) checked in `web/proxy.ts` and again in the
  locked layout (`web/lib/admin-auth.ts`).
- Sidebar, `web/lib/admin-nav.ts`: The plan, Build map, **Every step, animated**, Our parts,
  then the ten milestones with done/total badges.
- `/admin/plan` from `web/components/admin/plan.ts` (days: today 25 Oct, tomorrow 26 Oct,
  "Last: the real weight"; "you" and "claude" task lists), drawn by `PlanBoard.tsx`.
- `/admin/parts`: the kit cards from `web/components/workbench/kit.ts`.

### The build companion, /admin/build

- **Source of truth: `web/components/admin/roadmap.ts`.** Milestones 0–9; each step has `id,
  title, goal, parts, partGroups, wires {node, ids}, photo (hotspots), actions (You do), claude
  (Claude does), expect (serial, display or page), checks, trouble, tool, draft`.
- Order (changed 25 Oct; the owner wants the HX711 **last**): 0 Know the parts · 1 The scale's
  brain · 2 The camera online · 3 The light · 4 Both boards together (with "Rehearse the real
  weight on the pretend one") · 5 The server online · 6 The app · 7 The scale joins your
  account · 8 Finished scale (microSD, power, rig) · **9 Real weight** (headers, HX711, cell
  wires, "One button or two", flash the real scale, sign, mount, calibrate, accuracy, demo).
- Written in full: M0 (6 steps), M1 (7), M2 (4 of 5), the M4 rehearsal. The rest are drafts
  (title, goal, sometimes You do / Claude does). Fill them from
  `ai-docs/research/2026-10-25-*.md` as the build reaches them.
- Pages: `/admin/build` (overall progress, milestone stepper, map), `/admin/build/[milestone]`,
  `/admin/build/[milestone]/[step]`. A step page shows, in order: the step stepper, the
  animated scene, the close-up, then photo hotspots or the wiring drawing, parts as large photo
  cards, You do / Claude does, what you should see, checks, trouble, the flash button or bench
  page as a do-it-yourself fallback, and a sticky footer (← → keys work). Components live in
  `web/components/admin/build/`. Progress is kept in localStorage (`sfs-build-checks-v1`,
  `sfs-wired-v1`, `sfs-admin-plan-ticks`).

### Every step animated

- `web/components/admin/build/scenes/`:
  - `iso.tsx`: the isometric projection `P(x, y, z)`, `Slab`, `Cyl`, `OnTop`, `OnFront`,
    `OnSide`; timing helpers `k`, `ke`, `during`, `Drop`, `Appear`.
  - `parts.tsx`: the owner's parts in 2.5D (Laptop, NodeMCU, Camera, Breadboard, Display,
    Button, Buzzer, Transistor, Led, LoadCell, HX711, Rig, Plate, Phone, Charger, SDCard, Wire,
    Waves, Finger, Label, Tag, Chart and more).
  - `bench-scenes.tsx`, `world-scenes.tsx`: 22 kinds of scene (layout, meet, plug, flash, wire,
    hold, pretend-meal, hotspot, server, wifi, portal, photo, move, radio, meal, graph, cloud,
    app, card, power, rig, solder).
  - `index.ts`: `STEP_SCENES` maps every `milestone/step` to a scene (a missing one throws, so
    the build fails); `closeupFor()` chooses the close-up; `HANDS` lists the hands-on ones.
  - `StepScene.tsx`: the player (timeline, captions in time marked You or Claude, play, pause,
    scrub, replay, a camera that follows the action, a still last frame for reduced motion).
  - `/admin/build/scenes` shows all 48 in build order.

### Close-ups (made at the very end; committed locally, **not on production**)

- `scenes/closeup.tsx`, **the wiring close-up**, driven by `web/components/workbench/wiring.ts`,
  the same source as the "Wire it" drawing and the firmware's `pins.h`:
  - **Node A**: the NodeMCU from above, USB at the bottom, with the pin names printed on the
    owner's board (left `A0 G VU S3 S2 S1 SC S0 SK G 3V EN RST G VIN`, right
    `D0 D1 D2 D3 D4 3V G D5 D6 D7 D8 RX TX G 3V`), and the breadboard beside it (left + rail
    3.3 V, left − rail ground, right + rail 5 V; columns a–j; 26 rows).
  - **Each wire, one at a time**: the pin pulses, labelled for example "NodeMCU 3V · right
    side, between D4 and G"; the F-M jumper's socket comes down onto it; the wire runs; its pin
    goes into the hole; the rail or the row of five it joins glows with its name. Wires from
    earlier steps stay in place, dimmed.
  - Where parts sit on the breadboard is chosen in `PLACES_A` and `PLACES_B` **as an example**
    (the close-up says so): the display's pins down column e, rows 2–5; the button across the
    gap, rows 8 and 10; the transistor in column c, rows 16–18, its 1 kΩ in column b; the buzzer
    module in column h, rows 16–18, the 1N4148 in column i; the HX711 across the gap, rows
    20–23; the load cell's leads from the side.
  - **Node B (camera)**: the ESP32-CAM on the breadboard with its pins in **columns b and i**
    (0.9 inch apart), one free hole beside each (a and j); the empty MB base beside it with the
    same socket names. Bench-only wires in `BENCH_B` (base 5V and GND to the rails, camera 5V and
    GND, base U0R/U0T to camera U0R/U0T, a bridge from the left + rail to the right one) for M3
    "off the base"; `SUPPLY_B` (a charger's leads) for M8 power. The light: 470 Ω from IO13 to
    Q2's base, a 10 kΩ pull-down, six LEDs in column g each fed by a 100 Ω from the right +
    rail, their short legs to the right − rail **used as the LEDs' common line, not ground**
    (labelled so), and that line to the collector.
- `scenes/hands.tsx`, close-ups of hands-on steps that are not wiring: the micro-USB plug into
  the NodeMCU (checked in the browser), the camera onto its MB base, the phone's hotspot
  settings (iPhone and Android), the microSD into its slot.
- On a step page the close-up sits under the overview scene, titled "Close up, one wire at a
  time" or "Close up, with your hands".

### Firmware

- Node A (`firmware/node-a-scale`), **0.3.1**. ESP8266 NodeMCU builds: `node-a-nodemcu` (real
  HX711) and `node-a-nodemcu-sim` (pretend weight); ESP32 builds `node-a-scale` and `node-a-sim`
  kept for Wokwi. Changes this session:
  - **One button** on D5: a click (under 0.8 s) is PHOTO; held 5 s it is TARE, with a countdown
    `HOLD: TARE IN n s`; let go in between and nothing happens. D3 (the board's FLASH button, or
    an optional second button) is PHOTO only.
  - The pretend scale: a weight lands with a damped wobble (16 % overshoot, within 1 g after
    1.3 s); `sim sign -1` plays a cell wired backwards; `cal` is kept in memory only
    (`saved=0`); `cal clear` leaves it uncalibrated.
  - **Tares itself at power-on** (found on the real board: it showed 840.0 g with nothing on
    it). A tare with no fresh readings says `E error no-readings`. A blank line before the boot
    line, so it does not join the chip's start-up noise.
  - Serial protocol in `firmware/node-a-scale/README.md`. Commands: `tare`, `capture`, `find`,
    `info`, `cal <cpg>`, `cal clear`, `sim <g>`, `sim sign <1|-1>`.
- Node B (`firmware/node-b-camera`), 0.1.0, never on a board. Commands include `ssid`, `pass`
  (the owner only), `backend`, `shoot <g>`, `light on`, `light off`.
- The site's flash images (ESP Web Tools) are rebuilt with
  `firmware/.venv/Scripts/python firmware/tools/publish_web.py` and committed under
  `web/public/workbench/firmware/`.

### Claude's board tool

`firmware/tools/board.py`, run with `firmware/.venv/Scripts/python`:

```
board.py ports                         # finds CH340, CH9102, CP210x
board.py flash node-a-nodemcu-sim      # or node-a-nodemcu, node-b-camera (add --port COMx with two boards)
board.py listen --reset --seconds 6    # restart and read; start-up noise is stripped
board.py send "sim 150" --expect "E sim"
board.py meal-test --no-camera         # plate 420 g, tare, food 150 g, photo → NO CAMERA
board.py counts --grams 200            # calibration: median net count and the implied cpg
```

Opening the port does not reset the board (DTR and RTS held low), so its state survives between
commands. Only one program can hold COM5: close the bench page or "Flash it" in the browser
first. It refuses `pass …`.

### Backend and the app

FastAPI in `backend/`, 162 tests pass. `GeminiRecogniser` is written (default model
`gemini-3.5-flash-lite`) and tested against a fake Gemini only; it waits for the owner's key in
`backend/.env`. `backend-lan` in launch.json serves on 0.0.0.0:8000 for the camera. Server
version 2 (Supabase accounts, pairing, the "to name" inbox, photos) and the Expo app are
**planned, not built**: [APP-PLAN.md](APP-PLAN.md), research in `ai-docs/research/2026-10-25-*`.

---

## 5. What to do next, in order

### A. Finish the close-ups (about an hour), then commit

1. **The camera onto its base** (`/admin/build/m2-camera/flash-camera`, figure 1): at the last
   frame the camera's pins must sit exactly on the base's sockets (one capture looked offset,
   possibly a stale frame). In `seatScene()` (`hands.tsx`) the camera is `CameraTop` moved by
   `lift`, which is 0 from about 6.6 s.
2. Check the **hotspot** (`m2-camera/hotspot`) and **microSD** (`m8-finish/card`) close-ups, and
   the **M8 power** wiring close-up (`m8-finish/power`: node B with `SUPPLY_B`).
3. Check the node A close-ups not yet looked at frame by frame: `m9-real-weight/hx711-wires`,
   `cell-wires`, `photo-button`, and the button step `m1-scale-brain/tare`.
4. Labels near the frame's edge lean inwards (`edge()` in `closeup.tsx`): check the 5 V rail
   label on the rails step.
5. `npx tsc --noEmit -p .` and `npm run build` in `web/`, a look at 375 px wide, then commit.
   Push only when the owner says so.

### B. Carry on the build with the owner (the real job)

The owner works one step at a time and says when their hands are done. For each step: read it in
`roadmap.ts`, tell them in plain words what to do (point at the close-up), wait, then run the
checks yourself and say what passed.

| Step | The owner | Claude checks |
| --- | --- | --- |
| 1.3 rails | USB out. F-M jumpers: 3V (right side, between D4 and G) → left + rail; G (just below it) → left − rail; VIN (left side, last pin) → right + rail. USB in. "rails done" | `board.py listen --reset --seconds 6` shows `E boot …` (a short circuit would stop it) |
| 1.4 display | USB out. Display into the breadboard; VCC → 3.3 V rail, GND → − rail, SCL → D1, SDA → D2. USB in | the first lines have **no** `E error no-display`; the owner sees `CAMERA ?`, `0.0 g`, `READY` |
| 1.5 button | Button across the gap: one leg → D5, the diagonally opposite leg → − rail | `listen` while the owner holds it 5 s (`E tare …`), then clicks (`E capture …`, then `E error too-light`; the display says `NOTHING ON IT`) |
| 1.6 buzzer | Transistor; 1 kΩ from D8 to the base; emitter → −; collector → buzzer −; buzzer S → 5 V rail; 1N4148 across − and S, band towards S | `send tare --expect "E tare"`: the owner hears a short beep |
| 1.7 whole test | Watch | `board.py meal-test --no-camera`: all PASS, 150.0 g, NO CAMERA |
| 2.1 camera | Seat the ESP32-CAM on its MB base; plug the base in (a second COM port) | `board.py flash node-b-camera --port COMx`; first line `E boot node=b … camera=1` |
| 2.2 hotspot | Phone hotspot on, 2.4 GHz (iPhone: Maximise compatibility); the laptop joins it | the laptop's IPv4 on that network (`ipconfig`) |
| 2.3 server | Click **Allow** on the Windows firewall prompt | start `backend-lan` in a terminal tab; `http://<laptop-ip>:8000/docs` answers |
| 2.4 Wi-Fi | On `localhost:3000/workbench/bench`: Connect, type the hotspot's name and **password**, paste `http://<laptop-ip>:8000`, Save and connect, then Disconnect | `E wifi up ch=…` |
| 2.5 test photo | Point the camera at something | `send "shoot 150"`; the backend saves a meal (HTTP 201) |

Then milestone 3 (the light: the close-ups cover moving the camera off its base and the light's
wiring), milestone 4 (`find`, `board.py meal-test` with both boards, then the rehearsal:
`sim sign -1`, `cal clear`, `counts --grams`, `cal`), the software milestones 5–7, then 8, and
the HX711 last (9).

### C. Software tracks waiting

- Server version 2 (Supabase: auth, Postgres, storage; hosted on Vercel's Python runtime), the
  fake scale, the Expo app (SDK 57, French first), the camera's Wi-Fi setup portal and pairing
  code (firmware). Plans: [APP-PLAN.md](APP-PLAN.md), [ROADMAP.md](ROADMAP.md), the research
  files. The accounts (Supabase, Vercel, Gemini, Expo) are the owner's to create.
- `SFS_ADMIN_PASSWORD` in Vercel (the owner's action, or their explicit yes).
- The public `/prototype`, `/rig` and `/project/architecture` still draw two buttons (TARE and
  PHOTO): update them to the one-button design when you are nearby.

---

## 6. Decisions made in this session (do not undo without the owner)

- The real weight (HX711, load cell) is the **last** milestone; everything else runs on the
  pretend scale first. Why, and what was ruled out:
  [research/2026-10-25-simulating-the-weight.md](research/2026-10-25-simulating-the-weight.md).
- **One button**: click for PHOTO, hold 5 s for TARE. A second button is optional, decided in M9.
- The scale **tares itself at power-on**.
- Claude does the laptop side of every step; the owner does only what needs hands.
- Breadboard positions in the close-ups are examples; the rule taught is "the same row of five".
- Node B on the bench: the ESP32-CAM sits on the breadboard with its pins in columns b and i; in
  the light example the right − rail is the LEDs' common line.

## 7. Known to be wrong, missing, or not verified

- **Nothing on node B has run on a board.** The two boards have never talked (ESP-NOW, capture,
  upload and the microSD queue are all untested).
- The close-ups are illustrations: boards and breadboard are drawn to read, not to scale.
- `kit.ts` still lists the push button with quantity 2 (the lab form's figure).
- `/reference/decisions` stops at D6; `/deliverables` is stale; no CI; no ESLint (lint is a type
  check); the README lists files that do not exist; an unexplained dev-only log line (RUNBOOK,
  "Known noise").
- The 3 kg cell's accuracy figures are generic, its dimensions are a seller's figure, the
  camera's field of view assumes the diagonal; the substitutes on the request sheet are
  judgement.
- Open questions: where the LEDs point (a ring, or at an angle), a failed capture never reaching
  the phone, ESP-NOW and the hotspot's channel.

## 8. Artifacts published for the owner (in the first account)

They belong to the account that made them: another account can open a shared link but cannot
edit it. Recreate one in your account if it has to change.

- App plan (server, accounts, the Expo app): <https://claude.ai/artifact/KqXTHYAtg165arUceJtnSc>
- Build plan (the visual plan of the build days): <https://claude.ai/artifact/Kf3T9mnB6vp8ndeimT1oyx>
- Shopping list in French for the electronics shop: <https://claude.ai/artifact/7dsJYCyuuMqi3SevoRg3Ps>
- Parts photos: <https://claude.ai/artifact/HmMLDwzaCte93xGEA1V3oK>

The same content is in the repo: `ai-docs/APP-PLAN.md`, `ai-docs/BUILD-PLAN.md`,
`/workbench/missing` (the French sheet for the lab, from `kit.ts` and `missing.ts`),
`/admin/parts`.

## 9. If you only have ten minutes

1. `git status`, `git log --oneline -10`, `git log origin/main..main --oneline`.
2. `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/admin/login`: not 200? Start
   the dev server in a terminal tab (`npm run dev` in `web/`).
3. `firmware/.venv/Scripts/python firmware/tools/board.py ports`: is the NodeMCU on COM5?
4. Ask the owner where they are on the rails step, and open `/admin/build/m1-scale-brain/rails`
   with them.
