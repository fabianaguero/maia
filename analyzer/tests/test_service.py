from __future__ import annotations

from maia_analyzer.service import _build_summary, handle_request


def _req(action: str, payload: dict | None = None, request_id: str = "svc-1") -> dict:
    return {
        "contractVersion": "1.0",
        "requestId": request_id,
        "action": action,
        "payload": payload if payload is not None else {},
    }


def test_handle_request_session_list(monkeypatch):
    monkeypatch.setattr(
        "maia_analyzer.service.list_sessions",
        lambda: [{"sessionId": "s-1", "adapterKind": "file"}],
    )

    result = handle_request(_req("session_list"))

    assert result["status"] == "ok"
    assert result["payload"]["sessions"][0]["sessionId"] == "s-1"


def test_handle_request_session_start_process_requires_command():
    result = handle_request(
        _req(
            "session_start",
            {
                "sessionId": "proc-1",
                "adapterKind": "process",
                "source": "journalctl",
            },
        )
    )

    assert result["status"] == "error"
    assert result["error"]["code"] == "missing_command"


def test_handle_request_session_start_process_adapter_failure(monkeypatch):
    class DummySession:
        def describe(self) -> dict[str, str]:
            return {"sessionId": "proc-2", "adapterKind": "process"}

    monkeypatch.setattr("maia_analyzer.service.get_or_create_session", lambda *_args: DummySession())
    monkeypatch.setattr(
        "maia_analyzer.service.start_process_adapter",
        lambda _session_id, _command: (False, "spawn failed"),
    )

    result = handle_request(
        _req(
            "session_start",
            {
                "sessionId": "proc-2",
                "adapterKind": "process",
                "source": "journalctl",
                "command": ["journalctl", "-f"],
            },
        )
    )

    assert result["status"] == "error"
    assert result["error"]["code"] == "adapter_start_failed"


def test_handle_request_session_start_missing_source():
    result = handle_request(
        _req(
            "session_start",
            {
                "sessionId": "file-1",
                "adapterKind": "file",
            },
        )
    )

    assert result["status"] == "error"
    assert result["error"]["code"] == "missing_source"


def test_handle_request_session_stop_missing_session_id():
    result = handle_request(_req("session_stop", {}))

    assert result["status"] == "error"
    assert result["error"]["code"] == "missing_session_id"


def test_handle_request_session_poll_missing_session_id():
    result = handle_request(_req("session_poll", {}))

    assert result["status"] == "error"
    assert result["error"]["code"] == "missing_session_id"


def test_handle_request_session_poll_empty_snapshot(monkeypatch):
    monkeypatch.setattr(
        "maia_analyzer.service.session_snapshot",
        lambda _session_id: {
            "sessionId": "sess-empty",
            "adapterKind": "file",
            "source": "/tmp/app.log",
            "createdAt": "2026-04-08T00:00:00Z",
            "lastSeenAt": "2026-04-08T00:00:00Z",
            "totalLinesIngested": 0,
            "ringBuffer": [],
        },
    )

    result = handle_request(_req("session_poll", {"sessionId": "sess-empty"}))

    assert result["status"] == "ok"
    assert result["payload"]["hasData"] is False


def test_handle_request_session_poll_with_data(monkeypatch):
    monkeypatch.setattr(
        "maia_analyzer.service.session_snapshot",
        lambda _session_id: {
            "sessionId": "sess-data",
            "adapterKind": "file",
            "source": "/tmp/app.log",
            "createdAt": "2026-04-08T00:00:00Z",
            "lastSeenAt": "2026-04-08T00:01:00Z",
            "totalLinesIngested": 2,
            "ringBuffer": ["INFO ready", "ERROR failed"],
        },
    )
    monkeypatch.setattr(
        "maia_analyzer.service.analyze_repository",
        lambda *_args, **_kwargs: (
            {
                "assetType": "repo_analysis",
                "title": "app.log",
                "suggestedBpm": 126.0,
                "metrics": {"importMode": "log-tail-window", "anomalyCount": 1},
            },
            ["warn-1"],
        ),
    )

    result = handle_request(
        _req("session_poll", {"sessionId": "sess-data", "presetId": "ambient"})
    )

    assert result["status"] == "ok"
    assert result["payload"]["hasData"] is True
    assert result["warnings"] == ["warn-1"]


def test_handle_request_analyze_track_dispatch(monkeypatch):
    monkeypatch.setattr(
        "maia_analyzer.service.analyze_track",
        lambda source_path, waveform_bins: (
            {
                "assetType": "track_analysis",
                "title": source_path,
                "suggestedBpm": 124.0,
                "metrics": {},
            },
            ["track-ok"],
        ),
    )

    result = handle_request(
        _req(
            "analyze",
            {
                "assetType": "track_analysis",
                "source": {"kind": "file", "path": "/tmp/demo.wav"},
                "options": {"waveformBins": 64},
            },
        )
    )

    assert result["status"] == "ok"
    assert result["warnings"] == ["track-ok"]


