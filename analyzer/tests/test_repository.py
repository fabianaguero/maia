"""Repository analysis tests — _analyze_log_chunk, live_mode semantics,
and the full analyze_repository dispatch.
"""
from __future__ import annotations

import textwrap

import pytest

from maia_analyzer.repository import analyze_repository

from .fixtures import SAMPLE_LOG


# ---------------------------------------------------------------------------
# _analyze_log_chunk via analyze_repository (the public entry point)
# ---------------------------------------------------------------------------


def test_analyze_log_chunk_basic(tmp_path):
    """A real log file on disk should produce a repo_analysis asset."""
    log_file = tmp_path / "app.log"
    log_file.write_text(SAMPLE_LOG, encoding="utf-8")

    asset, warnings = analyze_repository(
        "file",
        str(log_file),
        options={"logTailChunk": SAMPLE_LOG},
    )
    assert asset["assetType"] == "repo_analysis"
    assert isinstance(asset["suggestedBpm"], float)
    assert asset["suggestedBpm"] > 0
    metrics = asset["metrics"]
    assert metrics["importMode"] in {"log-file", "log-tail-window"}
    # We should detect at least the 2 ERROR lines as anomalies
    assert metrics["anomalyCount"] >= 2


def test_analyze_log_chunk_live_mode_no_file():
    """Virtual source paths (process/WS adapters) must not raise in live_mode=True."""
    asset, warnings = analyze_repository(
        "file",
        "/virtual/ws://localhost:9000/logs",
        options={
            "logTailChunk": SAMPLE_LOG,
            "logTailLiveMode": True,
        },
    )
    assert asset["assetType"] == "repo_analysis"
    assert isinstance(asset["suggestedBpm"], float)


def test_analyze_log_chunk_live_mode_false_raises_on_missing_file():
    """Missing source with live_mode=False must raise FileNotFoundError."""
    with pytest.raises(FileNotFoundError):
        analyze_repository(
            "file",
            "/does/not/exist/app.log",
            options={"logTailChunk": "INFO hello"},
            # live_mode defaults to False when logTailLiveMode is absent
        )


def test_analyze_log_chunk_level_counts():
    """Level counts should reflect what's in the fixture log."""
    asset, _ = analyze_repository(
        "file",
        "/virtual/levels.log",
        options={
            "logTailChunk": SAMPLE_LOG,
            "logTailLiveMode": True,
        },
    )
    metrics = asset["metrics"]
    level_counts = metrics.get("levelCounts", {})
    assert level_counts.get("info", 0) >= 4
    assert level_counts.get("error", 0) >= 2
    assert level_counts.get("warn", 0) >= 1


def test_analyze_log_chunk_waveform_bins_present():
    """Waveform bins must always be a list (possibly empty) on log analysis."""
    asset, _ = analyze_repository(
        "file",
        "/virtual/wf.log",
        options={
            "logTailChunk": SAMPLE_LOG,
            "logTailLiveMode": True,
        },
    )
    assert isinstance(asset["artifacts"]["waveformBins"], list)
    assert isinstance(asset["artifacts"]["beatGrid"], list)
    assert isinstance(asset["artifacts"]["bpmCurve"], list)


def test_analyze_log_chunk_empty_chunk():
    """An empty chunk should still return a valid asset (BPM will be low-confidence)."""
    asset, warnings = analyze_repository(
        "file",
        "/virtual/empty.log",
        options={
            "logTailChunk": "",
            "logTailLiveMode": True,
        },
    )
    assert asset["assetType"] == "repo_analysis"
    assert isinstance(asset["suggestedBpm"], float)


def test_analyze_log_chunk_anomaly_keywords():
    """Lines with known anomaly keywords must increment anomalyCount."""
    chunk = textwrap.dedent("""\
        2024-01-01 10:00:00 INFO  [SomeService] Normal startup
        2024-01-01 10:00:01 ERROR [DBPool] Connection refused
        2024-01-01 10:00:02 WARN  [Worker] Deadlock detected
        2024-01-01 10:00:03 INFO  [Worker] Retrying after timeout
    """)
    asset, _ = analyze_repository(
        "file",
        "/virtual/anomaly.log",
        options={
            "logTailChunk": chunk,
            "logTailLiveMode": True,
        },
    )
    metrics = asset["metrics"]
    assert metrics["anomalyCount"] >= 3  # connection refused + deadlock + timeout


# ---------------------------------------------------------------------------
# Remote URL — metadata-only
# ---------------------------------------------------------------------------


def test_analyze_remote_repository_metadata():
    """URL sources return metadata-only asset without raising."""
    asset, warnings = analyze_repository(
        "url",
        "https://github.com/some-org/some-repo",
    )
    assert asset["assetType"] == "repo_analysis"
    assert asset["metrics"]["importMode"] == "remote-url"
    assert len(warnings) > 0


def test_analyze_remote_repository_invalid_url():
    """Non-HTTP URL should raise ValueError."""
    with pytest.raises(ValueError):
        analyze_repository("url", "ftp://example.com/repo")
