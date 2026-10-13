# Decisions

Every judgement call made while building that the handoff brief did not specify, with
the reasoning, so the team can review and overrule.

Newest at the bottom. Each entry: what was decided, why, and what would change our mind.

---

## D0 — The repo was scaffolded from the brief, not from the original archive

**Date:** 2026-09-21 · **Status:** accepted, with a caveat the team should close

The original `smart-food-scale/` archive (containing `index.md`, the five-sheet
`IoT_Food_Tracker_Component_Request.xlsx`, `tools/build_bom.py`,
`tools/add_dropdown.py`, `setup-github.sh` and one commit) **could not be found on the
build machine.** A search of the whole user profile and both drives turned up no
`build_bom.py`, no `setup-github.sh` and no `*food*scale*` directory.

Everything in this repo was therefore reconstructed from the handoff brief.

**What this cost.** The brief carries the full Node A pin map, the ESP32-CAM forbidden-pin
list, the SD_MMC 1-bit free-pin set, the GPIO 12 strapping warning, the WROVER
16/17 caveat, the load-cell colour code, the power-discipline figures and the accuracy
envelope — so the firmware is not flying blind. What is **not** recoverable is anything
the original workbook's *wiring* and *risks* sheets said **beyond** what the brief
quoted.

**Action for the team:** diff `assets/IoT_Food_Tracker_Component_Request.xlsx` and
`docs/wiring.md` in this repo against the original workbook when someone can find it.
Treat this repo's BOM quantities as a reconstruction until that diff is done.

---

## D1 — Git history starts fresh; the placeholder-identity commit is not carried over

**Date:** 2026-09-21 · **Status:** accepted

The original repo had one commit authored by `team@example.invalid`. Since the archive
was unavailable (D0), history starts fresh here. New commits are authored with a real
identity.

Had the archive been present, the plan was to **leave that commit alone** and only fix
the identity going forward — rewriting history to correct one placeholder commit costs
more than it repairs, especially once teammates have cloned.

---

## D2 — FastAPI over Express for the backend

**Date:** 2026-09-21 · **Status:** accepted

The brief left this to us with a request to justify it. Four reasons, in order of weight:

1. **Pydantic is the deliverable's shape.** Nutrient records, recognition results and
   meal rows all need validation at a boundary where the client is an *embedded device
   posting multipart* — the least forgiving client we could have. Pydantic gives typed
   parsing and a machine-readable error for free. In Express this is `zod` plus `multer`
   plus glue we would own.
2. **The recogniser interface is the project's one real extension point.** Python's ABCs
   plus type hints express "swap this implementation" in a way that reads as design
   rather than convention, which matters for a team project that will be read by people
   who did not write it.
3. **Every vision and nutrition SDK we might reach for is Python-first.** Google's
   `google-genai`, Anthropic's `anthropic`, and the scientific tooling we would want if
   the calibration analysis grows all live there first.
4. **OpenAPI comes free.** `/docs` is generated, which gives the firmware author a page
   to read while writing the multipart POST, and gives the app author a contract.

**What would change our mind:** if the team is stronger in JavaScript than Python, that
outweighs all four — a backend nobody on the team can debug at 2 a.m. before the demo is
worse than a slightly clumsier one everybody understands. Say so and it gets ported.

---

## D3 — Dish identification is driven by *our* candidate list, not a vendor's label set

**Date:** 2026-09-21 · **Status:** accepted; the concrete vision API is still the owner's call

Constraint 7 in the brief — Tunisian dishes are absent from USDA, Nutritionix and the
commercial food-recognition APIs — rules out a whole category of vendor. LogMeal,
Foodvisor and Clarifai's food model each return **their own fixed taxonomy**. If
`lablabi` is not in that taxonomy, no amount of prompt or post-processing recovers it.

So the recogniser is defined as: *given a photo and the list of dishes we have nutrient
data for, return one of them or `unknown`.* That inverts the dependency — the
vocabulary is ours, the vendor only does the seeing — and it is the only shape in which
the Tunisian table ever gets used.

