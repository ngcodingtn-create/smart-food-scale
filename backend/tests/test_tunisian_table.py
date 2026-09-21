"""Data-integrity tests for the Tunisian food table.

This is the project's most original deliverable and the easiest place for a
plausible-looking invented number to hide. These tests are the gate: they do not
check that the figures are *right* — nothing here can — but they check that each
row is internally consistent, carries a citation, and is honest about being an
estimate.

An invented number is very likely to fail the Atwater check, because inventing
four mutually consistent figures is harder than inventing one.
"""

from __future__ import annotations

import json

import pytest

from app.config import get_settings
from app.nutrition.base import Macros

RAW = json.loads(get_settings().tunisian_table_path.read_text(encoding="utf-8"))
FOODS = RAW["foods"]
IDS = [f["key"] for f in FOODS]


def test_brief_requires_at_least_fifteen_dishes():
    assert len(FOODS) >= 15, f"only {len(FOODS)} dishes; the brief asks for 15+"


def test_keys_are_unique():
    assert len(IDS) == len(set(IDS)), "duplicate dish keys"


def test_the_dishes_the_brief_named_are_present():
    """Couscous, lablabi, brik, ojja and mloukhia are the five the brief calls out
    as absent from every existing database. If any of them is missing, the table
    has failed at its one job."""
    joined = " ".join(IDS)
    for required in ("couscous", "lablabi", "brik", "ojja", "mloukhia"):
        assert required in joined, f"{required} missing from the table"


@pytest.mark.parametrize("food", FOODS, ids=IDS)
def test_macros_are_atwater_consistent(food):
    """4 kcal/g protein, 4 kcal/g carbohydrate, 9 kcal/g fat.

    A row whose stated energy disagrees with its own macros is either a typo or
    a number someone made up.
    """
    macros = Macros(**food["per_100g"])
    implied = macros.atwater_kcal()
    tolerance = RAW["_meta"]["atwater_tolerance_percent"]

    assert macros.kcal > 0, f"{food['key']}: zero energy"
    deviation = abs(implied - macros.kcal) / macros.kcal * 100
    assert deviation <= tolerance, (
        f"{food['key']}: stated {macros.kcal} kcal but macros imply "
        f"{implied:.1f} kcal ({deviation:.1f}% off, tolerance {tolerance}%)"
    )


@pytest.mark.parametrize("food", FOODS, ids=IDS)
def test_every_row_cites_a_source(food):
    source = food["source"]
    assert source["citation"].strip(), f"{food['key']}: empty citation"
    assert source["kind"] in {"estimated", "literature", "measured", "database"}


@pytest.mark.parametrize("food", FOODS, ids=IDS)
def test_estimated_rows_are_flagged_as_estimated(food):
    """The brief: "Flag any figure you had to estimate — do not silently invent
    numbers." A row derived from recipe composition must say so."""
    if food["source"]["kind"] == "estimated":
        assert food["estimated"] is True, (
            f"{food['key']}: derived from recipe composition but not flagged "
            "as an estimate"
        )


@pytest.mark.parametrize("food", FOODS, ids=IDS)
def test_macro_masses_fit_in_100_grams(food):
    """Protein + carbohydrate + fat cannot exceed 100 g per 100 g of food.

    Leaves room for water, fibre, ash and salt, so the bound is generous — it
    only catches a genuinely impossible row.
    """
    macros = Macros(**food["per_100g"])
    total = macros.protein_g + macros.carbohydrate_g + macros.fat_g
    assert total <= 100, f"{food['key']}: macros sum to {total} g per 100 g"


@pytest.mark.parametrize("food", FOODS, ids=IDS)
def test_rows_carry_usable_metadata(food):
    assert food["name_fr"].strip()
    assert food["name_en"].strip()
    assert food.get("description", "").strip(), f"{food['key']}: no description"
    assert food.get("confidence") in {"low", "medium", "high"}
    portion = food.get("typical_portion_g")
    assert portion is None or 0 < portion <= 1000


def test_meta_block_warns_that_figures_are_estimates():
    """The header must carry the caveat. Someone will copy this file into a
    report; the caveat has to travel with it."""
    meta = RAW["_meta"]
    assert "READ_THIS_BEFORE_CITING" in meta
    assert "ESTIMATE" in meta["READ_THIS_BEFORE_CITING"].upper()
    assert meta["method"]["known_limitations"]
