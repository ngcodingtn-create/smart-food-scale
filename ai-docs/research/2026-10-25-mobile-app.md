# The mobile app: how to build it

Researched 25 October 2026 for [APP-PLAN.md](../APP-PLAN.md). Web search and fetch were
down; every fact marked **(V)** was read that day with curl from the page given, mostly
Expo's own Markdown docs (`docs.expo.dev/…/index.md`) and the npm registry. **(K)** is
general knowledge, not checked today.

## The finding that changes the plan

**Expo Go on a phone does not run SDK 58 yet.** Expo's create-expo-app page:
"During the SDK 58 transition period, `create-expo-app@latest` without the `--template`
flag creates an SDK 57 project. If you plan to use Expo Go on a physical device, use an
SDK 57 project." (V, docs.expo.dev/more/create-expo/index.md). SDK 58 was published on
npm on 29 September 2026; SDK 57 on 30 June 2026 (V, registry.npmjs.org/expo, `time`).

So: **start on SDK 57** (plain `npx create-expo-app@latest`), because the owner tests in
Expo Go. Move to SDK 58 when Expo Go on the stores supports it, with
`npx expo install expo@^58 --fix`. APP-PLAN.md said SDK 58; correct it.

A second correction: **Supabase is deprecating its `anon` and `service_role` keys by the
end of 2026**; new projects use a publishable key (`sb_publishable_…`) in the app and a
secret key (`sb_secret_…`) on the server (V, supabase.com/docs/guides/api/api-keys.md).
APP-PLAN.md's "anon key" and "service key" should read publishable and secret.

## 1. Project setup

**Create** (V, create-expo page):

```bash
npx create-expo-app@latest app
```

