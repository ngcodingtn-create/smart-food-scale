"""The Gemini recogniser, against a fake Gemini.

No test reaches Google: every request goes to an ``httpx.MockTransport`` that
answers the way the generateContent examples in Google's docs do. What this
cannot check is the real service; ``python -m app.recognition.gemini photo.jpg``
does that, once the owner's key is in backend/.env.
"""

from __future__ import annotations

import base64
import json

import httpx
import pytest

from app.nutrition.base import DishCandidate
from app.recognition.base import RecognitionUnavailable
from app.recognition.gemini import GeminiRecogniser
from app.recognition.registry import available

CANDIDATES = [
    DishCandidate(key="lablabi", name_fr="Lablabi", name_en="Chickpea soup"),
    DishCandidate(key="brik_a_loeuf", name_fr="Brik à l'œuf", name_en="Egg brik"),
    DishCandidate(key="mloukhia", name_fr="Mloukhia", name_en="Jute leaf stew"),
]


def reply(answer: dict, status: int = 200) -> httpx.Response:
    """A generateContent response whose text is ``answer`` as JSON."""
    body = {"candidates": [{"content": {"parts": [{"text": json.dumps(answer)}], "role": "model"}, "finishReason": "STOP"}]}
    return httpx.Response(status, json=body)


def recogniser(handler, key: str = "test-key") -> tuple[GeminiRecogniser, list[httpx.Request]]:
    seen: list[httpx.Request] = []

    def record(request: httpx.Request) -> httpx.Response:
        seen.append(request)
        return handler(request)

    client = httpx.Client(transport=httpx.MockTransport(record))
    return GeminiRecogniser(api_key=key, model="gemini-test", client=client), seen


def test_it_is_registered():
    assert "gemini" in available()


def test_a_confident_known_dish_is_the_answer(jpeg):
    gemini, _ = recogniser(lambda request: reply({"dish_key": "lablabi", "confidence": 0.9, "reason": "chickpeas in broth"}))
    result = gemini.recognise(jpeg, CANDIDATES)
    assert result.dish_key == "lablabi"
    assert result.confidence == pytest.approx(0.9)
    assert result.recogniser == "gemini"
    assert result.candidates_considered == 3
    assert "chickpeas" in (result.detail or "")


def test_the_request_carries_the_photo_the_key_and_our_dishes(jpeg):
    gemini, seen = recogniser(lambda request: reply({"dish_key": "lablabi", "confidence": 0.9, "reason": ""}))
    gemini.recognise(jpeg, CANDIDATES)
    request = seen[0]
    assert request.url.path.endswith("/models/gemini-test:generateContent")
    assert request.headers["x-goog-api-key"] == "test-key"
    assert "key=" not in str(request.url)  # the key goes in a header, never the address
    body = json.loads(request.content)
    parts = body["contents"][0]["parts"]
    assert parts[0]["inlineData"]["mimeType"] == "image/jpeg"
    assert base64.b64decode(parts[0]["inlineData"]["data"]) == jpeg
    prompt = parts[1]["text"]
    for candidate in CANDIDATES:
        assert candidate.key in prompt
    assert body["generationConfig"]["responseMimeType"] == "application/json"


def test_unknown_is_a_valid_answer(jpeg):
    gemini, _ = recogniser(lambda request: reply({"dish_key": "unknown", "confidence": 0.8, "reason": "a pizza"}))
    result = gemini.recognise(jpeg, CANDIDATES)
    assert result.dish_key is None
    assert result.identified is False


def test_a_dish_that_is_not_ours_is_unknown_not_the_nearest(jpeg):
    """D3: an invented label must not be mapped onto one of our keys."""
    gemini, _ = recogniser(lambda request: reply({"dish_key": "hummus", "confidence": 0.95, "reason": ""}))
    result = gemini.recognise(jpeg, CANDIDATES)
    assert result.dish_key is None
    assert "hummus" in (result.detail or "")


def test_an_unsure_guess_is_unknown(jpeg):
    gemini, _ = recogniser(lambda request: reply({"dish_key": "mloukhia", "confidence": 0.2, "reason": "dark stew, hard to say"}))
    result = gemini.recognise(jpeg, CANDIDATES)
    assert result.dish_key is None
    assert result.confidence == 0.0


def test_a_reply_that_is_not_json_is_unknown(jpeg):
    body = {"candidates": [{"content": {"parts": [{"text": "I think it is lablabi"}]}}]}
    gemini, _ = recogniser(lambda request: httpx.Response(200, json=body))
    result = gemini.recognise(jpeg, CANDIDATES)
    assert result.dish_key is None


def test_a_blocked_reply_is_unknown_and_says_why(jpeg):
    gemini, _ = recogniser(lambda request: httpx.Response(200, json={"promptFeedback": {"blockReason": "SAFETY"}}))
    result = gemini.recognise(jpeg, CANDIDATES)
    assert result.dish_key is None
    assert "SAFETY" in (result.detail or "")


@pytest.mark.parametrize("status", [400, 403, 429, 500, 503])
def test_an_error_from_gemini_is_unavailable_not_unknown(jpeg, status):
    """Quota spent or a bad key is not "unknown dish": the capture should be kept and retried."""
    error = {"error": {"code": status, "message": "quota exceeded", "status": "RESOURCE_EXHAUSTED"}}
    gemini, _ = recogniser(lambda request: httpx.Response(status, json=error))
    with pytest.raises(RecognitionUnavailable, match=str(status)):
        gemini.recognise(jpeg, CANDIDATES)


def test_no_network_is_unavailable(jpeg):
    def offline(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("no route", request=request)

    gemini, _ = recogniser(offline)
    with pytest.raises(RecognitionUnavailable):
        gemini.recognise(jpeg, CANDIDATES)


def test_no_key_is_unavailable_and_sends_nothing(jpeg):
    gemini, seen = recogniser(lambda request: reply({"dish_key": "lablabi", "confidence": 1, "reason": ""}), key="")
    with pytest.raises(RecognitionUnavailable, match="SFS_GEMINI_API_KEY"):
        gemini.recognise(jpeg, CANDIDATES)
    assert seen == []


def test_an_empty_image_or_no_candidates_asks_nothing(jpeg):
    gemini, seen = recogniser(lambda request: reply({"dish_key": "lablabi", "confidence": 1, "reason": ""}))
    assert gemini.recognise(b"", CANDIDATES).dish_key is None
    assert gemini.recognise(jpeg, []).dish_key is None
    assert seen == []


def test_the_api_answers_502_when_gemini_is_unavailable(client, jpeg, monkeypatch):
    """The camera board keeps the capture and retries on any 5xx; a 502 says why."""
    import app.routers.meals as meals

    class Down:
        name = "gemini"

        def recognise(self, image, candidates):
            raise RecognitionUnavailable("Gemini answered HTTP 429: quota exceeded")

    monkeypatch.setattr(meals, "get_recogniser", lambda: Down())
    response = client.post("/meals", data={"grams": "150"}, files={"image": ("meal.jpg", jpeg, "image/jpeg")})
    assert response.status_code == 502
    assert "429" in response.json()["detail"]
