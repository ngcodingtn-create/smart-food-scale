"""The nutrition lookup chain.

Offline by construction: USDA is disabled in conftest, so these tests prove the
local table answers on its own — which is also what makes a demo independent of
campus Wi-Fi.
"""

from __future__ import annotations

import pytest

from app.nutrition.local import LocalTunisianTable, get_local_table
from app.nutrition.service import NutritionService
from app.nutrition.usda import USDANotConfigured, USDASource


# ------------------------------------------------------------- local table
def test_the_table_loads_every_dish(table):
    assert len(table) >= 15


def test_lookup_by_canonical_key(table):
    record = table.lookup("lablabi")
    assert record is not None
    assert record.name_fr == "Lablabi"
    assert record.per_100g.kcal > 0


@pytest.mark.parametrize(
    "alias,expected",
    [
        ("brik", "brik_a_loeuf"),
        ("couscous", "couscous_tunisien_agneau"),
        ("Molokhia", "mloukhia"),
        ("salade tunisienne", "slata_tounsia"),
        ("  OJJA  ", "ojja_merguez"),
    ],
)
def test_aliases_resolve_case_and_space_insensitively(table, alias, expected):
    """A teammate typing 'brik' and the Arabic spelling must both land."""
    record = table.lookup(alias)
    assert record is not None, f"{alias!r} did not resolve"
    assert record.key == expected


def test_an_unknown_dish_returns_none_not_a_guess(table):
    assert table.lookup("spaghetti carbonara") is None


def test_every_record_carries_its_provenance(table):
    for key in table.keys():
        record = table.lookup(key)
        assert record.source_kind == "local"
        assert record.source_citation.strip()
        assert isinstance(record.estimated, bool)


def test_a_missing_table_file_fails_loudly(tmp_path):
    with pytest.raises(FileNotFoundError):
        LocalTunisianTable(path=tmp_path / "nope.json")


# ----------------------------------------------------------------- service
def test_the_service_answers_from_the_local_table_with_usda_off():
    service = NutritionService(use_usda=False)
    record = service.lookup("mloukhia")
    assert record is not None
    assert record.source_kind == "local"


def test_the_service_returns_nothing_rather_than_something_plausible():
    """If no source knows the dish, say so. A confident wrong number is the
    failure mode the project exists to remove — docs/decisions.md D5."""
    assert NutritionService(use_usda=False).lookup("beef wellington") is None


def test_candidates_are_exactly_our_own_dish_list():
    """The recogniser's vocabulary is ours, not a vendor's — docs/decisions.md D3."""
    service = NutritionService(use_usda=False)
    assert {c.key for c in service.candidates()} == set(get_local_table().keys())


def test_candidates_carry_enough_context_to_prompt_a_vision_model():
    for candidate in NutritionService(use_usda=False).candidates():
        line = candidate.prompt_line()
        assert candidate.key in line
        assert candidate.name_fr in line


# -------------------------------------------------------------------- usda
def test_usda_without_a_key_raises_rather_than_calling_out():
    """Guards against a test run quietly hitting the network and burning the
    1,000-requests/hour quota."""
    source = USDASource(api_key=None)
    assert source.configured is False
    with pytest.raises(USDANotConfigured):
        source.lookup("rice")


def test_usda_macro_extraction_reads_the_right_nutrient_numbers():
    """1008 kcal, 1003 protein, 1005 carbohydrate, 1004 fat."""
    payload = {
        "fdcId": 123456,
        "description": "Rice, white, cooked",
        "foodNutrients": [
            {"nutrientId": 1008, "value": 130.0},
            {"nutrientId": 1003, "value": 2.7},
            {"nutrientId": 1005, "value": 28.2},
            {"nutrientId": 1004, "value": 0.3},
        ],
    }
    macros = USDASource._extract_macros(payload)
    assert macros.kcal == 130.0
    assert macros.protein_g == 2.7
    assert macros.carbohydrate_g == 28.2
    assert macros.fat_g == 0.3


def test_usda_entry_without_energy_is_a_miss_not_a_zero_calorie_food():
    payload = {"fdcId": 1, "description": "x", "foodNutrients": [{"nutrientId": 1003, "value": 5}]}
    assert USDASource._extract_macros(payload) is None
