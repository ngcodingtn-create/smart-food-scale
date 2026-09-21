"""The meals API — the endpoint the ESP32-CAM actually calls."""

from __future__ import annotations

import datetime as dt

import pytest

from app.nutrition.local import get_local_table


def post_meal(client, *, grams, jpeg=None, **form):
    data = {"grams": str(grams), **{k: str(v) for k, v in form.items() if v is not None}}
    files = {"image": ("frame.jpg", jpeg, "image/jpeg")} if jpeg is not None else None
    return client.post("/meals", data=data, files=files)


# --------------------------------------------------------------- happy path
def test_photo_plus_mass_creates_a_meal(client, jpeg):
    response = post_meal(client, grams=350, jpeg=jpeg)
    assert response.status_code == 201, response.text

    body = response.json()
    assert body["meal"]["grams"] == 350
    assert body["meal"]["dish_key"]
    assert body["meal"]["macros"]["kcal"] > 0
    assert body["recognition"]["identified_by"] == "stub"
    assert body["nutrition"]["source"] == "local"


def test_the_macros_are_the_table_value_times_the_measured_mass(client, jpeg):
    """The project's whole claim, asserted: nutrients per 100 g multiplied by a
    mass that was weighed, not guessed."""
    response = post_meal(client, grams=250, jpeg=jpeg)
    body = response.json()

    per_100g = body["nutrition"]["per_100g"]
    macros = body["meal"]["macros"]

    for field in ("kcal", "protein_g", "carbohydrate_g", "fat_g"):
        assert macros[field] == pytest.approx(per_100g[field] * 2.5, rel=1e-3), field


def test_response_says_whether_the_nutrition_figures_are_estimates(client, jpeg):
    """Every row in our Tunisian table is derived rather than measured. The API
    has to surface that so the app can qualify the number."""
    body = post_meal(client, grams=200, jpeg=jpeg).json()
    assert body["nutrition"]["estimated"] is True
    assert body["nutrition"]["citation"].strip()


# ----------------------------------------------------------- mass validation
@pytest.mark.parametrize("grams", [0, -5, 0.1])
def test_non_positive_or_tiny_mass_is_rejected(client, jpeg, grams):
    """A missing or zero mass silently reintroduces the estimation error the
    device exists to remove, so it is a hard failure rather than a default."""
    assert post_meal(client, grams=grams, jpeg=jpeg).status_code == 422


def test_absurd_mass_reads_as_a_sensor_fault(client, jpeg):
    assert post_meal(client, grams=99999, jpeg=jpeg).status_code == 422


def test_mass_is_required(client, jpeg):
    response = client.post("/meals", files={"image": ("f.jpg", jpeg, "image/jpeg")})
    assert response.status_code == 422


# ------------------------------------------------------------- manual entry
def test_manual_entry_needs_no_photo(client):
    """The app's fallback when the camera is not in the loop, and the path a
    teammate uses to log lunch from their desk."""
    key = get_local_table().keys()[0]
    response = post_meal(client, grams=120, dish_key=key)

    assert response.status_code == 201, response.text
    body = response.json()
    assert body["meal"]["dish_key"] == key
    assert body["recognition"]["identified_by"] == "manual"


def test_an_alias_resolves_to_the_canonical_dish(client):
    response = post_meal(client, grams=110, dish_key="brik")
    assert response.status_code == 201, response.text
    assert response.json()["meal"]["dish_key"] == "brik_a_loeuf"


def test_an_unknown_dish_returns_the_candidate_list(client):
    """So the app can offer manual entry immediately instead of dead-ending."""
    response = post_meal(client, grams=200, dish_key="spaghetti carbonara")
    assert response.status_code == 422

    detail = response.json()["detail"]
    assert detail["known_dishes"]
    assert "lablabi" in detail["known_dishes"]


# ------------------------------------------------------------------ reading
def test_meals_can_be_listed_and_filtered_by_date(client, jpeg):
    today = dt.date.today()
    yesterday = today - dt.timedelta(days=1)

    post_meal(client, grams=300, jpeg=jpeg, eaten_on=today.isoformat())
    post_meal(client, grams=200, jpeg=jpeg, eaten_on=yesterday.isoformat())

    assert len(client.get("/meals").json()) == 2
    assert len(client.get(f"/meals?date={today.isoformat()}").json()) == 1


def test_daily_totals_sum_the_day(client, jpeg):
    day = dt.date(2026, 3, 14)
    first = post_meal(client, grams=300, jpeg=jpeg, eaten_on=day.isoformat()).json()
    second = post_meal(client, grams=150, jpeg=jpeg, eaten_on=day.isoformat()).json()

    totals = client.get(f"/meals/totals?date={day.isoformat()}").json()

    assert totals["meal_count"] == 2
    expected = first["meal"]["macros"]["kcal"] + second["meal"]["macros"]["kcal"]
    assert totals["totals"]["kcal"] == pytest.approx(expected, rel=1e-6)
    assert totals["contains_estimates"] is True


def test_totals_for_an_empty_day_are_zero_not_an_error(client):
    totals = client.get("/meals/totals?date=2020-01-01").json()
    assert totals["meal_count"] == 0
    assert totals["totals"]["kcal"] == 0
    assert totals["contains_estimates"] is False


def test_a_meal_can_be_fetched_and_deleted(client, jpeg):
    meal_id = post_meal(client, grams=180, jpeg=jpeg).json()["meal"]["id"]

    assert client.get(f"/meals/{meal_id}").status_code == 200
    assert client.delete(f"/meals/{meal_id}").status_code == 204
    assert client.get(f"/meals/{meal_id}").status_code == 404


def test_totals_is_not_swallowed_as_a_meal_id(client):
    """Route-ordering regression: /meals/totals must not be parsed as
    /meals/{meal_id}."""
    assert client.get("/meals/totals").status_code == 200


# -------------------------------------------------------------------- meta
def test_health_reports_the_active_configuration(client):
    body = client.get("/health").json()
    assert body["status"] == "ok"
    assert body["recogniser"]["active"] == "stub"
    assert body["nutrition"]["local_dishes"] >= 15
    assert body["nutrition"]["usda_enabled"] is False


def test_foods_endpoint_lists_the_recognisers_vocabulary(client):
    foods = client.get("/foods").json()
    assert len(foods) >= 15
    assert {f["key"] for f in foods} == set(get_local_table().keys())
