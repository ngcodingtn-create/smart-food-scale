"""Request and response models for the HTTP API."""

from __future__ import annotations

import datetime as dt

from pydantic import BaseModel, ConfigDict, Field

from app.nutrition.base import Macros


class RecognitionInfo(BaseModel):
    """How the dish was identified, surfaced so the app can be honest about it."""

    identified_by: str = Field(description="Recogniser name, or 'manual'.")
    confidence: float | None = None
    candidates_considered: int = 0
    detail: str | None = None


class NutritionInfo(BaseModel):
    """Where the per-100 g numbers came from."""

    source: str = Field(description="'local' (our Tunisian table) or 'usda'.")
    citation: str
    estimated: bool = Field(
        description="True when the figures were derived from recipe composition "
        "rather than measured. The app should mark these."
    )
    confidence: str = "medium"
    per_100g: Macros


class MealOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    eaten_on: dt.date
    created_at: dt.datetime

    dish_key: str
    dish_name: str

    grams: float = Field(description="Measured by the load cell, never estimated.")
    macros: Macros = Field(description="Scaled to the measured mass.")

    identified_by: str
    confidence: float | None = None
    nutrition_source: str
    nutrition_estimated: bool
    note: str | None = None

    @classmethod
    def from_model(cls, meal) -> MealOut:  # noqa: ANN001 — app.models.Meal
        return cls(
            id=meal.id,
            eaten_on=meal.eaten_on,
            created_at=meal.created_at,
            dish_key=meal.dish_key,
            dish_name=meal.dish_name,
            grams=meal.grams,
            macros=Macros(
                kcal=meal.kcal,
                protein_g=meal.protein_g,
                carbohydrate_g=meal.carbohydrate_g,
                fat_g=meal.fat_g,
            ),
            identified_by=meal.identified_by,
            confidence=meal.confidence,
            nutrition_source=meal.nutrition_source,
            nutrition_estimated=meal.nutrition_estimated,
            note=meal.note,
        )


class MealCreated(BaseModel):
    """What POST /meals returns: the stored meal plus how we got there."""

    meal: MealOut
    recognition: RecognitionInfo
    nutrition: NutritionInfo


class DailyTotals(BaseModel):
    date: dt.date
    meal_count: int
    totals: Macros
    # True when any meal that day used an estimated nutrient row, so the app can
    # qualify the number instead of presenting it as exact.
    contains_estimates: bool


class FoodOut(BaseModel):
    """One row of the food table, for the app's manual-entry picker."""

    key: str
    name_fr: str
    name_en: str
    aliases: list[str] = Field(default_factory=list)
    description: str = ""
    per_100g: Macros
    typical_portion_g: float | None = None
    estimated: bool
    confidence: str


class UnknownDishError(BaseModel):
    """Returned when no source knows the dish.

    Carries the candidate list so the app can offer manual entry immediately
    rather than making the user start over.
    """

    detail: str
    recognition: RecognitionInfo
    known_dishes: list[str]
