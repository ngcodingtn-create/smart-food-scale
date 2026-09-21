---
title: Backend API
description: FastAPI service that identifies the dish, looks up nutrients and scales them by the measured mass.
sidebar:
  order: 1
---

**Status: ✅ done.** 145 tests passing with no network access, plus a live smoke test
against a real uvicorn process.

## Running it

```bash
cd backend
python -m venv .venv && .venv/Scripts/activate
pip install -r requirements.txt
pytest
uvicorn app.main:app --reload
```

Interactive API reference at `http://127.0.0.1:8000/docs`.

## The endpoint that matters

`POST /meals` — multipart, and the one the ESP32-CAM calls.

```bash
curl -X POST http://127.0.0.1:8000/meals \
  -F "grams=350" \
  -F "image=@frame.jpg"
```

Response, abbreviated:

```json
{
  "meal": {
    "dish_key": "couscous_tunisien_agneau",
    "dish_name": "Couscous tunisien à l'agneau",
    "grams": 350.0,
    "macros": { "kcal": 584.5, "protein_g": 26.25,
                "carbohydrate_g": 51.45, "fat_g": 30.1 }
  },
  "recognition": { "identified_by": "stub", "confidence": 0.5,
                   "candidates_considered": 18 },
  "nutrition": {
    "source": "local",
    "estimated": true,
    "citation": "Team estimate, 2026-09-21. Derived from a plated composition of 55 % cooked semolina…",
    "per_100g": { "kcal": 167.0, "protein_g": 7.5,
                  "carbohydrate_g": 14.7, "fat_g": 8.6 }
  }
}
```

Note what travels with the answer: **where the numbers came from, and whether they're
estimates.** The app is expected to show that, not bury it.

## Full surface

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/meals` | Log a meal from a photo + measured mass |
| `GET` | `/meals?date=` | List meals, optionally one day |
| `GET` | `/meals/totals?date=` | Daily macro totals |
| `GET` | `/meals/{id}` | One meal |
| `DELETE` | `/meals/{id}` | Remove a meal |
| `GET` | `/foods` | Every dish we have data for — the manual-entry picker |
| `GET` | `/foods/{key}` | One dish |
| `GET` | `/health` | Liveness + active configuration |

## Three design decisions worth defending

### Mass is validated hard

Below 0.5 g or above 5000 g is **rejected**, with an error naming the likely cause —
not tared, plate lifted mid-reading, or sensor fault. Defaulting a missing mass would
silently reintroduce exactly the estimation error the device exists to remove.

### "I don't know" is a real answer

When the recogniser can't identify the dish, the API returns **422 with the full
candidate list**, so the app offers manual entry instead of dead-ending. A recogniser
that always guesses maps mloukhia onto the nearest Western dish and the macros are
then confidently wrong — worse than asking.

### Local table first, then USDA, then nothing

Local is consulted **first, not as a fallback**: it's the only source that knows our
dishes, and it needs no network, which keeps the tests offline and the demo
independent of campus Wi-Fi.

USDA is second and cached on disk — the free tier is capped at **1,000 requests/hour
per api.data.gov key**, shared across everyone using that key.

If neither knows the dish, the API says so rather than substituting something
plausible.

## The recogniser is a swap-in point

```python
class Recogniser(ABC):
    name: str

    @abstractmethod
    def recognise(self, image: bytes,
                  candidates: Sequence[DishCandidate]) -> RecognitionResult:
        ...
```

The candidate list comes from **our** food table, so the vocabulary is ours and the
vendor only does the seeing. That inversion is what lets a general vision model name
a Tunisian dish at all — see
[Vision API options](/smart-food-scale/reference/vision-apis/).

`StubRecogniser` ships today: deterministic (hashes the image bytes), offline, and
reports a deliberately middling 0.5 confidence so nobody mistakes it for real
recognition.

## Test suite

```
145 passed in 8.56s
```

| File | Covers |
| --- | --- |
| `test_meals_api.py` | The endpoints, mass validation, manual entry, unknown dishes, totals |
| `test_tunisian_table.py` | Data integrity — Atwater, citations, estimate flags |
| `test_nutrition.py` | Lookup chain, alias resolution, USDA extraction |
| `test_recognition_stub.py` | Determinism, unknown path, registry |
| `test_scaling.py` | The per-100 g → measured-mass arithmetic |

One test asserts that a USDA lookup **without a key raises** rather than calling out —
so a test run can't quietly burn the hourly quota.
