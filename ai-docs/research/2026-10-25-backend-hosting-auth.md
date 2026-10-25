# Backend: hosting on Vercel, Supabase for data, auth and photos

Researched 25 October 2026 for [APP-PLAN.md](../APP-PLAN.md). WebSearch and WebFetch
were broken; every page below was read with curl (Vercel serves its docs as Markdown at
`<page>.md`). **V** = verified on the page linked. **K** = general knowledge, not
re-checked today. Nothing here was deployed.

## 1. Vercel: running our FastAPI app

| Fact | Code | Source |
| --- | --- | --- |
| Vercel finds a `FastAPI` instance named `app` at `app.py`, `index.py`, `server.py`, `main.py`, `wsgi.py`, `asgi.py`, **or the same names inside `src/` or `app/`**. Ours is `backend/app/main.py`, so with Root Directory `backend` it is found with no config | V | [frameworks/backend/fastapi.md](https://vercel.com/docs/frameworks/backend/fastapi.md) |
| A custom entrypoint, if ever needed: `[tool.vercel] entrypoint = "pkg.module:app"` in `pyproject.toml` | V | same |
| FastAPI **lifespan** events are supported (our `init_db()` runs there) | V | same, "Startup and shutdown" |
| Dependencies from `pyproject.toml`, `requirements.txt` or Pipenv | V | same |
| Python **3.12 (default), 3.13, 3.14**; set with `pyproject.toml` `requires-python` or the version page | V | [functions/runtimes/python.md](https://vercel.com/docs/functions/runtimes/python.md) |
| The whole app becomes **one** function; Python bundle limit **500 MB** uncompressed | V | same; [functions/limitations.md](https://vercel.com/docs/functions/limitations.md) |
| **Request and response body: 4.5 MB max**, else `413 FUNCTION_PAYLOAD_TOO_LARGE` | V | limitations.md, "Request body size" |
| Hobby: **300 s default and maximum duration**; 2 GB memory | V | limitations.md table |
| One region by default, **`iad1`** (Washington, D.C.); Hobby cannot set several | V | limitations.md, "Regions" |
| Waiting on I/O (Gemini, the database) does not count as active CPU | V | limitations.md, pricing paragraph |
| Root Directory: set in Project Settings → Build and Deployment; **the app cannot read files outside it** | V | [builds/configure-a-build.md](https://vercel.com/docs/builds/configure-a-build.md) |
| Cold starts of a few hundred ms to a few seconds for Python | K | not measured; the camera waits 20 s (`kUploadTimeoutMs`), so it fits |

What this means for us:
- **Second Vercel project**, same GitHub repo, **Root Directory `backend`**. `backend/data/tunisian_foods.json` is inside it: fine. Nothing in `backend/` reads `../`.
- **Split test dependencies out of `requirements.txt`** (`pytest`, `httpx2`) into `requirements-dev.txt`, so the function bundle carries only what runs.
- **Pin Python**: `pyproject.toml` says `>=3.11`; Vercel would pick its default 3.12 (K, from "if not defined or not supported, Vercel uses the default"). The laptop runs 3.14. Set `requires-python = ">=3.12"` and test on 3.12, or pin 3.14 on both.
- **`SFS_MAX_IMAGE_BYTES` to 4 MB** (4,194,304), below Vercel's 4.5 MB body limit with room for the form fields.
- **Nothing written to disk**: keep `SFS_STORE_IMAGES=false` (photos go to Supabase Storage instead), USDA off (its cache writes to `data/cache`).
- **Region**: put the Supabase project in **US East (N. Virginia)** next to `iad1` (K: Supabase lists an `us-east-1` region). Gemini from a US server also avoids the "User location is not supported" reports noted on 13 October.
- Environment variables go in the project's settings: `SFS_DATABASE_URL`, `SFS_GEMINI_API_KEY`, `SFS_RECOGNISER=gemini`, `SFS_SUPABASE_URL`, `SFS_SUPABASE_SECRET_KEY`, `SFS_PHOTO_BUCKET`.

## 2. Supabase Postgres from a serverless function

| Fact | Code | Source |
| --- | --- | --- |
| For **serverless functions**, use the **shared pooler in transaction mode**: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-[INDEX]-[REGION].pooler.supabase.com:6543/postgres` (copy the host from the Connect dialog: the index cannot be guessed) | V | [database/connecting-to-postgres](https://supabase.com/docs/guides/database/connecting-to-postgres) |
| The shared pooler is reachable over **IPv4** on every plan (the direct `db.[ref].supabase.co:5432` is IPv6 without the add-on) | V | same, table |
| **Transaction mode does not support prepared statements**; turn them off in the driver. Session state (`SET`, advisory locks, `WITH HOLD` cursors) does not survive between transactions | V | same, "Transaction mode limitations" |
| Psycopg 3: disable with **`prepare_threshold=None`**, accepted as a `connect()` keyword since 3.1 | V | [psycopg prepared statements](https://www.psycopg.org/psycopg3/docs/advanced/prepare.html) |
| psycopg2 does not prepare statements on its own, so it works through the pooler unchanged | K | |
| **Migrations and `pg_dump`**: use the **direct connection** (a single session), not the pooler | V | connecting-to-postgres, "Which connection method" |

Versions on PyPI on 25 October 2026 (V, `pypi.org/pypi/<pkg>/json`): `psycopg[binary]` 3.3.6,
`psycopg2-binary` 2.9.13, `SQLAlchemy` 2.1.6 (Python ≥ 3.11), `alembic` 1.20.1, `PyJWT`
2.15.1, `cryptography` 50.0.2, `supabase` (Python client) 2.33.0, `fastapi` 0.162.0.

Recommendation:
- **Driver: `psycopg[binary]` 3.3.x** (`postgresql+psycopg://` URL in SQLAlchemy), with
  `connect_args={"prepare_threshold": None}`. The binary wheel needs no system libpq, which
  matters on Vercel (K).
- **`poolclass=NullPool`** in `db.py` when the URL is Postgres: the pooler pools; a function
  instance holding its own pool only multiplies connections (K, standard advice).
  `db.py` already special-cases SQLite; add the Postgres branch there.
- **Migrations: Alembic**, run from the laptop against the **direct** connection string, never
  at cold start. Keep `init_db()`'s `create_all` for SQLite (tests, local) only.
- **Row Level Security: turn it on for every table, with no policies.** The app holds
  Supabase's public key (for sign-in), and Supabase's Data API serves tables in the `public`
  schema to that key unless RLS blocks them (V: the connection guide says the Data API
  "Requires Row Level Security"). Our server connects as the database owner, which RLS does
  not restrict (K). Alternative: create our tables in a schema the Data API does not expose,
  such as `app` (K). Either way, the app must never read the database directly.

## 3. Supabase Auth: verifying users in FastAPI

| Fact | Code | Source |
| --- | --- | --- |
| Two systems: the **legacy shared JWT secret** (HS256, "no longer recommended") and **signing keys** (asymmetric **ES256** recommended, RS256 available; EdDSA "coming soon") | V | [auth/signing-keys](https://supabase.com/docs/guides/auth/signing-keys) |
| Public keys at **`https://<project>.supabase.co/auth/v1/.well-known/jwks.json`**, cached by Supabase's edge for 10 minutes; **empty if the project uses no asymmetric key** | V | signing-keys; [auth/jwts](https://supabase.com/docs/guides/auth/jwts) |
| Access-token claims include `iss` = `https://<project>.supabase.co/auth/v1`, `sub` (user id), `role` (`authenticated`), `email`, `exp` | V | auth/jwts, "Payload" |
| `aud` is `authenticated` for signed-in users | K | |
| Whether new projects get an asymmetric key by default | not found | check the project's JWT Keys page after creating it |
| `resetPasswordForEmail()` never reveals whether an account exists; the reset link's `redirectTo` must be listed in the project's redirect URLs; the app then calls `updateUser` with the new password | V | [auth/passwords](https://supabase.com/docs/guides/auth/passwords) |
| Sign-up takes `emailRedirectTo` for the confirmation link | V | same |
| **`auth.admin.delete_user(id)`** removes a user; it **requires a secret key** and must run on a server; `should_soft_delete` is optional | V | [Python reference: auth-admin-deleteuser](https://supabase.com/docs/reference/python/auth-admin-deleteuser) |
| Supabase's built-in email sender is rate-limited and meant for testing; a custom SMTP is advised for real users | K | check Auth → Emails in the dashboard |

Design for `app/auth.py` (K for the PyJWT calls, which are standard):
- A dependency `current_user()` reads `Authorization: Bearer <token>`.
- **Asymmetric**: `jwt.PyJWKClient(f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json")`, pick the key
  by `kid`, `jwt.decode(token, key, algorithms=["ES256", "RS256"], audience="authenticated",
  issuer=f"{SUPABASE_URL}/auth/v1")`. Cache the JWKS client at module level (one fetch per
  instance, refresh on unknown `kid`).
- **Legacy fallback**: if the JWKS is empty, `algorithms=["HS256"]` with
  `SFS_SUPABASE_JWT_SECRET`. One setting decides; the code supports both so the dashboard
  choice does not block us.
- Returns `sub` (a UUID) as the user id. No database call to authenticate.
- Requirements: `PyJWT[crypto]` (pulls `cryptography` for ES256/RS256).

## 4. Supabase Storage: the meal photos

| Fact | Code | Source |
| --- | --- | --- |
| Objects in a **non-public bucket** are reachable only by a **time-limited signed URL** made on a server, or a GET to `/storage/v1/object/authenticated/<bucket>/<path>` with the user's token | V | [storage/serving/downloads](https://supabase.com/docs/guides/storage/serving/downloads) |
| Signed URLs use a **storage-specific key**, unaffected by rotating Auth keys; valid until expiry, revoked only via support | V | same |
| Free plan: **1 GB** of file storage | V | supabase.com/pricing (read 25 Oct for APP-PLAN.md) |

Design:
- Private bucket `meal-photos`, path `<user_id>/<meal_id>.jpg`.
- The server uploads with the **secret (service) key** right after the meal is saved, using
  the Storage REST API through `httpx` (already a dependency) or the `supabase` Python
  client 2.33.0. `httpx` alone keeps the bundle small (K).
- `GET /meals...` returns `photo_url`, a signed URL valid for **1 hour**, made per request.
  A short life limits what a leaked link exposes.
- Photo size: not measured yet. At about 50 KB (the 25 October estimate), 1 GB holds about
  20,000 photos; replace this with the real size once Node B prints `E photo bytes=`.
- Deleting a meal deletes its object; deleting an account deletes the `<user_id>/` prefix.

## 5. Data model and API

Postgres types; `uuid` ids for anything that leaves the server, so ids cannot be guessed.
`user_id` is Supabase's `auth.users.id` (`sub`), stored as `uuid` without a foreign key into
the `auth` schema (K: Supabase discourages coupling app tables to `auth` internals); account
deletion removes our rows explicitly.

### Tables

**profiles**: one row per user, created on first `GET /me`.
| Column | Type | Note |
| --- | --- | --- |
| user_id | uuid PK | `sub` |
| display_name | text null | |
| language | text not null default `'fr'` | `fr`, `en`, later `ar` |
| sex | text null | `female`, `male`; only for the estimate |
| birth_year | int null | |
| height_cm | real null | |
| weight_kg | real null | |
| activity | text null | `sedentary`, `light`, `moderate`, `active`, `very_active` |
| goal | text null | `lose`, `keep`, `gain` |
| target_kcal | real null | **the user's choice**; the server's estimate is only a suggestion |
| created_at, updated_at | timestamptz | |

Mifflin-St Jeor, computed on request and labelled an estimate: BMR = 10 × kg + 6.25 × cm −
5 × age + 5 (men) or − 161 (women); × activity factor 1.2 / 1.375 / 1.55 / 1.725 / 1.9;
lose −500 kcal, gain +300 kcal (K: the equation and the usual factors; the deficit and
surplus are common defaults, to be stated as such in the app).

**devices**
| Column | Type | Note |
| --- | --- | --- |
| id | uuid PK | |
| user_id | uuid not null, index | |
| name | text not null default `'Ma balance'` | |
| key_hash | text not null, unique | SHA-256 of the device key; the key itself is shown to the camera once |
| hardware_id | text null | the camera's MAC, for display |
| firmware | text null | from the claim / upload |
| last_seen_at | timestamptz null | updated on each upload |
| created_at, revoked_at | timestamptz | revoked keys are refused |

A device key: 32 random bytes, URL-safe base64, sent as header `X-Device-Key`. Stored only as
a SHA-256 hash: a high-entropy random key needs no slow hash (K).

**pairing_codes**
| Column | Type | Note |
| --- | --- | --- |
| code | text PK | 6 characters from an alphabet without 0/O/1/I, shown `K7P-2Q9` |
| user_id | uuid not null | |
| expires_at | timestamptz not null | now + 15 min |
| used_at | timestamptz null | single use |

**meals**: the existing table, extended.
| Column | Type | Note |
| --- | --- | --- |
| id | **uuid** PK | was an integer |
| user_id | uuid not null | |
| device_id | uuid null | null for manual meals |
| status | text not null | `saved` or `to_name` |
| eaten_on | date not null | |
| created_at | timestamptz | |
| grams | real not null | **D4: measured**, or typed for a manual meal |
| grams_source | text not null | `weighed` or `typed` |
| dish_key, dish_name | text **null** | null while `to_name` (D3) |
| kcal, protein_g, carbohydrate_g, fat_g | real null | null while `to_name` |
| identified_by, confidence | text, real null | `gemini`, `stub`, `manual`, `user` |
| recognition_detail | text null | the recogniser's reason, for the app |
| nutrition_source, nutrition_estimated | text, bool null | |
| photo_path | text null | the Storage path |
| note | text null | |

Indexes: `(user_id, eaten_on, created_at)`, `(user_id, status)`; on devices `(user_id)`; on
pairing_codes `(user_id)`.

### Routes

App routes need `Authorization: Bearer <Supabase access token>`; device routes need
`X-Device-Key`; the claim route needs the pairing code.

| Route | In | Out | Note |
| --- | --- | --- | --- |
| `GET /me` | — | profile + `suggested_kcal` | creates the row on first call |
| `PATCH /me` | profile fields | profile | |
| `DELETE /me` | — | 204 | meals, photos, devices, codes, profile, then `auth.admin.delete_user` |
| `POST /pairing-codes` | — | `{code, expires_at}` | |
| `POST /device/claim` | `{code, hardware_id, firmware}` | `{device_id, device_key}` | 404 for unknown, expired or used codes; the key is returned **once** |
| `POST /device/meals` | multipart `grams`, `image`, `eaten_on?` + `X-Device-Key` | `201 {meal_id, status, dish_name?, grams}` | **unknown dish → 201 with `status: to_name`**, not 422; a recogniser outage stays 502 |
| `GET /devices` / `DELETE /devices/{id}` | — | list / 204 | delete = revoke |
| `GET /meals?date=YYYY-MM-DD` | — | meals with `photo_url` | |
| `GET /meals/inbox` | — | the `to_name` meals | |
| `GET /meals/{id}` | — | one meal | 404 if not the user's |
| `PATCH /meals/{id}` | `{dish_key?, grams?, eaten_on?, note?}` | meal | naming recomputes the macros from the measured grams; changing grams sets `grams_source: typed` |
| `DELETE /meals/{id}` | — | 204 | removes the photo too |
| `POST /meals/manual` | `{dish_key, grams, eaten_on?}` | meal | `grams_source: typed` |
| `GET /totals?date=` | — | the day's sums + target | `to_name` meals counted separately, never guessed |
| `GET /foods?q=` | — | dishes | existing, plus a search |
| `GET /health` | — | as now | |

Camera firmware impact: today it reads a **422** containing "could not be identified" as
*unknown*. With the inbox, an unknown dish is **201 `status: to_name`**; the firmware maps
that to `Outcome::Unknown` so the scale still says NOT RECOGNISED. The old unauthenticated
`POST /meals` stays during the transition, for the laptop setup and the 162 tests, then is
removed or limited to `SFS_ALLOW_ANONYMOUS_UPLOADS=true` locally.

## 6. Testing

- **Keep the 162 tests passing** on SQLite: every new column has a default or is nullable;
  `uuid` via SQLAlchemy's `Uuid` type works on both databases (K).
- **Auth in tests**: generate an ES256 key pair in `conftest.py`, sign tokens with it, and
  point the verifier at that key instead of the JWKS (an `SFS_AUTH_TEST_KEY` hook or a
  dependency override). No network.
- **Storage in tests**: a fake store (in-memory dict) behind a small `PhotoStore` interface,
  like the fake Gemini transport.
- **Postgres-specific checks** (pooler, `prepare_threshold`, migrations): a marked test group
  (`-m postgres`) that runs only when `SFS_TEST_DATABASE_URL` is set, against a local Postgres
  (Docker) or a second Supabase project. Not in the default run.
- **Fake scale CLI**: `python -m app.tools.fake_scale --key <device key> --grams 150 --photo
  meal.jpg [--server https://...]` posts exactly what Node B posts. With `--claim CODE` it
  pairs first and prints the key. Builds the app and demos it without hardware.

## 7. Backend milestones, each testable on its own

1. **Settings and split dependencies.** `requirements-dev.txt`; Python pinned; new settings
   (Supabase URL, secret key, bucket, JWT secret fallback). Test: suite still 162 green.
2. **Postgres-ready `db.py`.** NullPool + `prepare_threshold=None` when the URL is Postgres;
   Alembic set up with the current schema as revision 1. Test: `alembic upgrade head` on a
   local or Supabase Postgres; suite green on SQLite.
3. **Auth.** `current_user()` with JWKS and HS256 fallback; `GET/PATCH /me`; Mifflin-St Jeor
   suggestion. Test: signed test tokens accepted, expired/wrong-issuer/wrong-audience refused.
4. **Meals per user + the inbox.** New columns; `user_id` on every read and write; unknown →
   `to_name`; `PATCH` names a meal and recomputes; manual meals; totals. Test: user A never
   sees user B's meals; an unknown dish lands in the inbox and is named.
5. **Devices and pairing.** Codes, claim, hashed keys, `X-Device-Key` uploads, revoke. Test:
   a code works once and expires; a revoked key gets 401.
6. **Photos.** `PhotoStore` (Supabase REST; fake in tests); signed URLs in responses; delete
   with the meal. Test with the fake; one manual run against the real bucket.
7. **Account deletion.** Everything for the user, then `delete_user`. Test with fakes.
8. **Fake scale CLI.** Test: claim → upload → the meal appears for that user.
9. **Deploy.** Supabase project (US East), Alembic migration via the direct URL, RLS on with no
   policies, private bucket; Vercel project with Root Directory `backend` and the env vars.
   Test: `GET /health`, the fake scale against the live URL, a signed-in `GET /meals`.
10. **Firmware switch-over** (with the firmware plan): https, `X-Device-Key`, 201
    `to_name` → Unknown.

## Open items to check on the day

- Whether the new Supabase project signs tokens with ES256 by default (JWT Keys page).
- The pooler host string (Connect dialog; it cannot be derived).
- Real cold-start time and real photo size, once deployed.
- The built-in email sender's limits on the free plan, before inviting anyone else.
