# App and server plan

Written 25 October 2026. Asked: "I want a perfect mobile app, with auth and a perfect UI,
where people put their meals and track them"; everything today, with the load cell
simulated, so that tomorrow (26 October) the HX711 is only added.

**Corrected by the research of 25 October**: start the app on Expo **SDK 57** (what Expo Go
runs now), use Supabase's **publishable/secret** keys (the anon/service_role keys are being
retired), keep unrecognised meals with **201 `to_name`**, and send **`eaten_at`**. See
[ROADMAP.md](ROADMAP.md).

This plan covers the server, the app, the camera's Wi-Fi setup and the pairing of a scale
to an account. The hardware steps stay in [BUILD-PLAN.md](BUILD-PLAN.md).

**How this was researched.** Web search and web fetch were broken in this session.
Versions were read from the npm registry; free tiers from the providers' own pricing
pages with curl, on 25 October 2026. App-store rules and the UI patterns of calorie apps
are from general knowledge, marked **(K)**: check them before relying on them.

## The shape of it

```
 NodeMCU scale ──ESP-NOW──► ESP32-CAM ──Wi-Fi + internet──► our server (Vercel, FastAPI)
  (pretend today,              photo + grams,                  │      │        │
   HX711 tomorrow)             device key                      │   Gemini   Supabase
                                                               │  (dish)    Postgres, Auth,
                                         the app (Expo) ◄──────┘            photo storage
                                         signed-in user
```

- **The server stays ours**: the FastAPI backend, now hosted. It owns the meals, the
  nutrient arithmetic and the Gemini call. The app talks to it, not to the database.
- **Supabase**, one free project, gives three things the server needs: the **Postgres**
  database, **Auth** (accounts, passwords, email verification, password reset, sign-in
  tokens) and **Storage** for meal photos. This replaces Neon from the 13 October hosting
  research: one account instead of two, and auth that Expo documents.
- **The scale needs no laptop.** The camera reaches the server over any Wi-Fi with
  internet: home Wi-Fi, or the phone's hotspot with mobile data.

### Why Supabase, and what it costs

| | Supabase free | Clerk free | Our own auth |
| --- | --- | --- | --- |
| Users | 50,000 monthly active | 50,000 monthly retained | Unlimited |
| Also gives | Postgres 500 MB, 1 GB file storage | Auth only: a database still needed | Nothing |
| Password reset, email verification | Built in | Built in | We build it, plus an email service |
| Expo support | Expo's auth guide names it; supabase-js 2.118 | Native Expo module | None |
| Catch | **Free projects pause after 1 week of inactivity**; limit 2 active projects | A second account for the database | Security is ours to get right |

Read from supabase.com/pricing and clerk.com/pricing on 25 October 2026. The pause is
the one real catch: a project left unused for a week must be resumed from the dashboard
before a demo. Neon now offers "Managed Better Auth" too, but documents quickstarts for
Next.js and React, not Expo.

## Accounts only the owner can make (about 30 minutes, all free)

| # | Account | What it gives | Where the secret goes |
| --- | --- | --- | --- |
| 1 | **Supabase** project, region close to Vercel's (US East) | URL, anon key, JWT settings, service key | Service key: Vercel's environment variables only. Never in chat, never in the app |
| 2 | **Vercel**: a second project on the same GitHub repo, root `backend` | The server's `https://` address | Its environment variables page |
| 3 | **Gemini** key (Google AI Studio) | Dish recognition | Vercel environment variables, and `backend/.env` for local use |
| 4 | **Expo** account, and **Expo Go** on the owner's phone | Running the app while it is built; later, Android builds | — |

The app only ever holds Supabase's public "anon" key and the user's own sign-in token.

## The scale joins an account: Wi-Fi setup and pairing in one step

1. In the app: **Ajouter ma balance**. The server gives a one-time **pairing code**, six
   characters, valid 15 minutes, shown big in the app.
2. The camera board, with no Wi-Fi it knows, opens its own network
   `Balance-Setup-XXXX`. The scale's display says so (a new ESP-NOW message from the camera).
3. The owner joins it from the phone's Wi-Fi settings. A setup page opens by itself (a
   captive portal, like hotel Wi-Fi) and lists the networks the camera can see.
4. The owner picks the Wi-Fi, types its password and the **pairing code**. The camera
   saves up to **3 networks** (home, hotspot, lab) and connects to whichever is around.
5. Online, the camera sends the code to the server, which links the scale to the account
   and returns a **device key**, kept on the board. Every photo is then sent with that key,
   and lands in that user's meals. The app shows "Balance connectée".

Why typed codes and not the app talking to the camera directly: while a phone is on a
network with no internet, Android often sends app traffic over mobile data instead, so
the app cannot reliably reach the camera at `192.168.4.1` **(K)**. A page the camera
serves itself works on any phone. Bluetooth setup would feel smoother but needs a custom
app build and Bluetooth running beside the camera on a small board: kept for later.

## The server: what changes

