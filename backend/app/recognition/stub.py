"""Offline stub recogniser.

What it is for: letting the whole pipeline — firmware POST, nutrient lookup,
scaling, persistence, app display — be built and tested before anyone has chosen
a vision API or spent a cent on one.

It is **deterministic**: the same JPEG always yields the same dish. That makes the
test suite stable and lets a demo be rehearsed. It is not, and does not pretend to
be, food recognition.
"""

from __future__ import annotations

import hashlib
from collections.abc import Sequence

from app.nutrition.base import DishCandidate
from app.recognition.base import Recogniser, RecognitionResult


class StubRecogniser(Recogniser):
    name = "stub"

    def __init__(self, forced_dish_key: str | None = None) -> None:
        """
        Args:
            forced_dish_key: always return this key. Used by tests that care
                about the downstream arithmetic rather than the identification,
                and by a demo that needs a known dish on screen.
        """
        self.forced_dish_key = forced_dish_key

    def recognise(
        self, image: bytes, candidates: Sequence[DishCandidate]
    ) -> RecognitionResult:
        if self.forced_dish_key is not None:
            return RecognitionResult(
                dish_key=self.forced_dish_key,
                confidence=1.0,
                recogniser=self.name,
                candidates_considered=len(candidates),
                detail="forced by configuration",
            )

        if not candidates:
            return RecognitionResult(
                recogniser=self.name,
                candidates_considered=0,
                detail="no candidate dishes available",
            )

        # An empty body is the one input the stub declines to guess on, so the
        # "unknown dish" path stays reachable in tests and in the app.
        if not image:
            return RecognitionResult(
                recogniser=self.name,
                candidates_considered=len(candidates),
                detail="empty image",
            )

        digest = hashlib.sha256(image).digest()
        index = int.from_bytes(digest[:8], "big") % len(candidates)
        chosen = candidates[index]

        return RecognitionResult(
            dish_key=chosen.key,
            # Deliberately middling. A stub that reports high confidence invites
            # someone to trust it, and someone eventually will.
            confidence=0.5,
            recogniser=self.name,
            candidates_considered=len(candidates),
            detail="deterministic hash of the image bytes — not real recognition",
        )
