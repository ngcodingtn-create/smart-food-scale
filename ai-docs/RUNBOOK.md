# Runbook

How to run, check and ship this repo. Written on Windows 11 with Git Bash and
PowerShell; paths are Windows where it matters.

Tool versions these steps were run with: Node 24.11.1, npm 11.6.2, Python 3.14.2,
Next.js 16.3.5 (Turbopack), React 19.2.8. PlatformIO and pyserial live in `firmware/.venv`.

## Run it

```bash
# Backend — FastAPI, SQLite. Needs no network, no API key, no .env.
cd backend
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements.txt   # source .venv/bin/activate elsewhere
.venv/Scripts/python.exe -m uvicorn app.main:app --reload     # http://127.0.0.1:8000/docs
.venv/Scripts/python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000   # reachable from the phone hotspot, for the camera board (launch.json: backend-lan)
.venv/Scripts/python.exe -m app.recognition.gemini photo.jpg  # one real Gemini call, with SFS_GEMINI_API_KEY in .env; prints the answer

# Site — Next.js docs and prototype.
cd web
npm ci
npm run dev                                                   # http://localhost:3000

# Firmware — PlatformIO, in its own venv. The first build downloads the ESP32
# toolchain into ~/.platformio (several hundred MB, about five minutes).
python -m venv firmware/.venv
firmware/.venv/Scripts/python.exe -m pip install platformio
cd firmware/node-a-scale
../.venv/Scripts/pio.exe run                                  # four builds: node-a-nodemcu(-sim) on the ESP8266 in hand, node-a-scale/-sim on ESP32 (Wokwi)
../.venv/Scripts/pio.exe run -e node-a-nodemcu -t upload      # the NodeMCU on USB
cd ../node-b-camera
../.venv/Scripts/pio.exe run                                  # the camera; flash with -t upload via the MB base
```

In the Claude desktop app, `.claude/launch.json` starts both: `web` (port 3000,
`autoPort`) and `backend` (port 8000). The backend entry uses the Windows venv path.

**The app stops preview servers when a turn ends.** So the site's dev server runs in a
Terminal tab of the app instead ("site (localhost:3000)", `npm run dev` in `web/`), and
`launch.json`'s `web` only attaches to it by URL; `web-start` still starts one. The
backend is still started per turn; a connection refused there is normal.

## Driving the boards

The owner plugs in and wires; Claude does the rest from the laptop with
`firmware/tools/board.py` (run with `firmware/.venv/Scripts/python`). It finds the one USB
board by itself (CH340, CH9102 or CP210x); pass `--port COM5` when two are plugged in.

```bash
firmware/.venv/Scripts/python firmware/tools/board.py ports
firmware/.venv/Scripts/python firmware/tools/board.py flash node-a-nodemcu-sim
firmware/.venv/Scripts/python firmware/tools/board.py listen --reset --seconds 6
firmware/.venv/Scripts/python firmware/tools/board.py send "sim 150" --expect "E sim"
firmware/.venv/Scripts/python firmware/tools/board.py meal-test --no-camera
firmware/.venv/Scripts/python firmware/tools/board.py counts --grams 200
```

- Only one program holds a port: close the bench page or Flash it in the browser first.
- Flashing the NodeMCU fails to connect now and then: ask the owner to hold FLASH, tap
  RST, let go of FLASH, and run it again.
- `board.py` refuses `pass …`. The Wi-Fi password is typed by the owner on the bench page,
  so it never passes through a command line, a log or the chat.
- Calibrating: tare on an empty plate (`send tare --expect "E tare"`), then for each known
  mass `counts --grams <g>`; average the `cpg` values and `send "cal <cpg>" --expect "E cal"`.

## One Next.js dev server, never two

The owner asked for exactly one. Next 16 enforces it per project folder with an
OS-level lock at `web/.next/dev/lock`:

- A second `next dev` in `web/` exits with "Another next dev server is already
  running" and names the first one's PID and URL. Checked on 2026-10-13.
- The lock file can outlive its process. A leftover file is harmless: the next start
  takes the lock and rewrites it once ready.
- **Never run the `taskkill /PID …` that message suggests without checking the PID.**
  Windows reuses PIDs quickly: a stale lock's PID was seen belonging to an unrelated
  Windows service twenty seconds after the dev server died.
- Port 3000 is sometimes held by another project's dev server on this machine. Then
  `autoPort` gives this site a random port. That is still one server.

To see what is really listening:

```bash
netstat -ano | grep LISTENING | grep -E ":(3000|8000) "
```

A new route folder (for example `app/prototype/`) created while the dev server is
running may 404 until the server is restarted.

## The builder's area, /admin

Password protected. The password is `SFS_ADMIN_PASSWORD`, read when the server starts:
put it in `web/.env.local` (git ignores it) and restart `npm run dev`; in production, in
the Vercel project's environment variables, then redeploy. Without it, /admin stays
locked. Sessions last 7 days; changing the password signs everyone out.

