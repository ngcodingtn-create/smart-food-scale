# Runbook

How to run, check and ship this repo. Written on Windows 11 with Git Bash and
PowerShell; paths are Windows where it matters.

Tool versions these steps were run with: Node 24.11.1, npm 11.6.2, Python 3.14.2,
Next.js 16.3.5 (Turbopack), React 19.2.8. PlatformIO is not installed on this machine.

## Run it

```bash
# Backend — FastAPI, SQLite. Needs no network, no API key, no .env.
cd backend
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements.txt   # source .venv/bin/activate elsewhere
.venv/Scripts/python.exe -m uvicorn app.main:app --reload     # http://127.0.0.1:8000/docs

# Site — Next.js docs and prototype.
cd web
npm ci
npm run dev                                                   # http://localhost:3000
```

In the Claude desktop app, `.claude/launch.json` starts both: `web` (port 3000,
`autoPort`) and `backend` (port 8000). The backend entry uses the Windows venv path.

**The app stops these servers when a turn ends.** Expect to start them again; a
connection refused at the start of a turn is normal, not a bug.

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

## Check it

Run all of these before saying something works. Each has caught a real problem.

```bash
cd web
npx tsc --noEmit            # ignore errors under .next/ — see "Corrupt generated files"
npm run sync:foods -- --check   # the simulator's food table matches the backend's
npm run build               # every route must prerender: 16 pages plus the 404, as of D14
npm run start -- -p 4317 &  # then, in the same shell:
npm run check:rig -- http://127.0.0.1:4317   # every route 200 and has an <h1>; WebGL stays out of initial JS
# stop the :4317 server afterwards

cd ../backend
.venv/Scripts/python.exe -m pytest   # 145 tests, offline
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
`/project/architecture`, `/rig`, `/prototype`, `/project/wiring` (tables and callouts).
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