Consequences:

- A general multimodal model is a better fit than a food-specific API here, which is the
  opposite of the obvious choice.
- `unknown` must be a first-class answer. A recogniser that always guesses will map
  mloukhia onto whatever Western dish looks closest, and the resulting macros will be
  confidently wrong. Silent wrongness is worse than a manual-entry prompt.
- Adding a dish to `data/tunisian_foods.json` automatically extends what the recogniser
  can return. No retraining, no vendor ticket.

**Pricing research done for the owner's decision** (figures gathered 2026-09-21):

| Option | Cost | Free tier | Can it name a Tunisian dish? |
| --- | --- | --- | --- |
| Gemini 2.5 Flash-Lite | $0.10 / 1M input tokens | yes | Yes — with our candidate list |
| GPT-5-nano | $0.05 / 1M input tokens | no | Yes — with our candidate list |
| Claude Haiku 4.5 | $1.00 / 1M input tokens | no | Yes — with our candidate list |
| Google Cloud Vision labels | $1.50 / 1000 images after 1000/mo free | 1000/mo | No — returns `food`, `dish`, `cuisine` |
| LogMeal | unpublished (quote only) | 30 days **or** 200 queries, 5 users, new members only | No — fixed taxonomy |
| Clarifai food model | **not verified** — clarifai.com refused connection when fetched | unknown | No — fixed taxonomy |

At roughly 640 image tokens for an SVGA frame, a meal photo costs well under one cent on
any of the LLM options — **that per-meal figure is our estimate**, derived from token
count times list price, not measured against a bill.

Until the owner chooses, `StubRecogniser` is what the backend uses, and it is wired
through the same interface the real one will use.

---

## D4 — `grams` is validated hard, and a meal cannot be created without it

**Date:** 2026-09-21 · **Status:** accepted

The entire thesis of the project is that mass is measured rather than estimated. An
endpoint that accepts a meal with a missing, zero or negative mass quietly reintroduces
the error the device exists to remove.

So `POST /meals` rejects a non-positive `grams`, and rejects an implausible one
(> 5000 g) as a likely sensor fault rather than a real plate of food. The upper bound is
**our choice, not a measurement** — it is four times a large restaurant portion and well
past the 1 kg cell's range, so it only ever catches a broken reading.

---

## D5 — Nutrition lookup order: local table → USDA → fail loudly

**Date:** 2026-09-21 · **Status:** accepted

The local Tunisian table is consulted **first**, not as a fallback. Two reasons: it is
the only source that knows our dishes, and it needs no network, which keeps the test
suite offline and the demo independent of campus Wi-Fi.

USDA is second, cached on disk by `fdcId` because the free key is capped at 1,000
requests/hour per `api.data.gov` key.

If neither has the dish, the API says so rather than substituting something plausible.
See D3 — a confident wrong number is the failure mode we are building against.

---

## D6 — The docs site: Next.js on Vercel

**Date:** 2026-09-21 · **Status:** accepted (owner decision, revised same day)

The site is docs and showcase, not a live dashboard.

**First decision, same day:** Astro + Starlight on GitHub Pages — because the content is
markdown that already existed, the sidebar and search came configured rather than
hand-built, and Pages needed no second vendor. That was built and shipped: 13 routes,
14 pages, search index, all green.

**Revised by the owner to Next.js on Vercel.** The site was ported the same day. What
that cost and bought:

| | Starlight | Next.js (what we now have) |
| --- | --- | --- |
| Sidebar, active state, mobile drawer | configured | **hand-built** (`components/Sidebar.tsx`) |
| Full-text search | built in (Pagefind) | **not yet — a real gap** |
| Prev/next links | built in | hand-built (`components/PageNav.tsx`) |
| Dark mode | built in | hand-built, no-flash boot script |
| Callouts | `:::tip` syntax | `<Callout>` component |
| Adding a route | add a `.md` | add `app/<path>/page.mdx` + one line in `lib/nav.ts` |
| Adding a live dashboard later | needs an integration | **native** |

