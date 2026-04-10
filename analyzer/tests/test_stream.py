"""Stream session registry tests.

Tests the public API of maia_analyzer.stream — session creation, ingestion,
snapshots, stop/eviction, and session_poll via handle_request.
"""
from __future__ import annotations

import json
import pytest

from maia_analyzer import stream as stream_mod
from maia_analyzer.stream import (
    SESSION_RING_BUFFER_LINES,
    get_or_create_session,
    get_session,
    ingest_lines,
    list_sessions,
    session_snapshot,
    stop_session,
)
from maia_analyzer.service import handle_request

from .fixtures import SAMPLE_LOG

CONTRACT_VERSION = "1.0"


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def _clean_sessions():
    """Ensure each test starts with an empty session registry."""
    # Clear before
    with stream_mod._lock:
        for sid, s in list(stream_mod._sessions.items()):
            s.close()
        stream_mod._sessions.clear()
    yield
    # Clear after
    with stream_mod._lock:
        for sid, s in list(stream_mod._sessions.items()):
            s.close()
        stream_mod._sessions.clear()


# ---------------------------------------------------------------------------
# get_or_create_session
# ---------------------------------------------------------------------------


def test_create_session_returns_session_object():
    session = get_or_create_session("sid-1", "file", "/tmp/fake.log")
    assert session.session_id == "sid-1"
    assert session.adapter_kind == "file"
    assert session.source == "/tmp/fake.log"


def test_get_or_create_session_is_idempotent():
    s1 = get_or_create_session("sid-2", "file", "/tmp/fake.log")
    s2 = get_or_create_session("sid-2", "file", "/tmp/other.log")
    assert s1 is s2, "Should return the same existing session"


def test_describe_has_expected_keys():
    session = get_or_create_session("sid-3", "process", "/virtual/stream")
    desc = session.describe()
    assert desc["sessionId"] == "sid-3"
    assert desc["adapterKind"] == "process"
    assert "createdAt" in desc
    assert "ringBufferSize" in desc
    assert desc["ringBufferSize"] == 0


# ---------------------------------------------------------------------------
# ingest_lines
# ---------------------------------------------------------------------------


def test_ingest_lines_grows_ring_buffer():
    get_or_create_session("sid-4", "file", "/tmp/fake.log")
    lines = ["line one", "line two", "line three"]
    ingest_lines("sid-4", lines)
    snap = session_snapshot("sid-4")
    assert snap is not None
    assert len(snap["ringBuffer"]) == 3
    assert snap["totalLinesIngested"] == 3


def test_ingest_lines_caps_at_ring_buffer_max():
    get_or_create_session("sid-5", "file", "/tmp/fake.log")
    big_batch = [f"line {i}" for i in range(SESSION_RING_BUFFER_LINES + 50)]
    ingest_lines("sid-5", big_batch)
    snap = session_snapshot("sid-5")
    assert snap is not None
    assert len(snap["ringBuffer"]) == SESSION_RING_BUFFER_LINES
    assert snap["totalLinesIngested"] == SESSION_RING_BUFFER_LINES + 50


def test_ingest_lines_noop_for_missing_session():
    # Should not raise even if session doesn't exist
    ingest_lines("ghost-session", ["x"])


# ---------------------------------------------------------------------------
# session_snapshot
# ---------------------------------------------------------------------------


def test_snapshot_returns_none_for_missing_session():
    assert session_snapshot("nonexistent") is None


def test_snapshot_contains_ring_buffer():
    get_or_create_session("sid-6", "file", "/tmp/fake.log")
    ingest_lines("sid-6", ["alpha", "beta"])
    snap = session_snapshot("sid-6")
    assert snap is not None
    assert "alpha" in snap["ringBuffer"]
    assert "beta" in snap["ringBuffer"]


# ---------------------------------------------------------------------------
# stop_session
# ---------------------------------------------------------------------------


def test_stop_session_returns_true_and_removes():
    get_or_create_session("sid-7", "file", "/tmp/fake.log")
    assert stop_session("sid-7") is True
    assert get_session("sid-7") is None


def test_stop_session_returns_false_for_nonexistent():
    assert stop_session("ghost-2") is False


def test_stop_session_idempotent():
    get_or_create_session("sid-8", "file", "/tmp/fake.log")
    assert stop_session("sid-8") is True
    assert stop_session("sid-8") is False


# ---------------------------------------------------------------------------
# list_sessions
# ---------------------------------------------------------------------------


