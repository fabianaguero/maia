from __future__ import annotations

from pathlib import Path

import pytest

from maia_analyzer.assets import analyze_base_asset


def test_analyze_base_asset_missing_path_raises(tmp_path):
    missing = tmp_path / "missing-pack"
    with pytest.raises(FileNotFoundError):
        analyze_base_asset(str(missing))


def test_analyze_base_asset_file_infers_audio_category(tmp_path):
    sample = tmp_path / "hit.wav"
    sample.write_bytes(b"RIFFstub")

    asset, warnings = analyze_base_asset(str(sample))

    assert asset["assetType"] == "base_asset"
    assert asset["metrics"]["sourceKind"] == "file"
    assert asset["metrics"]["detectedCategory"] == "fx-palette"
    assert asset["metrics"]["audioEntryCount"] == 1
    assert asset["metrics"]["playableAudioEntries"] == ["hit.wav"]
    assert warnings == []


def test_analyze_base_asset_empty_directory_warns(tmp_path):
    pack_dir = tmp_path / "empty-pack"
    pack_dir.mkdir()

    asset, warnings = analyze_base_asset(str(pack_dir), category="collection")

    assert asset["metrics"]["sourceKind"] == "directory"
    assert asset["metrics"]["entryCount"] == 0
    assert asset["metrics"]["category"] == "collection"
    assert warnings == ["The selected directory is empty."]


def test_analyze_base_asset_directory_collects_preview_and_audio_entries(tmp_path):
    pack_dir = tmp_path / "pack"
    loops_dir = pack_dir / "loops"
    docs_dir = pack_dir / "docs"
    loops_dir.mkdir(parents=True)
    docs_dir.mkdir(parents=True)
    (loops_dir / "kick.wav").write_bytes(b"k")
    (loops_dir / "bass.flac").write_bytes(b"b")
    (docs_dir / "notes.txt").write_text("notes", encoding="utf-8")

    asset, warnings = analyze_base_asset(str(pack_dir), reusable=False)

    metrics = asset["metrics"]
    assert metrics["sourceKind"] == "directory"
    assert metrics["entryCount"] == 3
    assert metrics["audioEntryCount"] == 2
    assert "loops/kick.wav" in metrics["previewEntries"]
    assert "loops/bass.flac" in metrics["playableAudioEntries"]
    assert "reference-only" in asset["tags"]
    assert warnings == []