The honest trade: we gave up search and a few hundred lines of framework to gain a
stack the team controls end to end, and a direct path to a live meal dashboard hitting
the FastAPI backend without CORS or mixed-content problems. Given that a dashboard is a
plausible next step, that is a reasonable bet — but **search should be added back**
before the site grows much further.

The Astro version is not lost; it is in git history up to commit `4aa8dfe`.

## D7 — The web app lives in `web/`, not the repo root

**Date:** 2026-09-21 · **Status:** forced, not chosen

Next.js's App Router requires an `app/` directory. **The repo already has `app/` — it
is the React Native app**, named that way by the original brief's structure.

A root-level Next.js install would have collided with it. So the Next app lives in
`web/`, and Vercel needs its **Root Directory set to `web`** in project settings. There
is no `vercel.json` field for this; it is a dashboard setting, and a deploy that skips
it will fail to find a Next app.

## D8 — The GitHub Pages workflow was deleted, and the repo stays public

**Date:** 2026-09-21 · **Status:** accepted

`.github/workflows/deploy-pages.yml` was removed with the Astro site — it built
`site/`, which no longer exists, so it would have failed on every push.

`setup-github.sh` still creates the repo **public**. That is no longer forced by Pages,
but a public repo is right for a university project regardless, and Vercel deploys
either way.

## D9 — Pin React for the isolated 3D viewer

**Date:** 2026-09-21 · **Status:** accepted (owner requirement)

The `/rig` viewer uses React Three version 9.7, whose React peer range excludes
19.3. Pin both `react` and `react-dom` to **19.2.8**, which also satisfies Next 16.
Keep the normal npm peer checks enabled and commit the lockfile; no
`--legacy-peer-deps` workaround is used.

Three.js and the renderer belong behind a dynamic import in a client wrapper.
The MDX page remains a Server Component, and ordinary documentation routes must
not fetch the rendering engine. Only add addon transpilation if a build needs it.

**What would change our mind:** a tested renderer release that supports the
newer React version, with a clean dependency tree and passing route checks.

## D10 — A dimensioned reference assembly, with explicit estimates

**Date:** 2026-09-21 · **Status:** accepted for visualisation; verify before fabrication

The owner requested an interactive `/rig` model despite no hardware or original CAD
being available. Geometry is authored in millimetres under one 0.001-scaled group:
one Three.js world unit remains one metre. No component is enlarged for visibility.
The camera uses a 5 mm near plane and 10 m far plane. Browser zoom is not a promise
of calibrated, life-size pixels on an arbitrary display.

The reference set is HT Sensor's **TAL221 1000 g (47 × 12 × 6 mm)**, SparkFun's
**HX711 v1.1 PCB (30.48 × 22.86 mm)**, AI-Thinker's **ESP32-CAM
(27 × 40.5 × 4.5 mm)**, Adafruit **#326 SSD1306**, **#1643 twelve-pixel ring** and
**#160 passive piezo**, and Omron **B3F-1000 switches**. `web/components/rig/specs.ts`
records the sources and drives the page's dimension table. The TAL221 drawing and
its 1000 g column were read; the HX711 outline was derived from Eagle layer 20.
Reference vendors establish footprints, not the identity of the eventual supplied
parts. The LED-ring vendor may supply compatible SK6812 instead of WS2812B pixels.

Espressif's WROOM-32 module is documented at 25.5 × 18 × 3.1 mm. The surrounding
30-pin DevKit V1 carrier is **estimated at 51.5 × 28.5 mm**, using the module,
2.54 mm header layout and USB allowance. The board thickness, camera lens barrel,
minor PCB details and mounting hardware are explicitly estimates too; an MCU
module datasheet does not establish the outline of an unspecified clone board.

