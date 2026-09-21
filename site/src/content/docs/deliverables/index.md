---
title: Status board
description: What is built, what is being built, and what has not been started.
sidebar:
  order: 0
---

Honest status. Nothing here is marked done unless it has been run.

## Milestones

| # | Milestone | State | Evidence |
| --- | --- | --- | --- |
| M1 | Repo structure, README, Pages | ✅ Done | 4 commits; layout matches the brief |
| M2 | Backend | ✅ Done | **145 tests passing**, offline; live smoke test against uvicorn |
| M3 | Firmware (both nodes) | 🚧 Started | Node A `platformio.ini` written; PlatformIO 6.2.0 installed |
| M4 | React Native app | 📋 Not started | — |
| M5 | Docs site | 🚧 In progress | This site |

## What "done" means here

A milestone is done when it has been **executed**, not when the code exists. M2 is
marked done because the suite was run and the API was smoke-tested against a real
uvicorn process — not because the files compile.

## The deliverables themselves

| Deliverable | State | Notes |
| --- | --- | --- |
| [Backend API](/smart-food-scale/deliverables/backend/) | ✅ | FastAPI, SQLite, 145 tests |
| [Tunisian food table](/smart-food-scale/deliverables/food-table/) | ✅ | 18 dishes, every figure sourced and flagged |
| Recogniser interface | ✅ | Stub implementation; real vision API pending a decision |
| [Firmware — Node A](/smart-food-scale/deliverables/firmware/) | 🚧 | Build config done, drivers next |
| [Firmware — Node B](/smart-food-scale/deliverables/firmware/) | 📋 | Not started |
| [Mobile app](/smart-food-scale/deliverables/app/) | 📋 | Not started |
| [This site](/smart-food-scale/) | 🚧 | Sidebar + first routes live |

## Open decisions waiting on the team

1. **Which vision API.** Researched and priced — see
   [Vision API options](/smart-food-scale/reference/vision-apis/). Until it's chosen,
   the backend uses the stub.
2. **The original archive is missing.** This repo was reconstructed from the project
   brief because the `smart-food-scale.zip` could not be found on the build machine.
   The BOM and wiring here need diffing against the original workbook when someone
   locates it. See [decision D0](/smart-food-scale/reference/decisions/).

## Known gaps

- No hardware in hand, so no measured accuracy figures. The calibration table is
  written but empty — see [Accuracy](/smart-food-scale/reference/accuracy/).
- The backend is not deployed anywhere. It runs on localhost only.
- No CI yet. The tests pass locally; nothing enforces that on push.
