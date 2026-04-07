"""Golden analysis tests.

Pins stable metric values from analyze_repository against the SAMPLE_LOG
fixture. These tests catch regressions in log parsing, BPM heuristics,
level counting, and component extraction.

"Golden" means: run once, record the output, then re-run to detect drift.
If the heuristics change intentionally, update the golden values here.
"""
from __future__ import annotations

import tempfile
from pathlib import Path

import pytest

from maia_analyzer.repository import analyze_repository
from maia_analyzer.service import handle_request

from .fixtures import SAMPLE_LOG

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

CONTRACT_VERSION = "1.0"


def _make_log(tmp_path: Path) -> Path:
    log_file = tmp_path / "app.log"
    log_file.write_text(SAMPLE_LOG, encoding="utf-8")
    return log_file


def _analyze(tmp_path: Path) -> tuple[dict, list[str]]:
    log_file = _make_log(tmp_path)
    return analyze_repository(
        "file",
        str(log_file),
        options={"logTailChunk": SAMPLE_LOG},
    )


# ---------------------------------------------------------------------------
# Asset-level golden values
# ---------------------------------------------------------------------------


def test_golden_asset_type(tmp_path):
    asset, _ = _analyze(tmp_path)
    assert asset["assetType"] == "repo_analysis"


def test_golden_suggested_bpm(tmp_path):
    """BPM derived from log cadence — stable for this 10-line fixture."""
    asset, _ = _analyze(tmp_path)
    assert asset["suggestedBpm"] == pytest.approx(125.0, abs=5.0)


def test_golden_confidence(tmp_path):
    """Confidence should be in a reasonable range for structured log."""
    asset, _ = _analyze(tmp_path)
    assert 0.4 <= asset["confidence"] <= 0.8


def test_golden_tags(tmp_path):
    """Expected tag set for a timestamped structured log with anomaly spikes."""
    asset, _ = _analyze(tmp_path)
    tags = set(asset["tags"])
    assert "repo-analysis" in tags
    assert "log-file" in tags
    assert "timestamped" in tags
    assert "anomaly-spikes" in tags


# ---------------------------------------------------------------------------
# Metrics golden values
# ---------------------------------------------------------------------------


def test_golden_line_count(tmp_path):
    asset, _ = _analyze(tmp_path)
    assert asset["metrics"]["lineCount"] == 10
    assert asset["metrics"]["nonEmptyLineCount"] == 10
    assert asset["metrics"]["timestampedLineCount"] == 10


def test_golden_level_counts(tmp_path):
    """SAMPLE_LOG has 4 INFO, 2 DEBUG, 2 WARN, 2 ERROR lines."""
    asset, _ = _analyze(tmp_path)
    lc = asset["metrics"]["levelCounts"]
    assert lc["info"] == 4
    assert lc["debug"] == 2
    assert lc["warn"] == 2
    assert lc["error"] == 2


def test_golden_dominant_level(tmp_path):
    asset, _ = _analyze(tmp_path)
    assert asset["metrics"]["dominantLevel"] == "info"


def test_golden_anomaly_count(tmp_path):
    """Two ERROR lines → two anomalies."""
    asset, _ = _analyze(tmp_path)
    assert asset["metrics"]["anomalyCount"] == 2


def test_golden_anomaly_ratio(tmp_path):
    """2 anomalies / 10 lines = 0.2."""
    asset, _ = _analyze(tmp_path)
    assert asset["metrics"]["anomalyRatio"] == pytest.approx(0.2, abs=0.01)


def test_golden_top_components(tmp_path):
    """PaymentService is the top component with 4 appearances."""
    asset, _ = _analyze(tmp_path)
    top = asset["metrics"]["topComponents"]
    assert len(top) >= 3
    assert top[0]["component"] == "PaymentService"
    assert top[0]["count"] == 4


def test_golden_import_mode(tmp_path):
    """File-based analysis with tailChunk → log-file import mode."""
    asset, _ = _analyze(tmp_path)
    assert asset["metrics"]["importMode"] == "log-file"


def test_golden_detected_format(tmp_path):
    asset, _ = _analyze(tmp_path)
    assert asset["metrics"]["detectedFormat"] == "log"


def test_golden_tracked_as(tmp_path):
    asset, _ = _analyze(tmp_path)
    assert asset["metrics"]["trackedAs"] == "log-signal"


def test_golden_sonification_cues_count(tmp_path):
    """One cue per log line → 10 cues for 10-line fixture."""
    asset, _ = _analyze(tmp_path)
    assert len(asset["metrics"]["sonificationCues"]) == 10


def test_golden_sonification_cues_have_level(tmp_path):
    """Each cue must carry a level field matching a known severity."""
    asset, _ = _analyze(tmp_path)
    levels = {c["level"] for c in asset["metrics"]["sonificationCues"]}
    assert levels <= {"info", "debug", "warn", "error"}


# ---------------------------------------------------------------------------
# Mock vs native gate: service-layer handle_request parity
# ---------------------------------------------------------------------------


def test_mock_native_gate_health_payload_shape():
    """The health response must include all fields consumed by the TS mock."""
    resp = handle_request({
        "contractVersion": CONTRACT_VERSION,
        "requestId": "gate-1",
        "action": "health",
        "payload": {},
    })
    assert resp["status"] == "ok"
    payload = resp["payload"]
    # Fields referenced in the TS mock (mockLibrary.ts / mockRepositories.ts)
    assert "analyzerVersion" in payload
    assert "runtime" in payload
    assert "supportedActions" in payload
    assert "supportedTrackFormats" in payload
    assert isinstance(payload["supportedTrackFormats"], list)
    assert len(payload["supportedTrackFormats"]) > 0


def test_mock_native_gate_analyze_response_has_musical_asset(tmp_path):
    """The analyze response must include musicalAsset as consumed by the TS mock."""
    log_file = _make_log(tmp_path)
    resp = handle_request({
        "contractVersion": CONTRACT_VERSION,
        "requestId": "gate-2",
        "action": "analyze",
        "payload": {
            "assetType": "repo_analysis",
            "source": {"kind": "file", "path": str(log_file)},
            "options": {"logTailChunk": SAMPLE_LOG},
        },
    })
    assert resp["status"] == "ok"
    payload = resp["payload"]
    assert "musicalAsset" in payload
    assert "summary" in payload
    asset = payload["musicalAsset"]
    # Fields the TS mock always provides
    for field in ("id", "assetType", "title", "sourcePath",
                  "confidence", "tags", "metrics", "artifacts", "createdAt"):
        assert field in asset, f"Gate failed: missing '{field}' in musicalAsset"


def test_mock_native_gate_error_shape():
    """Error responses must have the shape TS consumers expect."""
    resp = handle_request({
        "contractVersion": "0.0",
        "requestId": "gate-3",
        "action": "health",
        "payload": {},
    })
    assert resp["status"] == "error"
    assert "error" in resp
    assert "code" in resp["error"]
    assert "message" in resp["error"]
    assert isinstance(resp["warnings"], list)
