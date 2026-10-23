"""Application settings.

Everything is overridable from the environment with an ``SFS_`` prefix or from a
``.env`` file, so nothing here needs editing to run the backend somewhere else.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/  — the directory that holds app/, data/ and tests/.
BACKEND_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="SFS_",
        extra="ignore",
    )

    # --- Recognition ---------------------------------------------------------
    recogniser: str = "stub"

    # Gemini, when SFS_RECOGNISER=gemini. The key is the owner's own, from Google
    # AI Studio, and lives in backend/.env only. The model: Google's model page
    # (read 2026-10-23) says new projects should use 3.5 Flash-Lite or 3.8 Flash;
    # Flash-Lite is the one with the larger free allowance.
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-3.5-flash-lite"
    gemini_base_url: str = "https://generativelanguage.googleapis.com/v1beta"
    # The camera board gives up after 20 s (kUploadTimeoutMs); answer before that.
    gemini_timeout_s: float = 15.0
    # Below this, "not sure" is the answer. The model's confidence is its own
    # estimate, not a measured accuracy; 0.5 is a starting value, not a tuned one.
    gemini_min_confidence: float = 0.5

    # --- Nutrition -----------------------------------------------------------
    usda_enabled: bool = False
    usda_api_key: str | None = None
    usda_base_url: str = "https://api.nal.usda.gov/fdc/v1"

    # --- Storage -------------------------------------------------------------
    database_url: str = f"sqlite:///{(BACKEND_ROOT / 'smart_food_scale.db').as_posix()}"
    data_dir: Path = BACKEND_ROOT / "data"
    store_images: bool = False

    # --- Limits --------------------------------------------------------------
    # A meal cannot be created without a plausible measured mass. The whole point
    # of the device is that mass is measured, not estimated — so a missing, zero
    # or absurd value is rejected rather than defaulted. See docs/decisions.md D4.
    max_grams: float = 5000.0
    min_grams: float = 0.5
    max_image_bytes: int = 8 * 1024 * 1024

    @property
    def tunisian_table_path(self) -> Path:
        return self.data_dir / "tunisian_foods.json"

    @property
    def cache_dir(self) -> Path:
        return self.data_dir / "cache"

    @property
    def upload_dir(self) -> Path:
        return self.data_dir / "uploads"


@lru_cache
def get_settings() -> Settings:
    """Cached so the .env file is read once per process."""
    return Settings()
