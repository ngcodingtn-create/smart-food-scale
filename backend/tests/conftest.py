"""Test fixtures.

The environment is configured **before** any ``app`` module is imported, because
``app.db`` builds its engine at import time from the settings. Setting these
later would silently test against the real development database.
"""

from __future__ import annotations

import os
import tempfile
from pathlib import Path

_TMP = Path(tempfile.mkdtemp(prefix="sfs-tests-"))

os.environ["SFS_DATABASE_URL"] = f"sqlite:///{(_TMP / 'test.db').as_posix()}"
os.environ["SFS_RECOGNISER"] = "stub"
# No network in the test suite, ever. USDA stays off.
os.environ["SFS_USDA_ENABLED"] = "false"
os.environ["SFS_USDA_API_KEY"] = ""
os.environ["SFS_STORE_IMAGES"] = "false"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.db import Base, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.nutrition.local import get_local_table  # noqa: E402


@pytest.fixture(autouse=True)
def fresh_database():
    """A clean schema for every test, so ordering cannot leak state."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client() -> TestClient:
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def jpeg() -> bytes:
    """Stand-in for a camera frame.

    The stub recogniser only hashes the bytes, so this does not need to decode as
    a real JPEG — but it starts with the JPEG SOI marker so anything that sniffs
    the magic number behaves.
    """
    return b"\xff\xd8\xff\xe0" + b"smart-food-scale test frame" * 8


@pytest.fixture
def another_jpeg() -> bytes:
    return b"\xff\xd8\xff\xe0" + b"a completely different frame" * 8


@pytest.fixture
def table():
    return get_local_table()


@pytest.fixture
def known_dish_key(table) -> str:
    return table.keys()[0]
