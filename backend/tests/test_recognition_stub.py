"""The stub recogniser and the registry."""

from __future__ import annotations

import pytest

from app.nutrition.base import DishCandidate
from app.recognition.registry import available, get_recogniser
from app.recognition.stub import StubRecogniser

CANDIDATES = [
    DishCandidate(key="lablabi", name_fr="Lablabi", name_en="Chickpea soup"),
    DishCandidate(key="brik_a_loeuf", name_fr="Brik à l'œuf", name_en="Egg brik"),
    DishCandidate(key="mloukhia", name_fr="Mloukhia", name_en="Jute leaf stew"),
]


def test_same_image_always_gives_the_same_dish(jpeg):
    """Determinism is what makes the test suite stable and a demo rehearsable."""
    stub = StubRecogniser()
    first = stub.recognise(jpeg, CANDIDATES)
    second = stub.recognise(jpeg, CANDIDATES)
    assert first.dish_key == second.dish_key


def test_it_only_ever_returns_a_candidate(jpeg, another_jpeg):
    stub = StubRecogniser()
    for image in (jpeg, another_jpeg):
        result = stub.recognise(image, CANDIDATES)
        assert result.dish_key in {c.key for c in CANDIDATES}


def test_empty_image_declines_to_guess():
    """`None` has to stay reachable, or the unknown-dish path never gets tested
    and the app's manual fallback rots."""
    result = StubRecogniser().recognise(b"", CANDIDATES)
    assert result.dish_key is None
    assert result.identified is False


def test_no_candidates_means_no_answer(jpeg):
    result = StubRecogniser().recognise(jpeg, [])
    assert result.dish_key is None
    assert result.candidates_considered == 0


def test_confidence_is_middling_not_high(jpeg):
    """A stub reporting 0.99 invites someone to trust it, and someone eventually
    will."""
    result = StubRecogniser().recognise(jpeg, CANDIDATES)
    assert 0.0 < result.confidence < 0.8


def test_forced_dish_overrides_everything(jpeg):
    stub = StubRecogniser(forced_dish_key="mloukhia")
    assert stub.recognise(jpeg, CANDIDATES).dish_key == "mloukhia"


def test_result_says_which_recogniser_answered(jpeg):
    assert StubRecogniser().recognise(jpeg, CANDIDATES).recogniser == "stub"


def test_registry_exposes_the_stub():
    assert "stub" in available()
    assert get_recogniser().name == "stub"