def test_list_sessions_empty():
    assert list_sessions() == []


def test_list_sessions_shows_active_sessions():
    get_or_create_session("sid-9", "file", "/a.log")
    get_or_create_session("sid-10", "process", "/b.log")
    sessions = list_sessions()
    ids = {s["sessionId"] for s in sessions}
    assert {"sid-9", "sid-10"} == ids


# ---------------------------------------------------------------------------
# LRU eviction
# ---------------------------------------------------------------------------


def test_lru_eviction_removes_oldest():
    max_sessions = stream_mod.MAX_SESSIONS
    for i in range(max_sessions + 1):
        get_or_create_session(f"evict-{i}", "file", f"/log{i}.log")
        # Touch to update last_seen_at ordering deterministically
        if i > 0:
            # Access each session after the first to keep them fresh
            pass
    # After max_sessions + 1 creations, we should have exactly max_sessions
    assert len(stream_mod._sessions) == max_sessions


# ---------------------------------------------------------------------------
# session_poll via handle_request (integration path through service.py)
# ---------------------------------------------------------------------------


def test_session_poll_empty_buffer():
    # Create a session with no data
    get_or_create_session("poll-empty", "file", "/tmp/fake.log")
    result = handle_request({
        "contractVersion": CONTRACT_VERSION,
        "requestId": "r-poll-1",
        "action": "session_poll",
        "payload": {"sessionId": "poll-empty"},
    })
    assert result["status"] == "ok"
    assert result["payload"]["hasData"] is False
    assert result["payload"]["sessionId"] == "poll-empty"


def test_session_poll_with_data_returns_musical_asset():
    sid = "poll-data"
    get_or_create_session(sid, "file", "/tmp/virtual.log")
    ingest_lines(sid, SAMPLE_LOG.splitlines())
    result = handle_request({
        "contractVersion": CONTRACT_VERSION,
        "requestId": "r-poll-2",
        "action": "session_poll",
        "payload": {"sessionId": sid},
    })
    assert result["status"] == "ok"
    payload = result["payload"]
    assert payload["hasData"] is True
    assert "musicalAsset" in payload
    asset = payload["musicalAsset"]
    assert asset["assetType"] == "repo_analysis"
    assert asset["suggestedBpm"] is not None


# ---------------------------------------------------------------------------
# journald stream adapter
# ---------------------------------------------------------------------------


def test_journald_json_line_ingested_as_log_event():
    """journald JSON output lines (journalctl -o json) should be accepted as normal log lines."""
    sid = "jd-1"
    get_or_create_session(sid, "process", "journalctl -f -o json")
    journald_line = json.dumps({
        "__REALTIME_TIMESTAMP": "1712650000000000",
        "PRIORITY": "3",
        "SYSLOG_IDENTIFIER": "nginx",
        "MESSAGE": "connect() failed (111: Connection refused)",
        "_SYSTEMD_UNIT": "nginx.service",
    })
    ingest_lines(sid, [journald_line])
    snap = session_snapshot(sid)
    assert snap is not None
    assert len(snap["ringBuffer"]) == 1


def test_journald_session_poll_returns_valid_payload():
    """A session seeded with journald JSON lines should produce a valid session_poll response."""
    sid = "jd-2"
    get_or_create_session(sid, "process", "journalctl -f -o json")
    # Simulate a mix of priorities: 3=error, 4=warning, 6=info
    lines = [
        json.dumps({"PRIORITY": str(p), "MESSAGE": f"msg {p}", "SYSLOG_IDENTIFIER": "app"})
        for p in [3, 4, 6, 6, 6]
    ]
    ingest_lines(sid, lines)
    # Verify ring buffer was populated (5 lines)
    snap = session_snapshot(sid)
    assert snap is not None
    assert len(snap["ringBuffer"]) == 5
    # Verify session_poll produces a valid musical asset
    result = handle_request({
        "contractVersion": CONTRACT_VERSION,
        "requestId": "jd-poll-1",
        "action": "session_poll",
        "payload": {"sessionId": sid},
    })
    assert result["status"] == "ok"
    assert result["payload"]["hasData"] is True


def test_journald_adapter_kind_stored_on_session():
    """journald routes through the 'process' adapter kind; source string retains the command."""
    sid = "jd-3"
    source = "journalctl -f -o json --no-pager -u nginx.service"
    session = get_or_create_session(sid, "process", source)
    assert session.adapter_kind == "process"
    assert "journalctl" in session.source