The proposed open base is **250 × 240 × 32 mm on 6 mm feet**. The plate is
**Ø180 × 12 mm**, on a **Ø130 × 4 mm platform**. A **20 mm-section arm** gives a
**350 mm overall height** and **249 mm lens-to-eating-surface clearance**. These
are design estimates selected to fit the electronics and make the load path
legible, not sourced dimensions or a manufacturing drawing. All component locations,
fasteners, cable paths, finishes and exploded-view offsets are illustrative.

Only one end of the cell is fixed to the base; its opposite end supports the platform.
The camera arm attaches to the stationary base. The plate must be tared empty before
food is added: re-taring a loaded plate would zero away the measurement. This viewer
describes that physical sequence without changing the existing firmware.

**What would change our mind:** measured supplier parts, the selected plate's mass,
camera field-of-view tests, or mechanical validation of arm stiffness and cell mounting.
Replace the corresponding estimates and confidence entries together with the geometry.

## D11 — A route-local, accessible instrument viewer

**Date:** 2026-09-21 · **Status:** accepted

The viewer keeps the site's existing typography and warm-accent CSS variables.
The assembly is the main visual; the surrounding controls are quiet. Brushed metal,
a ceramic plate and exposed circuit boards distinguish the load path from electronics.
Assembled and exploded views preserve part sizes, with component selection, close-up
focus, front/top/reset views, measurement guides and a light-ring toggle. Focusing a
hidden base component opens exploded mode so it can actually be inspected.

`page.mdx` imports a client wrapper; only that wrapper dynamically imports `Scene`
with `ssr: false`. Three.js and React Three Fiber do not enter the shared layout or
navigation imports. Three.js is pinned to **0.182.0**, compatible with Fiber 9.7;
newer Three releases warned about Fiber's Clock use and removed soft-shadow APIs.
The scene uses PCF shadows. No addon transpilation was required.

Rendering is on demand, capped at 1.5 device-pixel ratio with a 1024-pixel shadow
map. Orbit supports touch. Rotation is opt-in and disabled under reduced motion;
assembly transitions also become immediate. The scene observes the HTML `dark`
class. A WebGL2 probe avoids mounting an unsupported renderer, with a side-view
SVG and the full server-rendered assembly description/table available without WebGL
or JavaScript. Context loss and renderer failures fall back to the same explanation.

`npm run check:rig -- <local production URL>` checks every generated content route,
prints initial JS size per route and rejects a renderer chunk in any initial/shared
route scripts. Browser checks cover the additional dynamic network load, themes,
mobile view, motion preferences, fallback, interactions and hydration.

Verification on 21 September 2026: the production build and all 14 content routes
passed. The renderer was isolated in a 234.6 KiB gzipped dynamic chunk; none of the
13 existing routes requested it in browser checks. Light/dark desktop and 390 px
mobile layouts, view controls, reduced motion, WebGL-unavailable and JavaScript-off
fallbacks passed with no console errors or warnings. Touch orbit and pinch were
exercised through synthetic touch pointer events; no physical phone was used.

**What would change our mind:** a larger part catalogue or detailed supplier CAD
may justify compressed external models. Until then procedural geometry avoids remote
assets, font fetches and an additional loading dependency.

---

## D12 — The component request is built around what a faculty lab already has

**Date:** 2026-10-12 · **Status:** proposed, for the team to confirm with the lab

The request now has three lists: **buy** (7 lines, 85.400 TND at Tunisian shop prices
read on 2026-10-12), **borrow** from the teaching lab, and **book** (bench instruments,
FabLab time, calibration masses). The data lives in `web/components/request/bom.ts`;
the page, its total and its hand-in table are generated from it. Lab availability is
inferred from starter-kit contents and supplier partner lists. No faculty inventory
was available.

Changes from the reconstructed BOM, each from datasheet or local-availability research:

