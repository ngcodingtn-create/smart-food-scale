"""ORM models."""

from __future__ import annotations

import datetime as dt

from sqlalchemy import Date, DateTime, Float, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


def _utcnow() -> dt.datetime:
    return dt.datetime.now(dt.UTC)


class Meal(Base):
    """One logged meal.

    The macro columns are the *scaled* values — nutrients per 100 g multiplied by
    the measured mass — so the daily totals are a plain SUM and the app never has
    to redo the arithmetic. ``grams`` is kept alongside them so the scaling stays
    auditable: if the per-100 g table is later corrected, every meal can be
    recomputed from the mass that was actually measured.
    """

    __tablename__ = "meals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    # When the meal was eaten (date only — what the app groups by) and when the
    # row was written (full timestamp — ordering within a day).
    eaten_on: Mapped[dt.date] = mapped_column(Date, nullable=False, index=True)
    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )

    # --- What ----------------------------------------------------------------
    dish_key: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    dish_name: Mapped[str] = mapped_column(String(128), nullable=False)

    # --- How much (measured, never estimated) --------------------------------
    grams: Mapped[float] = mapped_column(Float, nullable=False)

    # --- Scaled macros for this portion --------------------------------------
    kcal: Mapped[float] = mapped_column(Float, nullable=False)
    protein_g: Mapped[float] = mapped_column(Float, nullable=False)
    carbohydrate_g: Mapped[float] = mapped_column(Float, nullable=False)
    fat_g: Mapped[float] = mapped_column(Float, nullable=False)

    # --- Provenance ----------------------------------------------------------
    # How the dish was identified: the recogniser's name, or "manual" when the
    # learner typed it in. Kept so a demo can show which meals the vision layer
    # actually got right.
    identified_by: Mapped[str] = mapped_column(String(32), nullable=False)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Where the per-100 g numbers came from: "local" (our Tunisian table) or
    # "usda". Needed because the local table's figures are estimates and the app
    # should be able to say so.
    nutrition_source: Mapped[str] = mapped_column(String(32), nullable=False)
    nutrition_estimated: Mapped[bool] = mapped_column(default=False, nullable=False)

    image_path: Mapped[str | None] = mapped_column(String(255), nullable=True)
    note: Mapped[str | None] = mapped_column(String(255), nullable=True)

    __table_args__ = (Index("ix_meals_eaten_on_created_at", "eaten_on", "created_at"),)

    def __repr__(self) -> str:  # pragma: no cover — debugging aid
        return f"<Meal {self.id} {self.dish_key} {self.grams:g} g {self.kcal:.0f} kcal>"
