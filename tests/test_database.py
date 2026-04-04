"""Tests for SQLite database persistence."""
import json
import os
import tempfile
import uuid
import pytest
from analyzer.database import (
    initialize_db,
    save_asset,
    get_asset,
    list_assets,
    delete_asset,
)


@pytest.fixture
def tmp_db(tmp_path):
    """Return a path to a fresh temporary database."""
    return str(tmp_path / "test_maia.db")


def make_asset(asset_type: str = "track_analysis", name: str = "Test Track") -> dict:
    return {
        "id": str(uuid.uuid4()),
        "type": asset_type,
        "name": name,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
        "metadata": {},
        "bpm": 128.0,
        "duration": 240.0,
    }


def test_initialize_db(tmp_db):
    initialize_db(tmp_db)
    assert os.path.exists(tmp_db)


def test_save_and_get_asset(tmp_db):
    asset = make_asset()
    saved_id = save_asset(asset, db_path=tmp_db)
    assert saved_id == asset["id"]

    retrieved = get_asset(asset["id"], db_path=tmp_db)
    assert retrieved is not None
    assert retrieved["id"] == asset["id"]
    assert retrieved["name"] == asset["name"]
    assert retrieved["type"] == asset["type"]


def test_save_asset_persists_data_fields(tmp_db):
    asset = make_asset()
    save_asset(asset, db_path=tmp_db)
    retrieved = get_asset(asset["id"], db_path=tmp_db)
    assert retrieved["bpm"] == 128.0
    assert retrieved["duration"] == 240.0


def test_list_assets_empty(tmp_db):
    initialize_db(tmp_db)
    results = list_assets(db_path=tmp_db)
    assert results == []


def test_list_assets(tmp_db):
    assets = [make_asset(name=f"Track {i}") for i in range(3)]
    for a in assets:
        save_asset(a, db_path=tmp_db)
    results = list_assets(db_path=tmp_db)
    assert len(results) == 3


def test_list_assets_by_type(tmp_db):
    track = make_asset(asset_type="track_analysis", name="A Track")
    repo = make_asset(asset_type="repo_analysis", name="A Repo")
    save_asset(track, db_path=tmp_db)
    save_asset(repo, db_path=tmp_db)

    tracks = list_assets(asset_type="track_analysis", db_path=tmp_db)
    repos = list_assets(asset_type="repo_analysis", db_path=tmp_db)
    assert len(tracks) == 1
    assert len(repos) == 1
    assert tracks[0]["type"] == "track_analysis"


def test_delete_asset(tmp_db):
    asset = make_asset()
    save_asset(asset, db_path=tmp_db)
    deleted = delete_asset(asset["id"], db_path=tmp_db)
    assert deleted is True
    assert get_asset(asset["id"], db_path=tmp_db) is None


def test_delete_nonexistent_asset(tmp_db):
    initialize_db(tmp_db)
    deleted = delete_asset(str(uuid.uuid4()), db_path=tmp_db)
    assert deleted is False


def test_get_nonexistent_asset(tmp_db):
    initialize_db(tmp_db)
    result = get_asset(str(uuid.uuid4()), db_path=tmp_db)
    assert result is None


def test_save_updates_existing(tmp_db):
    asset = make_asset(name="Original Name")
    save_asset(asset, db_path=tmp_db)

    updated = dict(asset)
    updated["name"] = "Updated Name"
    save_asset(updated, db_path=tmp_db)

    retrieved = get_asset(asset["id"], db_path=tmp_db)
    assert retrieved["name"] == "Updated Name"
    results = list_assets(db_path=tmp_db)
    assert len(results) == 1  # no duplicate