- **Lighting: six white LEDs and a 2N2222 on Node B GPIO 13, replacing the WS2812B
  ring and SN74AHCT125.** WS2812B data needs 0.7·VDD (3.5 V at 5 V); the ESP32
  guarantees only 0.8·3.3 V. No Tunisian shop checked stocks the 74AHCT125, and the
  locally sold BSS138 shifters are too slow for the ring's data rate. White LEDs and a
  2N2222 are lab staples. This also settles a contradiction: the wiring page put the
  ring on Node A GPIO 5, the architecture page on Node B. GPIO 13 is free with the SD
  in 1-bit mode and is not a strapping pin. A BC547 cannot carry the ~110 mA.
- **HX711 on Node A's 3V3 pin, dropping its buck converter.** It draws ~1.5 mA plus
  ~3–4 mA for the bridge. The DevKit's linear regulator is quieter than a switching
  converter, and at 5 V a single-supply HX711 board drives DT to 5 V, beyond the
  ESP32's VIH max of VDD + 0.3 V. Cost: excitation drops from ~4.3 V to ~3.1 V, about
  1.4× more noise in grams, still far below the 1 g target on a 1 kg cell.
- **ESP32-CAM-MB base replaces the stand-alone USB-to-TTL adapter** (9.5 vs 10.5 TND,
  with BOOT and RST buttons). The adapter stays as a backup at 3.3 V logic.
- **1N4148 across the buzzer coil; shielded 4-core cable for the load cell** (an old
  USB cable); **microSD becomes a borrowed, optional part**; **calibration masses move
  from optional to booked from the physics lab** (no local retailer found).
- *(Superseded by D13.)* **1 kg cell kept, with plate plus platform capped at 250 g.** Ceramic plates run
  300–430 g. The research suggested a 1.5–2 kg cell instead, but only 1 kg and 5 kg
  bars were found in stock locally, and 5 kg is 5× worse in grams.

**Not yet reflected:** the 3D rig (`web/components/rig/`) still models the 12-pixel
ring and a 250 mm lens-to-plate clearance; the research recommends 300–350 mm.

**What would change our mind:** the lab having a 74AHCT125 (or an importable one) and
a reason to want colour control would bring the ring back on Node B GPIO 13 through
it. Plates that cannot be kept under 250 g call for a 2–3 kg cell.

---

## D13 — A 3 kg load cell, with five-point calibration

**Date:** 2026-10-12 · **Status:** accepted (owner request)

The owner asked for 2 or 3 kg and as precise as possible. The cell is now the **3 kg
YZC-131 from Didactico, 13.000 TND, in stock** (variant prices read from the product
page's data). No 2 kg bar was listed by Didactico, Tuni Smart or CoThings; a 2 kg cell
means an import.

The trade-off is explicit on the component request page. Errors scale with full scale,
so the 3 kg cell is 3× coarser in grams than the 1 kg: 0.3–0.6 g readable and 1.5–3 g
absolute by the accuracy page's rule, against 0.5–1 g on 1 kg. In exchange a 420 g
ceramic plate leaves about 2.5 kg for food instead of about 480 g, and overload by a
hand on the platform is much less likely. Worst case, 3 g on 350 g of lamb couscous
is 5 kcal of 585, well inside the food table's own estimate error.

Precision is recovered by method rather than rating: five-point calibration (100 g to
2 kg) with interpolation between points, tare before every capture, a proper Z mount
with a stop screw, warm-up, and a median of 12 samples at 10 SPS. The target is ~1 g,
to be replaced by the measured figure.

Seller listings give the YZC-131 3 kg as 75 × 12.7 × 12.7 mm, 1.0 ± 0.1 mV/V, M4
threads. No creep, overload or combined-error figures were found for it; ask the seller
for the datasheet. The backend's 5000 g ceiling (D4) stays: it is past this cell's
range, so it still only catches a broken reading.

**Not yet reflected:** the 3D rig models the TAL221 1 kg (47 × 12 × 6 mm); its stack
heights depend on that size, so it changes with the rig rework noted in D12.

**What would change our mind:** a local 2 kg cell, or a measured error that misses the
1 g target by enough to matter.
