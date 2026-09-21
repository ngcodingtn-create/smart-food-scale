"""USDA FoodData Central source.

Second in the lookup chain, after the local Tunisian table. Useful for generic
foods the local table does not carry — plain rice, an apple, a chicken breast.

Disabled by default (``SFS_USDA_ENABLED=false``) so the backend and its tests run
with no network at all. Every response is cached on disk: the free tier is capped
at 1,000 requests/hour per api.data.gov key.
"""

from __future__ import annotations

import httpx

from app.config import get_settings
from app.nutrition.base import Macros, NutrientRecord, NutrientSource
from app.nutrition.cache import DiskCache

# FoodData Central nutrient numbers.
# https://fdc.nal.usda.gov/ — these four are stable across SR Legacy, Foundation
# and Survey (FNDDS) datasets.
NUTRIENT_ENERGY_KCAL = 1008
NUTRIENT_PROTEIN = 1003
NUTRIENT_FAT = 1004
NUTRIENT_CARBOHYDRATE = 1005


class USDANotConfigured(RuntimeError):
    pass


class USDASource(NutrientSource):
    name = "usda"

    def __init__(self, api_key: str | None = None, timeout: float = 10.0) -> None:
        settings = get_settings()
        self.api_key = api_key or settings.usda_api_key
        self.base_url = settings.usda_base_url
        self.timeout = timeout
        self.cache = DiskCache(settings.cache_dir)

    @property
    def configured(self) -> bool:
        return bool(self.api_key)

    # ------------------------------------------------------------------ query
    def lookup(self, dish_key: str) -> NutrientRecord | None:
        if not self.configured:
            raise USDANotConfigured(
                "USDA lookup attempted without an API key. Set SFS_USDA_API_KEY, "
                "or leave SFS_USDA_ENABLED=false to stay offline."
            )

        payload = self._search(dish_key)
        if payload is None:
            return None

        macros = self._extract_macros(payload)
        if macros is None:
            return None

        return NutrientRecord(
            key=dish_key,
            name_fr=payload.get("description", dish_key),
            name_en=payload.get("description", dish_key),
            per_100g=macros,
            source_kind="usda",
            source_citation=(
                f"USDA FoodData Central, fdcId {payload.get('fdcId')} — "
                f"{payload.get('description')} ({payload.get('dataType')})"
            ),
            # USDA figures are measured, not derived by us.
            estimated=False,
            confidence="high",
        )

    def _search(self, query: str) -> dict | None:
        cache_key = f"search_{query}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached or None  # an empty dict caches a known miss

        response = httpx.get(
            f"{self.base_url}/foods/search",
            params={"query": query, "pageSize": 1, "api_key": self.api_key},
            timeout=self.timeout,
        )
        response.raise_for_status()
        foods = response.json().get("foods", [])

        best = foods[0] if foods else None
        self.cache.set(cache_key, best or {})
        return best

    @staticmethod
    def _extract_macros(food: dict) -> Macros | None:
        """Pull the four macros out of a FoodData Central food object.

        USDA reports per 100 g for the dataset types we query. Returns ``None``
        when energy is missing, which happens on some branded entries.
        """
        found: dict[int, float] = {}
        for nutrient in food.get("foodNutrients", []):
            number = nutrient.get("nutrientId") or nutrient.get("nutrientNumber")
            value = nutrient.get("value")
            if number is None or value is None:
                continue
            try:
                found[int(number)] = float(value)
            except (TypeError, ValueError):
                continue

        if NUTRIENT_ENERGY_KCAL not in found:
            return None

        return Macros(
            kcal=found.get(NUTRIENT_ENERGY_KCAL, 0.0),
            protein_g=found.get(NUTRIENT_PROTEIN, 0.0),
            carbohydrate_g=found.get(NUTRIENT_CARBOHYDRATE, 0.0),
            fat_g=found.get(NUTRIENT_FAT, 0.0),
        )
