"""Stream session management for Maia log analysis.

A session accumulates log lines across multiple poll cycles so that
BPM/confidence improves as more data arrives, without any cloud
dependency.  Each session holds:
  - a fixed-size ring buffer of recent lines (rolling window)
  - cumulative statistics (level counts, anomaly count, component map)
  - a monotonic event counter used to derive BPM stability
  - the adapter kind (file | process | tcp)

The Rust side allocates a session ID, passes it back to Python on each
poll, and Python mutates the session state held here in-process.
Because the Python interpreter is a long-lived subprocess (service mode)
the dict survives across requests.
"""
from __future__ import annotations

import subprocess
import threading
from collections import Counter
from datetime import UTC, datetime
from typing import Any

# Maximum lines kept in the rolling ring buffer per session
SESSION_RING_BUFFER_LINES = 1_200
# How many bytes to read at a time from a process stdout adapter
PROCESS_READ_CHUNK_BYTES = 8_192
# Maximum sessions to keep alive without explicit stop before LRU eviction
MAX_SESSIONS = 32

_sessions: dict[str, "_Session"] = {}
_lock = threading.Lock()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def get_or_create_session(
    session_id: str,
    adapter_kind: str,
    source: str,
) -> "_Session":
    with _lock:
        session = _sessions.get(session_id)
        if session is None:
            _evict_if_needed()
            session = _Session(session_id, adapter_kind, source)
            _sessions[session_id] = session
        return session


def get_session(session_id: str) -> "_Session | None":
    with _lock:
        return _sessions.get(session_id)


def stop_session(session_id: str) -> bool:
    with _lock:
        session = _sessions.pop(session_id, None)
        if session is None:
            return False
        session.close()
        return True


def list_sessions() -> list[dict[str, Any]]:
    with _lock:
        return [s.describe() for s in _sessions.values()]


def ingest_lines(session_id: str, lines: list[str]) -> None:
    """Feed new lines into the rolling buffer of an existing session."""
    with _lock:
        session = _sessions.get(session_id)
        if session is None:
            return
    session.ingest(lines)


def session_snapshot(session_id: str) -> dict[str, Any] | None:
    """Return a snapshot of accumulated metrics for the session."""
    with _lock:
        session = _sessions.get(session_id)
        if session is None:
            return None
    return session.snapshot()


# ---------------------------------------------------------------------------
# Process adapter
# ---------------------------------------------------------------------------


def start_process_adapter(
    session_id: str,
    command: list[str],
) -> tuple[bool, str]:
    """Spawn a subprocess and stream its stdout into the session ring buffer.

    Returns (success, error_message).  The background reader thread is
    daemon-scoped so it dies with the process.
    """
    session = get_session(session_id)
    if session is None:
        return False, f"Session {session_id!r} not found"

    try:
        proc = subprocess.Popen(  # noqa: S603 — command validated by caller
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="replace",
            bufsize=1,
        )
    except (OSError, ValueError) as exc:
        return False, f"Failed to start process adapter: {exc}"

    session.attach_process(proc)

    def _reader() -> None:
        assert proc.stdout is not None
        buffer = ""
        try:
            while True:
                chunk = proc.stdout.read(PROCESS_READ_CHUNK_BYTES)
                if not chunk:
                    break
                buffer += chunk
                lines = buffer.splitlines(keepends=True)
                complete = [line.rstrip("\n") for line in lines if line.endswith("\n")]
                buffer = lines[-1] if lines and not lines[-1].endswith("\n") else ""
                if complete:
                    ingest_lines(session_id, complete)
        except OSError:
            pass

    thread = threading.Thread(target=_reader, daemon=True)
    thread.start()
    return True, ""


# ---------------------------------------------------------------------------
# Internal session class
# ---------------------------------------------------------------------------


class _Session:
    def __init__(self, session_id: str, adapter_kind: str, source: str) -> None:
        self.session_id = session_id
        self.adapter_kind = adapter_kind
        self.source = source
        self.created_at: str = datetime.now(UTC).isoformat()
        self.last_seen_at: str = self.created_at
        self.total_lines_ingested: int = 0
        self.ring_buffer: list[str] = []
        self.level_counts: Counter[str] = Counter()
        self.component_counts: Counter[str] = Counter()
        self.anomaly_count: int = 0
        self._process: subprocess.Popen[str] | None = None

    # ------------------------------------------------------------------
    def ingest(self, lines: list[str]) -> None:
        self.last_seen_at = datetime.now(UTC).isoformat()
        self.total_lines_ingested += len(lines)
        self.ring_buffer.extend(lines)
        if len(self.ring_buffer) > SESSION_RING_BUFFER_LINES:
            self.ring_buffer = self.ring_buffer[-SESSION_RING_BUFFER_LINES:]

    def attach_process(self, proc: "subprocess.Popen[str]") -> None:
        self._process = proc

    def close(self) -> None:
        if self._process is not None:
            try:
                self._process.terminate()
            except OSError:
                pass
            self._process = None

    def describe(self) -> dict[str, Any]:
        return {
            "sessionId": self.session_id,
            "adapterKind": self.adapter_kind,
            "source": self.source,
            "createdAt": self.created_at,
            "lastSeenAt": self.last_seen_at,
            "totalLinesIngested": self.total_lines_ingested,
            "ringBufferSize": len(self.ring_buffer),
            "processRunning": self._process is not None and self._process.poll() is None,
        }

    def snapshot(self) -> dict[str, Any]:
        return {
            "sessionId": self.session_id,
            "adapterKind": self.adapter_kind,
            "source": self.source,
            "createdAt": self.created_at,
            "lastSeenAt": self.last_seen_at,
            "totalLinesIngested": self.total_lines_ingested,
            "ringBuffer": self.ring_buffer[-SESSION_RING_BUFFER_LINES:],
        }


# ---------------------------------------------------------------------------
# LRU eviction
# ---------------------------------------------------------------------------


def _evict_if_needed() -> None:
    """Evict the oldest session if at capacity. Caller holds _lock."""
    if len(_sessions) < MAX_SESSIONS:
        return
    oldest_id = min(_sessions, key=lambda sid: _sessions[sid].last_seen_at)
    evicted = _sessions.pop(oldest_id)
    evicted.close()