| Change | Why |
| --- | --- |
| Postgres (Supabase) through the existing `SFS_DATABASE_URL`; a Postgres driver | Vercel functions have no lasting disk |
| Verify the Supabase sign-in token on every app route; `user_id` on every meal | Each person sees only their own meals |
| Tables: `profiles` (goals, language), `devices` (owner, key hash, last seen), `pairing_codes`, `meals` gains `user_id`, `device_id`, `status` | Accounts, scales, the to-name inbox |
| **Unrecognised meals are kept** with `status = to_name`, not refused | Today a meal Gemini cannot name never reaches the phone (a known gap since session 3) |
| Device routes: `POST /device/claim` (code → key), `POST /device/meals` (key + photo + grams) | The camera's side |
| App routes: `GET /me`, `PATCH /me` (goals), `GET /meals?date=`, `GET /meals/{id}`, `PATCH /meals/{id}` (name the dish, fix grams), `DELETE /meals/{id}`, `GET /totals?date=`, `GET /foods?q=`, `POST /meals/manual`, `POST /pairing-codes`, `GET /devices`, `DELETE /me` (delete account) | The app's screens |
| Photos to a private Supabase Storage bucket; the app gets short-lived signed links | Photos only their owner can see |
| `SFS_MAX_IMAGE_BYTES` down to 4 MB, CORS narrowed to the app | Vercel's 4.5 MB body limit; a public server |
| A **fake scale** command: posts a photo and grams as a paired device | Build and demo the app without hardware |

The camera firmware changes with it: the setup portal, 3 saved networks, the pairing
code, the device key header, `https` with the host's root certificate (it already refuses
`https` without one), and the new "unknown → kept to name" answer.

## The app

Expo, SDK 58 (`expo` 58.0.19 on npm, 23 October 2026), Expo Router for screens,
`react-native-svg` for the rings and charts, `expo-secure-store` for the sign-in session,
`expo-image` for photos. French first, English second; Arabic, right to left, later.

### Screens

| Screen | What it does |
| --- | --- |
| **Bienvenue / Connexion / Inscription** | Email and password; email verification; forgotten password. Google sign-in later (needs a custom build) |
| **Objectifs** (first launch) | Age, sex, height, weight, activity, goal (lose, keep, gain). A daily calorie target from the Mifflin-St Jeor equation, labelled an **estimate**, and editable |
| **Aujourd'hui** (home) | A ring: kilocalories eaten against the target. Three bars: protein, carbohydrate, fat. The day's meals as cards: photo, dish, **grams with a "pesé" mark** (measured on the scale), kcal. An **"À nommer" banner** when a meal is waiting |
| **Repas** (detail) | Photo, dish, grams, the four numbers, where the nutrients come from and whether they are estimates. Change the dish, correct the grams, delete |
| **À nommer** | Meals Gemini could not name: search our dishes, pick one, the numbers appear |
| **Ajouter** | A meal without the scale: search a dish, type the grams (marked "saisi", not "pesé") |
| **Historique** | Week strip and calendar; each day's total against the target; a 7-day chart |
| **Balance** | Paired scale, last seen, Wi-Fi state; "Ajouter ma balance" with the pairing code and the Wi-Fi steps |
| **Profil** | Goals, language, units, sign out, **delete my account and data** |

### What makes it ours, not a copy of MyFitnessPal (K)

- **Grams are measured.** Every meal card says whether its weight was weighed or typed.
  That is the project's whole point; the UI should make it visible, not bury it.
- **Estimates say so.** Tunisian dishes' nutrients are mostly estimates (decision D3,
  the food table). A small "estimation" mark, with the source one tap away.
- **No guessing.** When Gemini is unsure, the meal waits in "À nommer". The app never
  shows a confident wrong dish.
- **Photo first.** The day reads as a strip of plates, not a spreadsheet.

### Rules the app must meet (K)

- App Store and Google Play both require **in-app account deletion** for apps with
  accounts. It is on the Profile screen from the start.
- A privacy note: photos of meals are stored, and sent to Google's Gemini; on Gemini's free
  tier Google may use them to improve its products.
- Push notifications ("Repas enregistré : 150 g de couscous") need a custom development
  build, not Expo Go **(K)**. Version 1 refreshes when the app opens or on pull-down.

## Order of work

### Today, 25 October

| Who | What |
| --- | --- |
| Owner | Hardware with the pretend scale: [BUILD-PLAN.md](BUILD-PLAN.md), steps 1–11, with the laptop as server |
| Owner | The four accounts above; tell Claude when each exists (no secrets in chat) |
| Claude | Server v2: accounts, scales, pairing, to-name inbox, photos, Postgres; tests; the fake scale |
| Claude | App v1: sign-in, goals, Today, meal detail, To name, Add, Scale, Profile; runs in Expo Go |
| Claude | When the accounts exist: deploy the server; point the app at it |
| Claude | Camera firmware: Wi-Fi setup portal, 3 networks, pairing code, device key, `https` |
| Both | End of day: the fake scale posts a meal, it appears in the app under the owner's account |

Honest size: this is more than one day of work for the app's polish. Today aims at a
working version 1 with every screen above; History's chart, push notifications and an
installable Android build come after.

### Tomorrow, 26 October

1. The HX711, the second button, the microSD card: BUILD-PLAN.md "Tomorrow".
2. The camera on the online server: set up its Wi-Fi and pairing from the app.
3. Real meals, weighed on the load cell, appear in the app.

### After

History's charts, push notifications (custom build), an Android APK through Expo's build
service, Arabic, Google sign-in, the app's icon and store pages.

## Not decided

- **Meal photos kept or not.** Kept (default in this plan): Supabase's free 1 GB holds
  roughly 20,000 photos at about 50 KB each, an estimate until real photo sizes are seen.
- **Who the app is for.** One person (the owner) or anyone who signs up. The plan works
  for both; the difference is whether sign-up is open.
