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
