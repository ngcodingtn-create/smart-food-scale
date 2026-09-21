"""On-disk JSON cache for remote nutrition lookups.

USDA FoodData Central is free but capped at **1,000 requests/hour per
api.data.gov key**, shared across everyone using that key. A demo that re-queries
the same dish every time will exhaust it, so every response is cached by its
identifier and the cache is never expired — food composition does not change.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

_SAFE = re.compile(r"[^A-Za-z0-9_.-]")


class DiskCache:
    def __init__(self, directory: Path) -> None:
        self.directory = directory

    def _path(self, key: str) -> Path:
        return self.directory / f"{_SAFE.sub('_', key)}.json"

    def get(self, key: str) -> Any | None:
        path = self._path(key)
        if not path.exists():
            return None
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            # A corrupt cache entry is a cache miss, never a crash.
            return None

    def set(self, key: str, value: Any) -> None:
        self.directory.mkdir(parents=True, exist_ok=True)
        tmp = self._path(key).with_suffix(".json.tmp")
        tmp.write_text(json.dumps(value, ensure_ascii=False), encoding="utf-8")
        # Atomic replace, so an interrupted write cannot leave a half-file that
        # then reads as a miss forever.
        tmp.replace(self._path(key))

    def __contains__(self, key: str) -> bool:
        return self._path(key).exists()
