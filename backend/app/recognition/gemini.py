"""Gemini recogniser.

Sends the camera's photo and our candidate list to Google's Gemini API and asks
for one of our dish keys, or ``unknown``. The vocabulary stays ours (decision
D3): an answer that is not one of the candidates is treated as ``unknown``, never
mapped onto the nearest key.

The call is Gemini's ``generateContent`` REST endpoint over ``httpx``, which the
backend already depends on, so there is no SDK to install. Shape checked against
Google's docs on 2026-10-23: the request and response examples on "Migrating to
the Interactions API", which also says ``generateContent`` "remains fully
supported". The newer Interactions API was not used: on that date its own pages
disagreed on its version (``v1beta`` against ``v1beta2``) and on the shape of
``response_format``.

Run it once against the real API with a photo, before trusting it:

    .venv/Scripts/python.exe -m app.recognition.gemini path/to/photo.jpg

Free-tier requests may be read by Google to improve its products; see
ai-docs/research/2026-10-13-free-backend-hosting.md.
"""

from __future__ import annotations

import base64
import json
import sys
from collections.abc import Sequence

import httpx

from app.config import get_settings
from app.nutrition.base import DishCandidate
from app.recognition.base import Recogniser, RecognitionResult, RecognitionUnavailable

UNKNOWN = "unknown"

# What the model must answer with. Gemini's schema dialect (upper-case types) as in
# Google's own structured-output example. The key is validated in code below
# rather than with an enum, so a schema feature the model lacks cannot fail the call.
RESPONSE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "dish_key": {"type": "STRING"},
        "confidence": {"type": "NUMBER"},
        "reason": {"type": "STRING"},
    },
    "required": ["dish_key", "confidence", "reason"],
}


def build_prompt(candidates: Sequence[DishCandidate]) -> str:
    lines = "\n".join(f"- {candidate.prompt_line()}" for candidate in candidates)
    return (
        "This photo was taken from above, by a camera over a kitchen scale, of one "
        "plate of food. Most dishes are Tunisian.\n\n"
        "Which of these dishes is on the plate? Answer with its key exactly as "
        "written before the colon.\n\n"
        f"{lines}\n\n"
        f'If the food is none of these, or you cannot tell, answer "{UNKNOWN}". '
        "Do not pick the closest dish when it is a different dish: a wrong dish "
        "gives the user wrong calories, which is worse than asking them.\n\n"
        "confidence: from 0 to 1, how sure you are of the dish. "
        "reason: one short sentence on what you see."
    )


def mime_type(image: bytes) -> str:
    if image.startswith(b"\x89PNG"):
        return "image/png"
    return "image/jpeg"  # the camera board sends JPEG


