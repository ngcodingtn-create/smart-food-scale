"""The recogniser interface.

One method, one contract: given a photo and the dishes we have nutrient data for,
name one of them or admit you do not know.

``None`` is a first-class answer. A recogniser that always guesses will map
mloukhia onto whatever Western dish looks closest and the macros will be
confidently wrong — which is worse than asking the user to type it in. See
docs/decisions.md D3.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import Sequence

from pydantic import BaseModel, Field

from app.nutrition.base import DishCandidate


class RecognitionResult(BaseModel):
    dish_key: str | None = Field(
        default=None,
        description="Key of the recognised dish, or null when the recogniser "
        "could not identify it. Null is a valid, expected answer.",
    )
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    recogniser: str
    candidates_considered: int = 0
    detail: str | None = None

    @property
    def identified(self) -> bool:
        return self.dish_key is not None


class RecognitionUnavailable(RuntimeError):
    """The recogniser could not be asked: no key, no network, quota spent, a
    malformed reply. Not "I do not know the dish" — that is ``dish_key=None``.

    The API answers it with 502. The camera board treats any 5xx as "try again
    later" and keeps the capture on its card.
    """


class Recogniser(ABC):
    """Swap-in point for the vision backend.

    Implementations live beside this file and are registered in ``registry.py``.
    The backend only ever holds this type, so replacing the stub with a real
    vision API touches one line of configuration.
    """

    name: str

    @abstractmethod
    def recognise(
        self, image: bytes, candidates: Sequence[DishCandidate]
    ) -> RecognitionResult:
        """Identify the dish in ``image`` as one of ``candidates``.

        Implementations must not raise on an unrecognisable image — return a
        result with ``dish_key=None`` instead. They raise
        :class:`RecognitionUnavailable` on a transport failure (network, auth,
        quota), which the API surfaces as a 502.
        """
