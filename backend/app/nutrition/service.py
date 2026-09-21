"""Nutrition lookup chain: local table → USDA → nothing.

"Nothing" is deliberate. If neither source knows the dish, the API says so rather
than substituting something plausible — a confident wrong number is the exact
failure mode this project exists to remove. See docs/decisions.md D5.
"""

from __future__ import annotations

from functools import lru_cache

import httpx

from app.config import get_settings
from app.nutrition.base import DishCandidate, NutrientRecord
from app.nutrition.local import get_local_table
from app.nutrition.usda import USDANotConfigured, USDASource


class NutritionService:
    def __init__(self, *, use_usda: bool | None = None) -> None:
        settings = get_settings()
        self.local = get_local_table()
        self.use_usda = settings.usda_enabled if use_usda is None else use_usda
        self.usda = USDASource() if self.use_usda else None

    def candidates(self) -> list[DishCandidate]:
        """The vocabulary the recogniser may choose from.

        Only the local table can enumerate itself — USDA is a search API with no
        listing — so this is exactly our own dish list. That is the point.
        """
        return self.local.candidates()

    def lookup(self, dish_key: str) -> NutrientRecord | None:
        record = self.local.lookup(dish_key)
        if record is not None:
            return record

        if self.usda is None:
            return None

        try:
            return self.usda.lookup(dish_key)
        except (httpx.HTTPError, USDANotConfigured):
            # A remote failure must not take down a meal log that the local table
            # could not have answered anyway. Degrade to "unknown dish".
            return None


@lru_cache
def get_nutrition_service() -> NutritionService:
    return NutritionService()