class GeminiRecogniser(Recogniser):
    name = "gemini"

    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
        client: httpx.Client | None = None,
    ) -> None:
        """
        Args:
            api_key, model: default to the settings (``SFS_GEMINI_API_KEY``,
                ``SFS_GEMINI_MODEL``).
            client: an ``httpx.Client`` to send the request with. Tests pass
                one with a fake transport, so the suite never reaches Google.
        """
        settings = get_settings()
        self.api_key = api_key if api_key is not None else settings.gemini_api_key
        self.model = model or settings.gemini_model
        self.min_confidence = settings.gemini_min_confidence
        self.url = f"{settings.gemini_base_url}/models/{self.model}:generateContent"
        self.client = client or httpx.Client(timeout=settings.gemini_timeout_s)

    def recognise(
        self, image: bytes, candidates: Sequence[DishCandidate]
    ) -> RecognitionResult:
        considered = len(candidates)
        if not candidates:
            return RecognitionResult(
                recogniser=self.name, candidates_considered=0, detail="no candidate dishes available"
            )
        if not image:
            return RecognitionResult(recogniser=self.name, candidates_considered=considered, detail="empty image")
        if not self.api_key:
            raise RecognitionUnavailable("SFS_GEMINI_API_KEY is not set in backend/.env")

        body = {
            "contents": [
                {
                    "parts": [
                        {"inlineData": {"mimeType": mime_type(image), "data": base64.b64encode(image).decode("ascii")}},
                        {"text": build_prompt(candidates)},
                    ]
                }
            ],
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseSchema": RESPONSE_SCHEMA,
                "temperature": 0,
            },
        }
        try:
            response = self.client.post(self.url, json=body, headers={"x-goog-api-key": self.api_key})
        except httpx.HTTPError as error:
            raise RecognitionUnavailable(f"Gemini could not be reached: {type(error).__name__}") from error
        if response.status_code != 200:
            raise RecognitionUnavailable(f"Gemini answered HTTP {response.status_code}: {_error_message(response)}")

        answer = _answer(response)
        if answer is None:
            return RecognitionResult(
                recogniser=self.name,
                candidates_considered=considered,
                detail=f"Gemini gave no usable answer ({_finish_reason(response)})",
            )

        key = str(answer.get("dish_key", "")).strip()
        try:
            confidence = min(max(float(answer.get("confidence", 0.0)), 0.0), 1.0)
        except (TypeError, ValueError):
            confidence = 0.0
        reason = str(answer.get("reason", "")).strip()[:200]
        known = {candidate.key for candidate in candidates}

        if key == UNKNOWN:
            detail = f"Gemini: not one of ours. {reason}"
            key = None
        elif key not in known:
            # An invented label is an unknown dish, not the nearest one (D3).
            detail = f"Gemini answered {key!r}, which is not one of our dishes. {reason}"
            key = None
        elif confidence < self.min_confidence:
            detail = f"Gemini guessed {key!r} at {confidence:.2f}, under the {self.min_confidence:.2f} threshold. {reason}"
            key = None
        else:
            detail = f"Gemini ({self.model}): {reason}"

        return RecognitionResult(
            dish_key=key,
            confidence=confidence if key else 0.0,
            recogniser=self.name,
            candidates_considered=considered,
            detail=detail.strip(),
        )


def _answer(response: httpx.Response) -> dict | None:
    """The model's JSON answer, or None when there is none (blocked, empty, not JSON)."""
    try:
        parts = response.json()["candidates"][0]["content"]["parts"]
        text = "".join(part.get("text", "") for part in parts)
        answer = json.loads(text)
    except (ValueError, KeyError, IndexError, TypeError):
        return None
    return answer if isinstance(answer, dict) else None


def _finish_reason(response: httpx.Response) -> str:
    try:
        data = response.json()
    except ValueError:
        return "not JSON"
    blocked = data.get("promptFeedback", {}).get("blockReason")
    if blocked:
        return f"blocked: {blocked}"
    try:
        return f"finish reason {data['candidates'][0].get('finishReason', 'unknown')}"
    except (KeyError, IndexError, TypeError):
        return "no candidates"


def _error_message(response: httpx.Response) -> str:
    try:
        return str(response.json()["error"]["message"])[:200]
    except (ValueError, KeyError, TypeError):
        return response.text[:200]


def main(argv: list[str]) -> int:
    """One real call, with the key in backend/.env, to check the whole thing works."""
    if len(argv) != 1:
        print("usage: python -m app.recognition.gemini path/to/photo.jpg")
        return 2
    from app.nutrition.service import get_nutrition_service

    with open(argv[0], "rb") as handle:
        image = handle.read()
    candidates = get_nutrition_service().candidates()  # the same list POST /meals offers
    recogniser = GeminiRecogniser()
    print(f"model {recogniser.model}, {len(candidates)} candidate dishes, {len(image)} bytes")
    try:
        result = recogniser.recognise(image, candidates)
    except RecognitionUnavailable as error:
        print(f"unavailable: {error}")
        return 1
    print(result.model_dump_json(indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
