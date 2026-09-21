"""The local Tunisian food-composition table.

Consulted *first*, not as a fallback. It is the only source that knows our dishes,
and it needs no network — which keeps the test suite offline and the demo
independent of campus Wi-Fi. See docs/decisions.md D5.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from app.config import get_settings
from app.nutrition.base import DishCandidate, Macros, NutrientRecord, NutrientSource


class LocalTunisianTable(NutrientSource):
    name = "local"

    def __init__(self, path: Path | None = None) -> None:
        self.path = path or get_settings().tunisian_table_path
        self._records: dict[str, NutrientRecord] = {}
        self._candidates: list[DishCandidate] = []
        self._alias_index: dict[str, str] = {}
        self._load()

    # ------------------------------------------------------------------ load
    def _load(self) -> None:
        if not self.path.exists():
            raise FileNotFoundError(
                f"Tunisian food table not found at {self.path}. "
                "It is tracked in git — check backend/data/tunisian_foods.json."
            )

        raw = json.loads(self.path.read_text(encoding="utf-8"))
        self.meta = raw.get("_meta", {})

        for entry in raw["foods"]:
            key = entry["key"]
            source = entry["source"]

            self._records[key] = NutrientRecord(
                key=key,
                name_fr=entry["name_fr"],
                name_en=entry["name_en"],
                per_100g=Macros(**entry["per_100g"]),
                source_kind="local",
                source_citation=source["citation"],
                estimated=entry["estimated"],
                confidence=entry.get("confidence", "medium"),
                typical_portion_g=entry.get("typical_portion_g"),
            )

            self._candidates.append(
                DishCandidate(
                    key=key,
                    name_fr=entry["name_fr"],
                    name_en=entry["name_en"],
                    aliases=entry.get("aliases", []),
                    description=entry.get("description", ""),
                )
            )

            # Alias index, lowercased, so "brik" and "بريك" both resolve.
            self._alias_index[key.lower()] = key
            self._alias_index[entry["name_fr"].lower()] = key
            self._alias_index[entry["name_en"].lower()] = key
            for alias in entry.get("aliases", []):
                self._alias_index[alias.lower()] = key

    # ----------------------------------------------------------------- query
    def lookup(self, dish_key: str) -> NutrientRecord | None:
        record = self._records.get(dish_key)
        if record is not None:
            return record
        # Fall back to the alias index so a manually typed "couscous" resolves.
        resolved = self._alias_index.get(dish_key.strip().lower())
        return self._records.get(resolved) if resolved else None

    def candidates(self) -> list[DishCandidate]:
        return list(self._candidates)

    def keys(self) -> list[str]:
        return list(self._records)

    def __len__(self) -> int:
        return len(self._records)


@lru_cache
def get_local_table() -> LocalTunisianTable:
    return LocalTunisianTable()