def test_handle_request_analyze_base_asset_dispatch(monkeypatch):
    monkeypatch.setattr(
        "maia_analyzer.service.analyze_base_asset",
        lambda source_path, category, reusable: (
            {
                "assetType": "base_asset",
                "title": source_path,
                "suggestedBpm": None,
                "metrics": {"category": category, "reusable": reusable},
            },
            [],
        ),
    )

    result = handle_request(
        _req(
            "analyze",
            {
                "assetType": "base_asset",
                "source": {"kind": "file", "path": "/tmp/pack.wav"},
                "options": {"baseAssetCategory": "fx-palette", "baseAssetReusable": False},
            },
        )
    )

    assert result["status"] == "ok"
    assert result["payload"]["musicalAsset"]["metrics"]["category"] == "fx-palette"


def test_handle_request_analyze_composition_dispatch(monkeypatch):
    monkeypatch.setattr(
        "maia_analyzer.service.analyze_composition",
        lambda source_kind, source_path, **kwargs: (
            {
                "assetType": "composition_result",
                "title": f"{source_kind}:{source_path}",
                "suggestedBpm": kwargs["reference_bpm"],
                "metrics": {"strategy": "layered"},
            },
            [],
        ),
    )

    result = handle_request(
        _req(
            "analyze",
            {
                "assetType": "composition_result",
                "source": {"kind": "directory", "path": "/tmp/base-pack"},
                "options": {
                    "baseAssetCategory": "collection",
                    "baseAssetReusable": True,
                    "compositionBaseAssetEntryCount": 8,
                    "compositionReferenceType": "track",
                    "compositionReferenceLabel": "Anchor",
                    "compositionReferenceBpm": 128.0,
                    "compositionPreviewOutputPath": "/tmp/preview.wav",
                },
            },
        )
    )

    assert result["status"] == "ok"
    assert result["payload"]["musicalAsset"]["suggestedBpm"] == 128.0


def test_handle_request_maps_value_error_to_invalid_source(monkeypatch):
    monkeypatch.setattr(
        "maia_analyzer.service.analyze_repository",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(ValueError("bad source")),
    )

    result = handle_request(
        _req(
            "analyze",
            {
                "assetType": "repo_analysis",
                "source": {"kind": "directory", "path": "/tmp/repo"},
                "options": {},
            },
        )
    )

    assert result["status"] == "error"
    assert result["error"]["code"] == "invalid_source"


def test_handle_request_maps_file_not_found_to_missing_source(monkeypatch):
    monkeypatch.setattr(
        "maia_analyzer.service.analyze_repository",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(FileNotFoundError("gone")),
    )

    result = handle_request(
        _req(
            "analyze",
            {
                "assetType": "repo_analysis",
                "source": {"kind": "directory", "path": "/tmp/repo"},
                "options": {},
            },
        )
    )

    assert result["status"] == "error"
    assert result["error"]["code"] == "missing_source"


def test_handle_request_maps_unexpected_exception_to_internal_error(monkeypatch):
    monkeypatch.setattr(
        "maia_analyzer.service.analyze_repository",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(RuntimeError("boom")),
    )

    result = handle_request(
        _req(
            "analyze",
            {
                "assetType": "repo_analysis",
                "source": {"kind": "directory", "path": "/tmp/repo"},
                "options": {},
            },
        )
    )

    assert result["status"] == "error"
    assert result["error"]["code"] == "internal_error"


def test_build_summary_covers_non_repo_asset_types():
    assert _build_summary(
        {"assetType": "track_analysis", "title": "Track A", "suggestedBpm": 125.0, "metrics": {}}
    ) == "Track analysis completed for Track A with heuristic BPM 125."
    assert _build_summary(
        {"assetType": "track_analysis", "title": "Track B", "suggestedBpm": None, "metrics": {}}
    ) == "Track intake completed for Track B with waveform heuristics only."
    assert _build_summary(
        {"assetType": "repo_analysis", "title": "Repo A", "suggestedBpm": 120.0, "metrics": {}}
    ) == "Repository analysis completed for Repo A with suggested BPM 120."
    assert _build_summary(
        {"assetType": "base_asset", "title": "Pack A", "suggestedBpm": None, "metrics": {}}
    ) == "Base asset Pack A registered for local reuse."
    assert _build_summary(
        {"assetType": "composition_result", "title": "Plan A", "suggestedBpm": 128.0, "metrics": {}}
    ) == "Composition plan completed for Plan A at target BPM 128."
    assert _build_summary(
        {
            "assetType": "composition_result",
            "title": "Plan B",
            "suggestedBpm": None,
            "metrics": {},
        }
    ) == "Composition plan completed for Plan B."
