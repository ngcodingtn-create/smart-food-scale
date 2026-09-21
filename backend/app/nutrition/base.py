"""Nutrition types and the source interface.

A *source* answers one question: "given a dish key, what are its nutrients per
100 g?" Scaling to the measured mass happens once, in :meth:`Macros.scaled`, so
no source can get the multiplication wrong in its own way.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Literal

from pydantic import BaseModel, Field

SourceKind = Literal["local", "usda", "manual"]


class Macros(BaseModel):
    """Energy and the three macronutrients.

    Used both for per-100 g reference values and for a scaled portion — the units
    are whatever the context says, which is why the field names carry no "per
    100 g" suffix.
    """

    kcal: float = Field(ge=0)
    protein_g: float = Field(ge=0)
    carbohydrate_g: float = Field(ge=0)
    fat_g: float = Field(ge=0)

    def scaled(self, grams: float) -> Macros:
        """Scale per-100 g values to a measured mass.

        This is the line the whole project exists to make honest: ``grams`` is
        measured by the load cell, not estimated from a photo.
        """
        factor = grams / 100.0
        return Macros(
            kcal=round(self.kcal * factor, 2),
            protein_g=round(self.protein_g * factor, 2),
            carbohydrate_g=round(self.carbohydrate_g * factor, 2),
            fat_g=round(self.fat_g * factor, 2),
        )

    def atwater_kcal(self) -> float:
        """Energy implied by the macros, using the 4/4/9 Atwater factors.

        A large gap between this and :attr:`kcal` means the row is internally
        inconsistent — which is exactly what invented numbers look like. The
        data-integrity test uses this.
        """
        return 4.0 * self.protein_g + 4.0 * self.carbohydrate_g + 9.0 * self.fat_g


class DishCandidate(BaseModel):
    """What the recogniser is allowed to choose from.

    The recogniser never invents a label: it picks one of these or returns
    nothing. That is what keeps the vocabulary ours rather than a vendor's — see
    docs/decisions.md D3.
    """

    key: str
    name_fr: str
    name_en: str
    aliases: list[str] = Field(default_factory=list)
    description: str = ""

    def prompt_line(self) -> str:
        """One line describing this dish, for a vision model's candidate list."""
        alias = f" (also: {', '.join(self.aliases)})" if self.aliases else ""
        return f"{self.key}: {self.name_fr} / {self.name_en}{alias} — {self.description}"


class NutrientRecord(BaseModel):
    """Per-100 g nutrients for one dish, with its provenance attached.

    Provenance is not decoration. Most values in our Tunisian table are estimates
    derived from recipe composition, and the app has to be able to say so rather
    than presenting them with the same authority as a lab measurement.
    """

    key: str
    name_fr: str
    name_en: str
    per_100g: Macros
    source_kind: SourceKind
    source_citation: str
    estimated: bool
    confidence: Literal["low", "medium", "high"] = "medium"
    typical_portion_g: float | None = None


class NutrientSource(ABC):
    """Anything that can answer "nutrients per 100 g for this dish key"."""

    name: str

    @abstractmethod
    def lookup(self, dish_key: str) -> NutrientRecord | None:
        """Return the record, or ``None`` if this source does not know the dish."""

    def candidates(self) -> list[DishCandidate]:
        """Dishes this source can enumerate.

        Sources backed by a search API (USDA) cannot enumerate their contents, so
        the default is empty and only the local table overrides it.
        """
        return []
