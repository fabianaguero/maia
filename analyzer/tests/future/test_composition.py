"""Tests for composition export — write_stem_wavs and the export-stems CLI."""
from __future__ import annotations

import json
import subprocess
import sys
import wave
from pathlib import Path

import pytest

from maia_analyzer.composition import write_stem_wavs

# ---------------------------------------------------------------------------
# Minimal fixtures
# ---------------------------------------------------------------------------

BPM = 120.0
DURATION = 4.0  # 4 seconds — fast to render

SECTIONS = [
    {
        "id": "intro",
        "role": "intro",
        "energy": "low",
        "startBar": 1,
        "endBar": 2,
        "startSecond": 0.0,
        "endSecond": 2.0,
    },
    {
        "id": "drop",
        "role": "drop",
        "energy": "high",
        "startBar": 3,
        "endBar": 4,
        "startSecond": 2.0,
        "endSecond": 4.0,
    },
]

RENDER_PREVIEW = {
    "mode": "deterministic-stem-preview",
    "headroomDb": -6.0,
    "masterChain": [],
    "exportTargets": [],
    "stems": [
        {
            "id": "stem-foundation",
            "label": "Foundation",
            "role": "foundation",
            "gainDb": -6.5,
            "pan": 0.0,
            "sectionIds": ["intro", "drop"],
        },
        {
            "id": "stem-motion",
            "label": "Motion",
            "role": "support",
            "gainDb": -9.0,
            "pan": 0.12,
            "sectionIds": ["drop"],
        },
    ],
    "automation": [],
}


# ---------------------------------------------------------------------------
# write_stem_wavs unit tests
# ---------------------------------------------------------------------------


def test_write_stem_wavs_creates_files(tmp_path):
    results = write_stem_wavs(tmp_path, BPM, DURATION, SECTIONS, RENDER_PREVIEW)

    assert len(results) == 2
    for stem in results:
        p = Path(stem["path"])
        assert p.exists(), f"Stem file missing: {p}"
        assert p.suffix == ".wav"


def test_write_stem_wavs_metadata(tmp_path):
    results = write_stem_wavs(tmp_path, BPM, DURATION, SECTIONS, RENDER_PREVIEW)

    foundation = next(s for s in results if s["stemId"] == "stem-foundation")
    assert foundation["format"] == "wav"
    assert foundation["sampleRateHz"] == 22050
    assert foundation["channels"] == 2
    assert abs(foundation["durationSeconds"] - DURATION) < 0.01
    assert foundation["gainDb"] == -6.5
    assert foundation["pan"] == 0.0


def test_write_stem_wavs_valid_wav(tmp_path):
    results = write_stem_wavs(tmp_path, BPM, DURATION, SECTIONS, RENDER_PREVIEW)

    for stem in results:
        with wave.open(str(stem["path"]), "rb") as wav:
            assert wav.getnchannels() == 2
            assert wav.getframerate() == 22050
            assert wav.getsampwidth() == 2
            assert wav.getnframes() > 0


def test_write_stem_wavs_empty_stems(tmp_path):
    preview = {**RENDER_PREVIEW, "stems": []}
    results = write_stem_wavs(tmp_path, BPM, DURATION, SECTIONS, preview)
    assert results == []


def test_write_stem_wavs_creates_output_dir(tmp_path):
    nested = tmp_path / "a" / "b" / "stems"
    results = write_stem_wavs(nested, BPM, DURATION, SECTIONS, RENDER_PREVIEW)
    assert nested.is_dir()
    assert len(results) == 2


def test_write_stem_wavs_label_and_role(tmp_path):
    results = write_stem_wavs(tmp_path, BPM, DURATION, SECTIONS, RENDER_PREVIEW)

    motion = next(s for s in results if s["stemId"] == "stem-motion")
    assert motion["label"] == "Motion"
    assert motion["role"] == "support"
    assert motion["pan"] == 0.12


# ---------------------------------------------------------------------------
# CLI export-stems tests
# ---------------------------------------------------------------------------

PYTHON = sys.executable


def _run_export_stems(dest_dir: Path, payload: dict) -> dict:
    result = subprocess.run(
        [PYTHON, "-m", "maia_analyzer.cli", "export-stems", "--dest-dir", str(dest_dir)],
        input=json.dumps(payload),
        capture_output=True,
        text=True,
        cwd=Path(__file__).parent.parent / "src",
    )
    return json.loads(result.stdout.strip())


def test_cli_export_stems_ok(tmp_path):
    payload = {
        "bpm": BPM,
        "durationSeconds": DURATION,
        "sections": SECTIONS,
        "renderPreview": RENDER_PREVIEW,
    }
    response = _run_export_stems(tmp_path, payload)

    assert response["status"] == "ok"
    assert len(response["stems"]) == 2
    for stem in response["stems"]:
        assert Path(stem["path"]).exists()


def test_cli_export_stems_missing_field(tmp_path):
    payload = {"bpm": BPM}  # missing durationSeconds, sections, renderPreview
    response = _run_export_stems(tmp_path, payload)
    assert response["status"] == "error"
    assert "Missing field" in response["error"]


def test_cli_export_stems_empty_stdin(tmp_path):
    result = subprocess.run(
        [PYTHON, "-m", "maia_analyzer.cli", "export-stems", "--dest-dir", str(tmp_path)],
        input="",
        capture_output=True,
        text=True,
        cwd=Path(__file__).parent.parent / "src",
    )
    response = json.loads(result.stdout.strip())
    assert response["status"] == "error"


def test_cli_export_stems_invalid_json(tmp_path):
    result = subprocess.run(
        [PYTHON, "-m", "maia_analyzer.cli", "export-stems", "--dest-dir", str(tmp_path)],
        input="not json!",
        capture_output=True,
        text=True,
        cwd=Path(__file__).parent.parent / "src",
    )
    response = json.loads(result.stdout.strip())
    assert response["status"] == "error"
