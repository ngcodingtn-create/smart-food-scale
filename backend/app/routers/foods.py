"""The food table, exposed for the app's manual-entry picker."""

from __future__ import annotations

import json

from fastapi import APIRouter, HTTPException, status

from app.config import get_settings
from app.nutrition.base import Macros
from app.nutrition.local import get_local_table
from app.schemas import FoodOut

router = APIRouter(prefix="/foods", tags=["foods"])


def _entries() -> list[dict]:
    raw = json.loads(get_settings().tunisian_table_path.read_text(encoding="utf-8"))
    return raw["foods"]


@router.get("", response_model=list[FoodOut], summary="Every dish we have data for")
def list_foods() -> list[FoodOut]:
    """The recogniser's vocabulary and the app's manual-entry list, one and the same."""
    return [
        FoodOut(
            key=e["key"],
            name_fr=e["name_fr"],
            name_en=e["name_en"],
            aliases=e.get("aliases", []),
            description=e.get("description", ""),
            per_100g=Macros(**e["per_100g"]),
            typical_portion_g=e.get("typical_portion_g"),
            estimated=e["estimated"],
            confidence=e.get("confidence", "medium"),
        )
        for e in _entries()
    ]


@router.get("/{key}", response_model=FoodOut, summary="One dish")
def get_food(key: str) -> FoodOut:
    record = get_local_table().lookup(key)
    if record is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            detail=f"No dish {key!r} in the local table.",
        )
    for entry in _entries():
        if entry["key"] == record.key:
            return FoodOut(
                key=entry["key"],
                name_fr=entry["name_fr"],
                name_en=entry["name_en"],
                aliases=entry.get("aliases", []),
                description=entry.get("description", ""),
                per_100g=Macros(**entry["per_100g"]),
                typical_portion_g=entry.get("typical_portion_g"),
                estimated=entry["estimated"],
                confidence=entry.get("confidence", "medium"),
            )
    raise HTTPException(status.HTTP_404_NOT_FOUND, detail=f"No dish {key!r}.")
