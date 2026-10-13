"""Meal endpoints.

``POST /meals`` is the one the ESP32-CAM calls. Everything else is for the app.
"""

from __future__ import annotations

import datetime as dt
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db
from app.models import Meal
from app.nutrition.base import Macros
from app.nutrition.service import get_nutrition_service
from app.recognition.base import RecognitionResult
from app.recognition.registry import get_recogniser
from app.schemas import DailyTotals, MealCreated, MealOut, NutritionInfo, RecognitionInfo

router = APIRouter(prefix="/meals", tags=["meals"])


def _validate_grams(grams: float) -> float:
    """The mass is the whole point of the device, so it is checked hard.

    A missing, zero or absurd value silently reintroduces the estimation error
    the scale exists to remove. See docs/decisions.md D4.
    """
    settings = get_settings()
    if grams < settings.min_grams:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=(
                f"grams must be at least {settings.min_grams} g — got {grams}. "
                "A non-positive mass usually means the scale was not tared, or the "
                "plate was lifted during the reading."
            ),
        )
    if grams > settings.max_grams:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=(
                f"grams must be at most {settings.max_grams} g — got {grams}. "
                "This is past the range of a 3 kg cell and reads as a sensor fault "
                "rather than a real plate of food."
            ),
        )
    return grams


@router.post(
    "",
    response_model=MealCreated,
    status_code=status.HTTP_201_CREATED,
    summary="Log a meal from a photo and a measured mass",
)
async def create_meal(
    grams: float = Form(
        ...,
        description="Measured mass in grams, from the load cell. Required.",
    ),
    image: UploadFile | None = File(
        None,
        description="JPEG from the ESP32-CAM. Omit for manual entry.",
    ),
    dish_key: str | None = Form(
        None,
        description="Skip recognition and use this dish. The app's manual fallback.",
    ),
    eaten_on: dt.date | None = Form(
        None,
        description="Date the meal was eaten. Defaults to today (UTC).",
    ),
    note: str | None = Form(None, max_length=255),
    db: Session = Depends(get_db),
) -> MealCreated:
    settings = get_settings()
    _validate_grams(grams)

    nutrition = get_nutrition_service()
    candidates = nutrition.candidates()

    # --- Identify -----------------------------------------------------------
    if dish_key:
        result = RecognitionResult(
            dish_key=dish_key,
            confidence=1.0,
            recogniser="manual",
            candidates_considered=len(candidates),
            detail="dish supplied by the client",
        )
        image_bytes = b""
    else:
        image_bytes = await image.read() if image is not None else b""
        if len(image_bytes) > settings.max_image_bytes:
            raise HTTPException(
                status.HTTP_413_CONTENT_TOO_LARGE,
                detail=(
                    f"Image is {len(image_bytes)} bytes; the limit is "
                    f"{settings.max_image_bytes}. Lower the camera's JPEG quality "
                    "or frame size."
                ),
            )
        result = get_recogniser().recognise(image_bytes, candidates)

    recognition_info = RecognitionInfo(
        identified_by=result.recogniser,
        confidence=result.confidence,
        candidates_considered=result.candidates_considered,
        detail=result.detail,
    )

    if result.dish_key is None:
        # Unknown is a legitimate outcome, not a server error. 422 with the
        # candidate list so the app can offer manual entry straight away.
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={
                "detail": "Dish could not be identified.",
                "recognition": recognition_info.model_dump(),
                "known_dishes": [c.key for c in candidates],
            },
        )

    # --- Look up nutrients --------------------------------------------------
    record = nutrition.lookup(result.dish_key)
    if record is None:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={
                "detail": (
                    f"No nutrient data for dish {result.dish_key!r}. "
                    "Add it to backend/data/tunisian_foods.json, or enable USDA."
                ),
                "recognition": recognition_info.model_dump(),
                "known_dishes": [c.key for c in candidates],
            },
        )

    # --- Scale by the MEASURED mass ----------------------------------------
    macros: Macros = record.per_100g.scaled(grams)

    # --- Optionally keep the photo -----------------------------------------
    image_path = None
    if settings.store_images and image_bytes:
        settings.upload_dir.mkdir(parents=True, exist_ok=True)
        image_path = str(settings.upload_dir / f"{uuid.uuid4().hex}.jpg")
        with open(image_path, "wb") as handle:
            handle.write(image_bytes)

    meal = Meal(
        eaten_on=eaten_on or dt.datetime.now(dt.UTC).date(),
        dish_key=record.key,
        dish_name=record.name_fr,
        grams=grams,
        kcal=macros.kcal,
        protein_g=macros.protein_g,
        carbohydrate_g=macros.carbohydrate_g,
        fat_g=macros.fat_g,
        identified_by=result.recogniser,
        confidence=result.confidence,
        nutrition_source=record.source_kind,
        nutrition_estimated=record.estimated,
        image_path=image_path,
        note=note,
    )
    db.add(meal)
    db.commit()
    db.refresh(meal)

    return MealCreated(
        meal=MealOut.from_model(meal),
        recognition=recognition_info,
        nutrition=NutritionInfo(
            source=record.source_kind,
            citation=record.source_citation,
            estimated=record.estimated,
            confidence=record.confidence,
            per_100g=record.per_100g,
        ),
    )


# Declared before /{meal_id} so "totals" is not swallowed as an id.
@router.get("/totals", response_model=DailyTotals, summary="Macro totals for one day")
def daily_totals(
    date: dt.date | None = Query(None, description="Defaults to today (UTC)."),
    db: Session = Depends(get_db),
) -> DailyTotals:
    day = date or dt.datetime.now(dt.UTC).date()
    meals = db.scalars(select(Meal).where(Meal.eaten_on == day)).all()

    return DailyTotals(
        date=day,
        meal_count=len(meals),
        totals=Macros(
            kcal=round(sum(m.kcal for m in meals), 2),
            protein_g=round(sum(m.protein_g for m in meals), 2),
            carbohydrate_g=round(sum(m.carbohydrate_g for m in meals), 2),
            fat_g=round(sum(m.fat_g for m in meals), 2),
        ),
        contains_estimates=any(m.nutrition_estimated for m in meals),
    )


@router.get("", response_model=list[MealOut], summary="List meals")
def list_meals(
    date: dt.date | None = Query(None, description="Filter to one day. Omit for all."),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[MealOut]:
    statement = select(Meal)
    if date is not None:
        statement = statement.where(Meal.eaten_on == date)
    statement = statement.order_by(Meal.eaten_on.desc(), Meal.created_at.desc()).limit(limit)

    return [MealOut.from_model(m) for m in db.scalars(statement).all()]


@router.get("/{meal_id}", response_model=MealOut, summary="One meal")
def get_meal(meal_id: int, db: Session = Depends(get_db)) -> MealOut:
    meal = db.get(Meal, meal_id)
    if meal is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=f"No meal {meal_id}.")
    return MealOut.from_model(meal)


@router.delete("/{meal_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a meal")
def delete_meal(meal_id: int, db: Session = Depends(get_db)) -> None:
    meal = db.get(Meal, meal_id)
    if meal is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=f"No meal {meal_id}.")
    db.delete(meal)
    db.commit()
