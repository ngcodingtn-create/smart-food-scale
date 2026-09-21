"""Smart Food Scale backend.

    uvicorn app.main:app --reload            # local
    uvicorn app.main:app --host 0.0.0.0      # reachable from the ESP32 and the phone

Interactive API reference at /docs — the firmware author reads it while writing
the multipart POST, and the app author reads it as the contract.
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db import init_db
from app.nutrition.local import get_local_table
from app.recognition.registry import available, get_recogniser
from app.routers import foods, meals

DESCRIPTION = """
A connected kitchen scale that photographs a meal and returns its calories and
macronutrients.

**The camera answers _what_ the food is; the load cell answers _how much_ of it
there is.** Portion size is measured, never estimated from the image — which is
the error that dominates photo-only calorie apps.

### Flow

1. Node A (ESP32 + HX711) tares, takes a median-filtered weight.
2. Node A tells Node B (ESP32-CAM) to shoot, over ESP-NOW.
3. Node B posts the JPEG and the gram value here as `multipart/form-data`.
4. This service identifies the dish, looks up nutrients per 100 g, multiplies by
   the measured mass, and stores the meal.

### Reading the numbers honestly

Most rows in the Tunisian food table are **estimates** derived from recipe
composition, not laboratory measurements — there is no published composition
table for these dishes. Every response carries `nutrition.estimated` and a
citation so the app can say so rather than implying precision it does not have.
"""


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Smart Food Scale API",
    description=DESCRIPTION,
    version="0.1.0",
    lifespan=lifespan,
)

# Wide-open CORS: the Expo app runs on a different origin (and a different host
# on the LAN) throughout development. Narrow this before anything is deployed
# somewhere the public can reach it.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(meals.router)
app.include_router(foods.router)


@app.get("/health", tags=["meta"], summary="Liveness and configuration")
def health() -> dict:
    """What the firmware pings to check the backend is reachable before a POST."""
    settings = get_settings()
    table = get_local_table()
    return {
        "status": "ok",
        "recogniser": {
            "active": get_recogniser().name,
            "available": available(),
        },
        "nutrition": {
            "local_dishes": len(table),
            "usda_enabled": settings.usda_enabled,
            "usda_key_present": bool(settings.usda_api_key),
        },
        "limits": {
            "min_grams": settings.min_grams,
            "max_grams": settings.max_grams,
            "max_image_bytes": settings.max_image_bytes,
        },
    }
