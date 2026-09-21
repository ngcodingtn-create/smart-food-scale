"""Scaling per-100 g nutrients to the measured mass.

Four lines of arithmetic, and the single most important four lines in the
project: this is where the measured mass replaces the estimate that photo-only
apps have to make.
"""

from __future__ import annotations

import pytest

from app.nutrition.base import Macros

REFERENCE = Macros(kcal=200.0, protein_g=10.0, carbohydrate_g=20.0, fat_g=8.0)


def test_one_hundred_grams_is_the_identity():
    scaled = REFERENCE.scaled(100.0)
    assert scaled.kcal == 200.0
    assert scaled.protein_g == 10.0
    assert scaled.carbohydrate_g == 20.0
    assert scaled.fat_g == 8.0


def test_half_portion_halves_everything():
    scaled = REFERENCE.scaled(50.0)
    assert scaled.kcal == 100.0
    assert scaled.protein_g == 5.0
    assert scaled.carbohydrate_g == 10.0
    assert scaled.fat_g == 4.0


def test_scaling_is_linear_in_mass():
    assert REFERENCE.scaled(250.0).kcal == pytest.approx(REFERENCE.scaled(125.0).kcal * 2)


def test_a_real_portion():
    """350 g of couscous at 167 kcal/100 g is 584.5 kcal.

    Spelled out because this is the number a demo will show on screen.
    """
    couscous = Macros(kcal=167, protein_g=7.5, carbohydrate_g=14.7, fat_g=8.6)
    plate = couscous.scaled(350.0)
    assert plate.kcal == pytest.approx(584.5)
    assert plate.protein_g == pytest.approx(26.25)
    assert plate.carbohydrate_g == pytest.approx(51.45)
    assert plate.fat_g == pytest.approx(30.1)


def test_a_gram_of_difference_shows_up():
    """The scale resolves ~0.1-0.2 g. Scaling must not round that away for a
    dense food, or the precision we paid for in hardware is thrown away in
    software."""
    harissa = Macros(kcal=205, protein_g=3.5, carbohydrate_g=12.0, fat_g=16.0)
    assert harissa.scaled(15.0).kcal != harissa.scaled(16.0).kcal


def test_zero_mass_is_zero_energy():
    scaled = REFERENCE.scaled(0.0)
    assert scaled.kcal == 0.0
    assert scaled.fat_g == 0.0


def test_atwater_helper_uses_four_four_nine():
    assert REFERENCE.atwater_kcal() == pytest.approx(4 * 10 + 4 * 20 + 9 * 8)


def test_negative_nutrients_are_rejected():
    with pytest.raises(ValueError):
        Macros(kcal=-1, protein_g=0, carbohydrate_g=0, fat_g=0)
