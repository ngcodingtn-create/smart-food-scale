<!-- Research done in session 3 on 2026-10-13, at the owner's request: "i want to not use my pc
     but a server, research the best free option to have a server for my app, and we are using
     gemini api to get the data". A snapshot: free tiers change often. Nothing here was deployed
     or measured; what is marked unverified is unverified. -->

# Where to run the backend for free, with Gemini doing the seeing

Read on 2026-10-13. Verification codes:

- **O**: read on the provider's own page today.
- **T**: third-party page or a search summary only. Treat as a lead, not a fact.
- **J**: my judgement or my reading of this repo's code. Not tested.

## What the backend needs from a host

From `backend/app` as it stands (J, read from the code):

| Need | Why |
| --- | --- |
| Run a FastAPI (ASGI) app on Python 3.11+ | `app/main.py` exports `app` |
| Take a multipart JPEG from the ESP32-CAM | `POST /meals`; `SFS_MAX_IMAGE_BYTES` is 8 MB today |
| Call out over HTTPS | Gemini, and USDA if it is switched on |
| Keep the meal log | SQLite file today (`smart_food_scale.db`); `SFS_DATABASE_URL` already accepts another database |
| Answer quickly on the first request | The camera node posts and waits; a host that takes a minute to wake breaks a live demo |
| Be reachable from a phone hotspot | The boards and the app are on the hotspot, not the lab network |

Two things every free host has in common, and both matter here:

- **No free host keeps a disk.** On all of them the SQLite file is lost on restart. The
  meal log has to move to a hosted database whichever host is chosen.
- **All of them are HTTPS only.** Node B must post with `WiFiClientSecure`, not plain HTTP.

## Gemini's free tier