The `default` template is "designed to build multi-screen apps", with Expo Router and
TypeScript, and maps `@/` to `src/` (V, create-expo page; the Supabase guide says the
default template's `@/` maps to `src`). The repo gets a fourth top-level folder, `app/`
(the README already promises one).

**Versions that go together.** Expo publishes the exact versions each SDK expects in
`expo/bundledNativeModules.json`; `npx expo install <pkg>` picks them. Read 25 October
(V, unpkg.com/expo@57.0.31 and @58.0.19, `bundledNativeModules.json`):

| Package | SDK 57 | SDK 58 |
| --- | --- | --- |
| react-native | 0.86.3 | 0.88.0 |
| react | 19.2.3 | 19.3.0 |
| expo-router | ~57.0.29 | ~58.0.26 |
| react-native-svg | 15.15.4 | 15.16.0 |
| react-native-reanimated (+ react-native-worklets) | 4.5.1 (0.10.1) | 4.7.1 (0.13.0) |
| react-native-gesture-handler | ~2.32.0 | ~3.3.0 |
| expo-image | ~57.0.5 | ~58.0.17 |
| expo-secure-store | ~57.0.4 | ~58.0.2 |
| expo-sqlite | ~57.0.4 | ~58.0.14 |
| @react-native-async-storage/async-storage | 2.2.0 | 2.2.0 |
| expo-localization | ~57.0.2 | ~58.0.5 |
| expo-linking | ~57.0.13 | ~58.0.14 |
| expo-camera / expo-image-picker | ~57.0.6 / ~57.0.20 | ~58.0.12 / ~58.0.10 |
| jest-expo | ~57.0.6 | 58.0.12 (npm latest) |

Not native, so not in that list (V, registry.npmjs.org `latest`): `@supabase/supabase-js`
2.118.0, `i18next` 26.5.10, `react-i18next` 17.1.8, `i18n-js` 4.5.4,
`@testing-library/react-native` 14.1.0.

**Always install with `npx expo install`**, never plain `npm install`, for anything native.

**Routes** (Expo Router, file based). Expo's authentication guide protects routes with
`Stack.Protected guard={…}` in the root layout and keeps the splash screen up while the
session loads (V, docs.expo.dev/router/advanced/authentication/index.md):

```
app/src/app/
  _layout.tsx            Stack; Stack.Protected guard={!!session} → (app), guard={!session} → (auth)
  (auth)/
    welcome.tsx          Bienvenue
    sign-in.tsx          Connexion
    sign-up.tsx          Inscription
    forgot.tsx           Mot de passe oublié
    reset.tsx            new password, opened from the e-mail link
  (app)/
    onboarding.tsx       Objectifs, first launch only (profile has no goal yet)
    (tabs)/
      _layout.tsx        Tabs: Aujourd'hui · Historique · Balance · Profil
      index.tsx          Aujourd'hui
      history.tsx        Historique
      scale.tsx          Ma balance
      profile.tsx        Profil
    meal/[id].tsx        Repas (pushed)
    to-name.tsx          À nommer (pushed, from the banner)
    add.tsx              Ajouter (modal)
app/src/lib/
  supabase.ts  api.ts (our server, with the user's token)  i18n.ts  theme.ts
```

**Expo Go versus a development build**

| Feature | Expo Go | Source |
| --- | --- | --- |
| Remote push notifications | **No on Android since SDK 53**; development build needed | (V) docs.expo.dev/versions/latest/sdk/notifications/index.md |
| Local notifications | Yes | (V) same |
| SecureStore with `requireAuthentication` (biometrics) | Not supported in Expo Go | (V) …/sdk/securestore/index.md |
| E-mail and password sign-in, Supabase sessions | Yes (JS only plus expo-sqlite) | (V) Supabase guide uses only Expo Go-included modules |
| Google sign-in | Needs a development build and OAuth client setup | (K) |
| Camera, image picker, SVG, Reanimated | Yes | (K) |

Expo itself calls Expo Go "a playground … limited and not useful for building
production-grade projects" (V, set-up-your-environment page). Fine for version 1; the
installable APK (section 5) is the real app.

## 2. Supabase Auth in the app

**Storing the session.** Expo's current Supabase guide stores it with
`expo-sqlite/localStorage/install` (V, docs.expo.dev/guides/using-supabase/index.md):

```ts
// app/src/lib/supabase.ts
import 'expo-sqlite/localStorage/install';
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  { auth: { storage: localStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } },
);
```

Why not SecureStore: "Historically, some iOS releases refused values above roughly 2048
bytes" (V, SecureStore page), and a Supabase session (access + refresh token + user) is
bigger than that (K). AsyncStorage also works (it is what Supabase's own React Native
page shows (V, deep-link guide links "react-native-options-async-storage")), but Expo's
guide now prefers expo-sqlite. **Use Expo's pattern.** The URL polyfill Supabase's
quickstart imports is not needed: "Expo installs a `URL` global already" (V, Expo guide).

**Refresh when the app comes back** (V, Expo guide):

```ts
AppState.addEventListener('change', (s) =>
  s === 'active' ? supabase.auth.startAutoRefresh() : supabase.auth.stopAutoRefresh());
```

**E-mail confirmation and password reset need a link back into the app.**
Supabase's mobile deep-linking guide (V, supabase.com/docs/guides/auth/native-mobile-deep-linking.md):
- the app's link (`makeRedirectUri()` from `expo-auth-session`, e.g. `nutriscale://…`)
  goes in Supabase's **Additional Redirect URLs** (Auth → URL configuration);
- the link that opens the app carries tokens; read them with `QueryParams.getQueryParams(url)`
  and call `supabase.auth.setSession({ access_token, refresh_token })`;
- set `scheme` in `app.json` (K).
- With e-mail confirmation on, sign-up returns no session until the address is confirmed
  (V, Expo guide: "session set to null until the address is confirmed").

In Expo Go the link is an `exp://…` address that changes with the laptop's network (K):
for Expo Go testing, **turn "Confirm email" off** in the Supabase project and turn it on
for the APK build. Password reset is the one flow that must open the app; test it on the
APK.

**Our server, not Supabase's tables.** The app never reads Supabase tables directly: it
calls our FastAPI routes with `Authorization: Bearer <access_token>` from
`supabase.auth.getSession()`. So no Row Level Security policies are needed for app reads
(the Expo guide's table/policy example does not apply). The secret key stays on the server.

## 3. Design system (K unless marked)

**Tokens** (one file, `theme.ts`, light and dark, chosen by `useColorScheme()`):

| Token | Use |
| --- | --- |
| `paper`, `card`, `ink`, `inkSoft`, `inkFaint`, `rule` | surfaces and text |
| `accent` | the one action colour (buttons, active tab) |
| `weighed` (green) | the "pesé" badge: measured grams |
| `typed` (neutral) | the "saisi" badge: typed grams |
| `estimate` (amber) | the "estimation" mark on nutrients |
| `protein`, `carbs`, `fat` | the three macro bars, the same three everywhere |
| `danger` | delete, errors |

Reuse the site's palette families so the app and site look like one product.

**Type scale** (system font, so Dynamic Type works): 34 display number (kcal), 28 title,
20 heading, 17 body, 15 secondary, 13 caption; tabular figures for every number.
**Spacing** 4-point grid (4, 8, 12, 16, 24, 32). Touch targets at least 44 pt.

**Components**

| Component | Notes |
| --- | --- |
| `KcalRing` | `react-native-svg` circle, eaten / target; past the target the ring stays full and the number turns `danger`, no shaming copy |
| `MacroBars` | three bars, grams and % of target |
| `MealCard` | photo (expo-image, cached), dish, grams with **pesé / saisi** badge, kcal; whole card tappable |
| `ToNameBanner` | amber, "1 repas à nommer", opens À nommer |
| `EstimateNote` | "estimation · source" on any nutrient from an estimated row |
| `DishPicker` | search over our dishes (from `GET /foods`), French and English names and aliases |
| `EmptyState` | an illustration + one sentence + one action ("Posez une assiette sur la balance") |
| `Skeleton` | grey blocks while loading; never a spinner on a whole screen |
| `OfflineBar` | "Hors ligne : dernières données affichées" |

**What leading calorie apps do (K).** MyFitnessPal: diary by meal (breakfast/lunch/dinner),
huge crowd-sourced database, barcode scan, many ads. Cronometer: micronutrient depth,
verified databases. MacroFactor: adaptive calorie target from weight trend, fast logging.
Yazio/Lose It: friendly onboarding, streaks, photo logging (AI) in recent versions.
The common pain: **portion size is guessed**, and AI photo apps estimate grams from a
picture.

**What ours does differently** (from the project's decisions D3, D4):
1. **Grams are measured.** Every meal says pesé or saisi. Never estimate grams from a photo.
2. **Estimates are labelled.** Tunisian dishes' nutrients are mostly recipe estimates.
3. **No confident wrong dish.** Unsure → À nommer; the user picks, the numbers follow.
4. **Photo first.** The day is a strip of plates.
5. **Tunisian dishes are first-class**, in French with their real names.

**Accessibility (K).** Every icon button has `accessibilityLabel`; the ring announces
"1 189 kilocalories sur 2 000"; respect font scaling (no fixed heights on text); colour is
never the only signal (badges have words); contrast 4.5:1 for text.

**French copy tone (K).** Short, warm, "vous" (or "tu" if the owner prefers: decide once),
no guilt ("Objectif dépassé de 120 kcal", not "Vous avez trop mangé"). Numbers in French
format: `1 189 kcal`, `12,5 g` (thin space, decimal comma) via `Intl.NumberFormat('fr-FR')`.
i18n: `i18next` + `react-i18next` with `expo-localization` for the device language; French
default, English second; Arabic later needs RTL (`I18nManager`) and a restart (K).

## 4. The nine screens

Routes are the server's, from APP-PLAN.md. Every screen: loading = skeleton; error = the
server's message plus "Réessayer"; offline = the last data shown with the offline bar,
writes disabled.

| Screen | Data | Empty state | Interactions |
| --- | --- | --- | --- |
| **Bienvenue / Connexion / Inscription / Mot de passe oublié** | Supabase Auth | — | validation inline; wrong password says so; "e-mail envoyé" after reset |
| **Objectifs** | `PATCH /me` | — | age, sex, height, weight, activity, goal → target from Mifflin-St Jeor, shown as an estimate and editable |
| **Aujourd'hui** | `GET /totals?date=`, `GET /meals?date=` | "Posez une assiette sur la balance" + Ajouter | pull to refresh; refresh on focus; banner to À nommer; card → Repas; swipe days (K) |
| **Repas** | `GET /meals/{id}` (+ signed photo URL) | — | change dish (DishPicker → `PATCH`), correct grams (marks it saisi), delete with confirmation (`DELETE`) |
| **À nommer** | `GET /meals?status=to_name` | "Tout est nommé" | pick a dish → `PATCH /meals/{id}`; next waiting meal opens |
| **Ajouter** | `GET /foods?q=`, `POST /meals/manual` | — | search, grams (numeric keyboard), date; saved as saisi |
| **Historique** | `GET /totals?from=&to=` (per day) | "Pas encore de repas" | week strip; tap a day → that day's Aujourd'hui; 7-day bars against target |
| **Ma balance** | `GET /devices`, `POST /pairing-codes` | "Aucune balance" + Ajouter ma balance | code shown big with a countdown; the Wi-Fi steps illustrated; status polled while open |
| **Profil** | `GET /me`, `PATCH /me`, `DELETE /me` | — | goals, language, sign out, **delete my account and data** (typed confirmation) |

Refresh: no push in Expo Go, so poll `GET /meals?date=` every ~10 s while Aujourd'hui is
on screen and the app is active, and on focus (K). A capture shows up within seconds.

## 5. An installable Android app

EAS Build is available on the Free plan (V, docs.expo.dev/build/setup/index.md). Free:
**15 Android and 15 iOS builds** a month, low-priority queue (V, expo.dev/pricing).
An APK instead of the store's AAB (V, docs.expo.dev/build-reference/apk/index.md):

```json
{ "build": { "preview": { "android": { "buildType": "apk" } } } }
```

```bash
npm install --global eas-cli
eas build -p android --profile preview
```

The build page gives a link and QR code to install the APK on any Android phone (K).
**iOS:** installing outside Expo Go needs an Apple Developer Program membership (K, paid
yearly); TestFlight for testers (K). For a demo, Expo Go on iPhone or the Android APK.

## 6. Testing

| Level | Tool | What |
| --- | --- | --- |
| Unit | `jest-expo` preset, `npx expo install jest-expo jest @types/jest -- --dev` (on Windows `"--" --dev`) (V, docs.expo.dev/develop/unit-testing/index.md) | the kcal/macros formatting, Mifflin-St Jeor, French number format, the API client |
| Component | `@testing-library/react-native` 14.1.0 (V, npm) | MealCard badges, ring label, DishPicker search |
| End to end | Maestro flows (YAML); Expo runs them on EAS Workflows (V, docs.expo.dev/eas/workflows/examples/e2e-tests/index.md, dated 22 July 2026) | sign in → see today → name a meal → delete it |
| Server contract | the backend's pytest suite plus the fake scale | the app's routes answer the shapes the app expects |
| Manual | a checklist per milestone, on the owner's phone | below |

Manual checklist (every milestone): light and dark; French and English; largest text
size; airplane mode; a slow network; sign out and back in; a meal from the fake scale
appears within 15 s.

## 7. Milestones, each runnable in Expo Go

| # | Step | Done when |
| --- | --- | --- |
| A1 | `npx create-expo-app@latest app` (SDK 57), run in Expo Go | the template opens on the owner's phone |
| A2 | Theme tokens, fonts, tab bar, the four empty tabs in French | tabs switch; light and dark both right |
| A3 | Supabase client, Bienvenue / Connexion / Inscription, `Stack.Protected` | sign up, sign out, sign in; session survives a restart |
| A4 | API client with the user's token; Aujourd'hui reading `GET /meals` and `/totals` (server v2) | the fake scale's meal appears |
| A5 | KcalRing, MacroBars, MealCard with pesé/saisi, skeletons, empty and error states | screenshot-level polish on a real day |
| A6 | Repas (detail, change dish, correct grams, delete) | edits round-trip to the server |
| A7 | À nommer with DishPicker | an unknown meal from the fake scale gets a dish |
| A8 | Ajouter (manual meal) | appears marked saisi |
| A9 | Objectifs (first launch) and Profil (goals, language, sign out, delete account) | target recomputes; deletion signs out and removes data |
| A10 | Ma balance: pairing code, Wi-Fi steps, status | (needs the camera's setup portal) the scale is listed |
| A11 | Historique: week strip, 7-day bars | a week of fake meals draws right |
| A12 | i18n complete (FR, EN), accessibility pass, offline bar | manual checklist passes |
| A13 | `eas build -p android --profile preview`, e-mail confirmation on, password-reset deep link | APK installed; reset link opens the app |
| A14 | Move to SDK 58 when Expo Go supports it (`npx expo install expo@^58 --fix`) | the app still passes A12 |

A1–A9 and A11–A12 need only the server (and the fake scale), not the hardware.
