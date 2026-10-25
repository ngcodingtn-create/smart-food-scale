# Roadmap: the project end to end

Written 25 October 2026. The owner asked for the whole project, end to end, built
together one step at a time, each step explained visually with their own parts.

**The roadmap lives in code**: `web/components/admin/roadmap.ts` holds every milestone
and step; `/admin/build` draws it (the map, each milestone, each step with the owner's
photos, the wiring lit, the checks, what the board should show, and the live tool). This
file says why it is ordered so, and where each milestone's detail comes from.

**Who does what.** Each step says it: "You do" is only what needs hands (plug in, wire,
press, look, the hotspot, the one Wi-Fi password, the firewall prompt, the weights);
"Claude does" is everything from the laptop (the port, flashing, boot lines, commands,
tests, calibration), with `firmware/tools/board.py`.

## The milestones

| # | Milestone | When | Detail from |
| --- | --- | --- | --- |
| 0 | Know the parts | 25 Oct | Written in full: 6 steps, hotspots on the owner's photos |
| 1 | The scale's brain (pretend scale, display, tare, buzzer) | 25 Oct | Written in full: 7 steps |
| 2 | The camera online (flash, hotspot, laptop server, test photo) | 25 Oct | 4 written, 1 draft; [hardware guide](research/2026-10-25-hardware-build-guide.md) §3 |
| 3 | The light (camera on the breadboard, six LEDs) | 25 Oct | Drafts; hardware guide §3.4–3.6 |
| 4 | Both boards together (ESP-NOW, the whole-meal test, rehearsing the real weight on the pretend one) | 25 Oct | Drafts, and the rehearsal written; [simulating the weight](research/2026-10-25-simulating-the-weight.md) |
| 5 | The server online (Supabase, Vercel, Gemini, accounts, fake scale) | after M4 | Drafts; [backend research](research/2026-10-25-backend-hosting-auth.md) |
| 6 | The app (Expo, sign-in, Aujourd'hui, À nommer) | after M5 | Drafts; [app research](research/2026-10-25-mobile-app.md) |
| 7 | The scale joins your account (setup Wi-Fi, pairing, https) | after M6 | Drafts; [firmware research](research/2026-10-25-firmware-connectivity.md) |
| 8 | Finished scale (microSD, own power, rig; still the pretend weight and one button) | after M7 | Drafts; hardware guide §7, §8.1 |
| 9 | **Real weight, last** (HX711, load cell, one button or two, sign, mount, calibrate, accuracy, demo) | last, with the HX711 | Drafts; hardware guide §4–6, §8 |

Order: hardware first while the parts are on the desk; the server before the app because
the app is useless without it; pairing once the server and the app exist; **the real
weight last**, as the owner asked on 25 October. Until then the pretend scale stands in
for the HX711 and the load cell, and lands like a real plate
([why that, and not something else](research/2026-10-25-simulating-the-weight.md)).

A draft step shows its title and goal and says it is being written. Its detail is filled
in from the research file named above when the build reaches it.

## What the research of 25 October changed

| Finding | Effect |
| --- | --- |
| Expo Go on phones runs **SDK 57** during the SDK 58 transition (Expo's own page) | The app starts on SDK 57; upgrade when Expo Go follows |
| Supabase is retiring its `anon` and `service_role` keys by end of 2026 | Use the **publishable** key in the app, the **secret** key on the server |
| An unrecognised dish should be **kept** (201, `status: to_name`), not refused with 422 | Server and camera firmware change together in M6/M8 |
| `eaten_on` is a UTC date: a meal eaten in Tunisia between 00:00 and 01:00 gets yesterday's date | Send `eaten_at`, a full timestamp; the server derives the local day |
| Vercel's `*.vercel.app` certificates chain to Google Trust Services, vercel.com's to Let's Encrypt | Compile in both roots (and GlobalSign's cross-sign) for the camera's https |
| In setup mode the camera's own Wi-Fi and a joined network share one channel | The camera joins nothing until the owner saves the setup page |
| WiFiManager does not save several networks | Write our own small setup page with the core's web and DNS servers |
| `wiring.ts` has no wires for the camera on the breadboard (fed through 4 jumpers from the MB base) | Add them before milestone 3 can be drawn |
| Supabase pooler in transaction mode needs prepared statements off (`prepare_threshold=None`) and `NullPool` | Server v2's database settings |
| Supabase's Data API serves `public` tables unless Row Level Security blocks it | Turn RLS on with no policies: only the server reads the database |

## Rules for writing a step

One idea per step. Name parts by `kit.ts` id and wires by `wiring.ts` id. Every step has
a check the owner can tick and, where a board is involved, what it should show
(`expect`). Hotspots are percentages of the owner's photo, measured on a grid; a `view`
window frames the part. Nothing invented: a value not measured says so.