## Check it

Run all of these before saying something works. Each has caught a real problem.

```bash
cd web
npx tsc --noEmit            # ignore errors under .next/ — see "Corrupt generated files"
npm run sync:foods -- --check   # the simulator's food table matches the backend's
npm run sync:wiring -- --check  # pins.h and the Wokwi files match wiring.ts and the firmware
npm run build               # every route must prerender: 21 pages plus the 404, as of 14 Oct 2026
npm run start -- -p 4317 &  # then, in the same shell:
npm run check:rig -- http://127.0.0.1:4317   # every route 200 and has an <h1>; WebGL stays out of initial JS
# stop the :4317 server afterwards

cd ../backend
.venv/Scripts/python.exe -m pytest   # 145 tests, offline

cd ../firmware/node-a-scale
../.venv/Scripts/pio.exe run         # all four builds compile, no warnings from our code
cd ../node-b-camera
../.venv/Scripts/pio.exe run         # likewise
```

**After changing the firmware or the wiring**, regenerate what the site serves, and
commit it with the change:

```bash
cd web && npm run sync:wiring                                   # pins.h, and the Wokwi sketch and diagram
cd .. && firmware/.venv/Scripts/python.exe firmware/tools/publish_web.py   # the images the Flash page installs
```

`npm run lint` is only `tsc --noEmit`. Next 16 removed `next lint`, and ESLint is not
set up in `web/`.

`check:rig` asserts specific strings on `/rig` (the description's id, the load cell's
dimensions, the word "Estimate", two source domains). Change the model's dimensions and
you change the script's expected string with it — that is the script working, not a
reason to delete the assertion.

## Check it in a browser

Most of the site's value is visual, so look at it. Things that mislead:

- **A hidden or minimised window does not paint.** Screenshots time out, the page
  reports a 0×0 viewport, and any layout number measured then is meaningless.
- **A background tab throttles timers to about one per second and stops animation
  frames.** The prototype's capture takes ~6 s in a visible tab and far longer in a
  hidden one. A test that clicks, waits a fixed time and reads the result will report
  failures that are not there. Wait on a condition (for example "the PHOTO button is
  enabled again") and bring the tab to the front first.
- **Old console errors stay in the buffer** across reloads and hot updates. An error
  from the moment between two file saves is not a current error. Reload and read again.
- **Layout at other sizes without resizing the window:** load the page in a hidden,
  sized, same-origin `<iframe>` and measure inside it. Used here to check every route at
  320, 390, 820, 1024 and 1440 px for horizontal overflow.

Pages worth opening after any change to shared CSS: `/`, `/project/component-request`,
`/project/architecture`, `/rig`, `/prototype`, `/workbench/wire` (the stepper, tables and callouts).
Check both themes (`?theme=dark`, `?theme=light`) and a phone width.

## Known noise

- **`unhandledRejection: SyntaxError … "  " is not valid JSON` in the dev log**, once
  per page load. Next's dev server `JSON.parse`s every message on its hot-reload socket
  without a `try`; something sends two spaces. The sender was not identified. Pages,
  hot reload and builds are unaffected, and it does not exist in production.
- **Corrupt generated files.** If the dev server is killed mid-write, files under
  `web/.next/dev/types/` can be left as NUL bytes and `tsc` reports hundreds of errors
  in `.next/`. They are regenerated on the next `next dev`. Filter them out:
  `npx tsc --noEmit 2>&1 | grep -v "^\.next/"`.
- **"Slow filesystem detected"** from Next on this drive. First compile of a route can
  take a minute or more.

## Ship it

There is no deploy command. **Pushing `main` to `origin` is the production deploy.**

- Repo: `github.com/ngcodingtn-create/smart-food-scale`
- Vercel builds `web/` (`npm ci`, `next build`). Fonts are fetched at build time by
  `next/font`, so the build needs network there.
- Live site: <https://web-ivory-ten-26.vercel.app>
- Vercel's own deployment URLs (`smart-food-scale-…-infolabtn.vercel.app`) redirect to a
  login page. A 200 from them is the login page, not the site.
- `gh` and the Vercel CLI are not installed. Deploy status is public:

```bash
curl -s https://api.github.com/repos/ngcodingtn-create/smart-food-scale/commits/<sha>/status
# look for the "Vercel" context: pending, then success
```

Then fetch the live pages and check for something only the new build has.

**Push only when the owner asks.** A past "push to prod" is not standing permission.

## Commits

Conventional prefixes, as in the history: `feat(web):`, `fix(web):`, `docs:`, `chore:`.
A body that says why, wrapped near 78 columns, ASCII where practical. One logical change
per commit. End with the attribution line your tool supplies.
