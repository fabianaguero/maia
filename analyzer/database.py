"""
SQLite database layer for persisting musical assets.

Schema stores all asset types in a single normalized table with
JSON blobs for type-specific fields.
"""
from __future__ import annotations

import json
import logging
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Generator, Optional

logger = logging.getLogger(__name__)

_DEFAULT_DB_PATH = Path.home() / ".maia" / "maia.db"

_CREATE_SCHEMA = """
CREATE TABLE IF NOT EXISTS musical_assets (
    id          TEXT PRIMARY KEY,
    type        TEXT NOT NULL,
    name        TEXT NOT NULL,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL,
    metadata    TEXT NOT NULL DEFAULT '{}',
    data        TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_assets_type ON musical_assets(type);
CREATE INDEX IF NOT EXISTS idx_assets_name ON musical_assets(name);
CREATE INDEX IF NOT EXISTS idx_assets_created ON musical_assets(created_at);
"""


@contextmanager
def get_connection(db_path: Optional[str] = None) -> Generator[sqlite3.Connection, None, None]:
    """Context manager that yields an open SQLite connection."""
    path = Path(db_path) if db_path else _DEFAULT_DB_PATH
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(path))
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def initialize_db(db_path: Optional[str] = None) -> None:
    """Create tables if they don't exist."""
    with get_connection(db_path) as conn:
        conn.executescript(_CREATE_SCHEMA)
    logger.info("Database initialized at %s", db_path or _DEFAULT_DB_PATH)


def save_asset(asset: dict[str, Any], db_path: Optional[str] = None) -> str:
    """
    Insert or replace a musical asset.

    Args:
        asset: Dict conforming to MusicalAsset contract (must have 'id', 'type', 'name').
        db_path: Optional path to the SQLite database.

    Returns:
        The asset id.
    """
    initialize_db(db_path)

    asset_id = asset["id"]
    asset_type = asset["type"]
    name = asset["name"]
    created_at = asset.get("created_at", datetime.now(timezone.utc).isoformat())
    updated_at = datetime.now(timezone.utc).isoformat()
    metadata = json.dumps(asset.get("metadata", {}))

    # Store type-specific fields in 'data' column
    data_fields = {k: v for k, v in asset.items()
                   if k not in {"id", "type", "name", "created_at", "updated_at", "metadata"}}
    data = json.dumps(data_fields)

    with get_connection(db_path) as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO musical_assets
                (id, type, name, created_at, updated_at, metadata, data)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (asset_id, asset_type, name, created_at, updated_at, metadata, data),
        )

    logger.info("Saved asset %s (%s)", asset_id, asset_type)
    return asset_id


def get_asset(asset_id: str, db_path: Optional[str] = None) -> Optional[dict[str, Any]]:
    """Retrieve a single asset by ID."""
    initialize_db(db_path)
    with get_connection(db_path) as conn:
        row = conn.execute(
            "SELECT * FROM musical_assets WHERE id = ?", (asset_id,)
        ).fetchone()
    return _row_to_dict(row) if row else None


def list_assets(
    asset_type: Optional[str] = None,
    db_path: Optional[str] = None,
    limit: int = 200,
) -> list[dict[str, Any]]:
    """List assets, optionally filtered by type."""
    initialize_db(db_path)
    with get_connection(db_path) as conn:
        if asset_type:
            rows = conn.execute(
                "SELECT * FROM musical_assets WHERE type = ? ORDER BY created_at DESC LIMIT ?",
                (asset_type, limit),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM musical_assets ORDER BY created_at DESC LIMIT ?",
                (limit,),
            ).fetchall()
    return [_row_to_dict(r) for r in rows]


def delete_asset(asset_id: str, db_path: Optional[str] = None) -> bool:
    """Delete an asset by ID. Returns True if a row was deleted."""
    initialize_db(db_path)
    with get_connection(db_path) as conn:
        cursor = conn.execute(
            "DELETE FROM musical_assets WHERE id = ?", (asset_id,)
        )
    return cursor.rowcount > 0


def _row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    """Merge base columns with JSON data column into a flat dict."""
    d = dict(row)
    data = json.loads(d.pop("data", "{}"))
    metadata = json.loads(d.pop("metadata", "{}"))
    d["metadata"] = metadata
    d.update(data)
    return d
