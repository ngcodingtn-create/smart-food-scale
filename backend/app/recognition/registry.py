"""Recogniser registry.

Adding a real vision backend is: write the class, add one line here, set
``SFS_RECOGNISER`` in ``.env``. Nothing else in the backend changes.
"""

from __future__ import annotations

from functools import lru_cache

from app.config import get_settings
from app.recognition.base import Recogniser
from app.recognition.gemini import GeminiRecogniser
from app.recognition.stub import StubRecogniser

_BUILDERS: dict[str, type[Recogniser]] = {
    "stub": StubRecogniser,
    "gemini": GeminiRecogniser,  # the owner's choice, 13 October 2026; docs/decisions.md D3
    # "claude":  ClaudeRecogniser,
    # "openai":  OpenAIRecogniser,
}


def available() -> list[str]:
    return sorted(_BUILDERS)


@lru_cache
def get_recogniser() -> Recogniser:
    name = get_settings().recogniser
    try:
        builder = _BUILDERS[name]
    except KeyError:
        raise ValueError(
            f"Unknown recogniser {name!r}. Available: {', '.join(available())}. "
            "Set SFS_RECOGNISER in backend/.env."
        ) from None
    return builder()