| Fact | Code | Source |
| --- | --- | --- |
| Tunisia is an available region | O | [Available regions](https://ai.google.dev/gemini-api/docs/available-regions) |
| Free-tier models that take images: `gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`, `gemini-2.5-flash-lite`, `gemini-2.5-flash`, `gemini-3-flash-preview` | O | [Pricing](https://ai.google.dev/gemini-api/docs/pricing) |
| Google no longer publishes free-tier numbers; they are shown per project in AI Studio | O | [Rate limits](https://ai.google.dev/gemini-api/docs/rate-limits) |
| Limits are per project, not per key. The daily count resets at midnight Pacific | O | same |
| About 20 requests a day on current Flash models, about 500 on Flash-Lite | T | [scriptbyai](https://www.scriptbyai.com/gemini-api-free-tier-limits/), [aiplug](https://aiplug.work/en/blog/gemini-free-tier-limits). One other guide says 1,000 to 1,500; the sources disagree |
| Free-tier content is used to improve Google's products, and human reviewers may read it | O | [Terms](https://ai.google.dev/gemini-api/terms) |
| You must be 18 or older | O | same |
| Only paid service may be offered to users in the EEA, Switzerland and the UK | O | same |
| Requests from servers in some European countries fail on the free tier with "User location is not supported"; one report fixed it by moving a Render service to Oregon | T | [forum](https://discuss.ai.google.dev/t/need-some-help-with-user-location-is-not-supported-for-the-api-use/138367), search summaries of other threads |
| Paid price if the free tier is ever not enough: $0.10 per million input tokens (2.5 Flash-Lite), $0.25 (3.1 Flash-Lite) | O | [Pricing](https://ai.google.dev/gemini-api/docs/pricing) |

What follows (J):

- **Use a Flash-Lite model.** Twenty requests a day would not survive an afternoon of
  testing. Read the real number for the project in AI Studio before relying on 500.
- **Keep the server in a US region.** The location check appears to look at the calling
  server's address. This is inferred from forum reports, not stated by Google.
- A meal photo is not sensitive, but it is sent to Google and may be read. Say so in the
  report.

## The hosts

| Host | Free? | Bank card | Sleeps | Disk | Verdict |
| --- | --- | --- | --- | --- | --- |
| **Vercel Functions** (Hobby) | Yes | No (the site is already on it) | Scales to zero; pre-warming on production | Read-only | **Recommended** |
| **Render** free web service | Yes | Not asked for (T) | After 15 min idle; "about one minute" to wake (O) | Wiped on every sleep (O) | Runner-up |
| Google Cloud Run | Yes, generous | Billing account required (O) | Scales to zero, wakes in seconds (J) | None | Best if a card is available |
| Oracle Always Free VM | Yes | Required (J, from memory; Oracle's FAQ refused the fetch) | Never, but idle VMs are reclaimed (T) | Real disk | Only real always-on server; hard sign-up |
| Azure for Students | $100 for 12 months | No (T) | Free F1 plan: 60 CPU-minutes a day (T) | Yes | Possible; needs a university e-mail |
| Koyeb | One small instance | Required, $29 hold (T, quoting Koyeb's FAQ) | After 1 hour | None | No |
| Hugging Face Spaces | **No longer** | n/a | n/a | n/a | Docker Spaces now need a paid plan (O) |
| PythonAnywhere | Yes | No | No | 512 MiB | FastAPI support is experimental; outbound calls limited to an allowlist (O/T) |
| Fly.io, Railway | Trial credit only | Yes | n/a | n/a | Not free |

Details behind the top two.

**Vercel** ([FastAPI guide](https://vercel.com/docs/frameworks/backend/fastapi),
[limits](https://vercel.com/docs/functions/limitations),
[Hobby plan](https://vercel.com/docs/plans/hobby), all O):

- FastAPI is supported with no configuration. Vercel looks for an `app` in `app/main.py`,
  which is exactly where ours is if the project's root directory is `backend`.
- Lifespan events run, so `init_db()` works.
- Hobby: 2 GB memory, 300 s per request, 1,000,000 invocations and 4 hours of active CPU
  a month. Time spent waiting on Gemini or the database does not count as active CPU.
- **Request body is capped at 4.5 MB.** A camera frame is far under that, but
  `SFS_MAX_IMAGE_BYTES` (8 MB) must come down to match.
- Functions run in one region, `iad1` (Washington, D.C.) by default. Leave it there for
  Gemini.
- The plan is for non-commercial, personal use. A coursework project fits.
- Runtime logs are kept for one hour.

**Render** ([free instances](https://render.com/docs/free), O;
[regions](https://render.com/docs/regions), O):

- A normal long-running server, so nothing about the code's shape changes.
- 750 instance hours a month. 512 MB of memory and a shared CPU (T).
- Sleeps after 15 minutes without traffic and takes about a minute to wake. The camera
  node would have to call `/health` and wait before every post.
- Its own free Postgres is deleted 30 days after creation, so it needs an outside
  database too.
- Regions: Oregon, Ohio, Virginia, Frankfurt, Singapore. Pick a US one.

**The database: Neon** ([pricing](https://neon.com/pricing), O): free plan with no card
and no expiry, 1 GB per project, 100 compute-hours per project, sleeps after 5 minutes
idle. Create it in a US East region, next to the function.

## Recommendation

**Vercel for the backend (a second project on the same repository, root directory
`backend`), Neon for the meal log, Gemini Flash-Lite on the free tier, everything in the
US East region.**

Why this one (J):

- No bank card anywhere in the chain.
- The owner already has the Vercel account, the GitHub link and the habit: push `main`,
  it deploys.
- It does not take a minute to wake, which is what would embarrass a live demo.
- The only cost is that the backend must stop writing to its own disk, which it would
  have to do on every other free host as well.

## What would have to change in the repository

Read from the code, not yet tried (J):

1. **A `GeminiRecogniser`** beside `recognition/stub.py`, registered in `registry.py`,
   with the key and the model name as settings. It must keep D3's contract: answer one
   of our dish keys or `None`.
2. **Postgres**: add a driver to `requirements.txt` and set `SFS_DATABASE_URL`. `db.py`
   already handles a non-SQLite URL. The tests keep SQLite.
3. **Nothing written to disk**: `nutrition/cache.py` writes the USDA cache under
   `data/cache` (USDA is off by default, so this only bites when it is switched on), and
   `SFS_STORE_IMAGES` must stay off.
4. **`SFS_MAX_IMAGE_BYTES`** down to 4 MB.
5. **A device key.** The address becomes public and every `POST /meals` spends Gemini
   quota. `main.py` already says to narrow CORS before this point. A shared secret
   header checked on the write routes is the smallest fix.
6. **Firmware, when it is written**: an `https://` address and `WiFiClientSecure`
   instead of a laptop's LAN address.

Three things only the owner can do: create the Gemini key in Google AI Studio, create
the Neon project, and add the second Vercel project with its environment variables.

## Not verified

- Nothing was deployed. How long a cold Python function takes to answer on the Hobby
  plan was not measured.
- That Vercel bundles `data/tunisian_foods.json` with the function without extra
  configuration.
- The Gemini free-tier request counts. Google does not publish them.
- That a US server avoids the location error. It is what the forum reports point to.
- Render's and Azure's "no card" claims, and Oracle's card requirement, were not read on
  the providers' own pages today.
