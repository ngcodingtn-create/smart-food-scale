"""Database engine, session factory and the FastAPI dependency."""

from __future__ import annotations

from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings


class Base(DeclarativeBase):
    pass


def _make_engine(database_url: str):
    # check_same_thread is a SQLite-only concern: FastAPI serves requests from a
    # threadpool, and the default would reject a connection reused across threads.
    connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
    return create_engine(database_url, connect_args=connect_args, future=True)


engine = _make_engine(get_settings().database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def init_db() -> None:
    """Create tables. Fine for a coursework project; swap for Alembic if the
    schema starts changing under real data."""
    from app import models  # noqa: F401  — registers the mappers before create_all

    Base.metadata.create_all(bind=engine)


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
