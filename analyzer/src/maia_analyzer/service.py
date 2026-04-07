from __future__ import annotations

import platform
from typing import Any

from . import __version__
from .assets import analyze_base_asset
from .composition import analyze_composition
from .audio import analyze_track, get_supported_track_formats
from .dsp import dsp_available
from .contracts import ContractError, error_response, ok_response, parse_request
from .presets import list_presets
from .repository import analyze_repository
from .stream import (
    get_or_create_session,
    list_sessions,
    session_snapshot,
    start_process_adapter,
    stop_session,
)


def handle_request(raw: Any) -> dict[str, Any]:
    fallback_request_id = raw.get("requestId", "unknown") if isinstance(raw, dict) else "unknown"

    try:
        request = parse_request(raw)
        request_id = request["requestId"]

        if request["action"] == "health":
            return ok_response(
                request_id,
                {
                    "analyzerVersion": __version__,
                    "runtime": platform.python_version(),
                    "supportedActions": ["health", "analyze", "session_start", "session_stop", "session_list", "session_poll"],
                    "modes": [
                        "repo-heuristics",
                        "repo-tree-sitter",
                        "log-file-heuristics",
                        "log-live-tail",
                        "track-embedded-heuristic",
                        "track-librosa-dsp" if dsp_available() else "track-dsp-unavailable",
                        "stream-file-adapter",
                        "stream-process-adapter",
                        "stream-session-registry",
                        "base-assets",
                        "composition-planner",
                        "aesthetic-presets",
                    ],
                    "supportedTrackFormats": get_supported_track_formats(),
                    "presets": list_presets(),
                },
            )

        if request["action"] == "session_start":
            return _handle_session_start(request_id, request.get("payload", {}))

        if request["action"] == "session_stop":
            return _handle_session_stop(request_id, request.get("payload", {}))

        if request["action"] == "session_list":
            return ok_response(request_id, {"sessions": list_sessions()})

        if request["action"] == "session_poll":
            return _handle_session_poll(request_id, request.get("payload", {}))

        payload = request["payload"]
        options = payload.get("options", {})

        if payload["assetType"] == "repo_analysis":
            asset, warnings = analyze_repository(
                payload["source"]["kind"],
                payload["source"]["path"],
                options=options,
            )
        elif payload["assetType"] == "track_analysis":
            asset, warnings = analyze_track(
                payload["source"]["path"],
                waveform_bins=int(options.get("waveformBins", 24)),
            )
        elif payload["assetType"] == "base_asset":
            asset, warnings = analyze_base_asset(
                payload["source"]["path"],
                category=options.get("baseAssetCategory"),
                reusable=bool(options.get("baseAssetReusable", True)),
            )
        elif payload["assetType"] == "composition_result":
            asset, warnings = analyze_composition(
                payload["source"]["kind"],
                payload["source"]["path"],
                base_asset_category=options.get("baseAssetCategory"),
                reusable=bool(options.get("baseAssetReusable", True)),
                entry_count=options.get("compositionBaseAssetEntryCount"),
                reference_type=options.get("compositionReferenceType"),
                reference_label=options.get("compositionReferenceLabel"),
                reference_bpm=options.get("compositionReferenceBpm"),
                preview_output_path=options.get("compositionPreviewOutputPath"),
            )
        else:
            return error_response(
                request_id,
                "unsupported_asset_type",
                f"Analysis handler not implemented for {payload['assetType']}.",
            )

        return ok_response(
            request_id,
            {
                "summary": _build_summary(asset),
                "musicalAsset": asset,
            },
            warnings,
        )

    except ContractError as exc:
        return error_response(fallback_request_id, exc.code, str(exc))
    except ValueError as exc:
        return error_response(fallback_request_id, "invalid_source", str(exc))
    except FileNotFoundError as exc:
        return error_response(fallback_request_id, "missing_source", str(exc))
    except Exception as exc:
        return error_response(fallback_request_id, "internal_error", str(exc))


# ---------------------------------------------------------------------------
# Session action handlers
# ---------------------------------------------------------------------------


def _handle_session_start(request_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    session_id = str(payload.get("sessionId") or "")
    adapter_kind = str(payload.get("adapterKind") or "file")
    source = str(payload.get("source") or "")
    command = payload.get("command")

    if not session_id:
        return error_response(request_id, "missing_session_id", "sessionId is required.")
    if not source:
        return error_response(request_id, "missing_source", "source is required.")

    session = get_or_create_session(session_id, adapter_kind, source)

    if adapter_kind == "process":
        if not isinstance(command, list) or not command:
            return error_response(
                request_id, "missing_command", "command list is required for process adapter."
            )
        ok, err = start_process_adapter(session_id, command)
        if not ok:
            return error_response(request_id, "adapter_start_failed", err)

    return ok_response(request_id, {"session": session.describe()})


def _handle_session_stop(request_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    session_id = str(payload.get("sessionId") or "")
    if not session_id:
        return error_response(request_id, "missing_session_id", "sessionId is required.")
    stopped = stop_session(session_id)
    return ok_response(request_id, {"stopped": stopped, "sessionId": session_id})


def _handle_session_poll(request_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    """Analyze the accumulated ring buffer of a session and return signal metrics."""
    session_id = str(payload.get("sessionId") or "")
    if not session_id:
        return error_response(request_id, "missing_session_id", "sessionId is required.")

    snapshot = session_snapshot(session_id)
    if snapshot is None:
        return error_response(request_id, "session_not_found", f"No session: {session_id!r}.")

    ring = snapshot["ringBuffer"]
    if not ring:
        return ok_response(request_id, {
            "hasData": False,
            "sessionId": session_id,
            "summary": "Session buffer empty — waiting for data.",
            "session": {k: v for k, v in snapshot.items() if k != "ringBuffer"},
        })

    chunk = "\n".join(ring)
    source = snapshot["source"]
    asset, warnings = analyze_repository(
        "file",
        source,
        options={
            "inferCodeSuggestedBpm": True,
            "logTailChunk": chunk,
            "logTailLiveMode": True,
            "presetId": payload.get("presetId", "techno"),
        },
    )

    return ok_response(
        request_id,
        {
            "hasData": True,
            "sessionId": session_id,
            "summary": _build_summary(asset),
            "musicalAsset": asset,
            "session": {k: v for k, v in snapshot.items() if k != "ringBuffer"},
        },
        warnings,
    )


def _build_summary(asset: dict[str, Any]) -> str:
    asset_type = asset["assetType"]
    title = asset["title"]
    suggested_bpm = asset["suggestedBpm"]
    metrics = asset.get("metrics", {})

    if asset_type == "repo_analysis":
        if metrics.get("importMode") in {"log-file", "log-tail-window"}:
            anomaly_count = metrics.get("anomalyCount", 0)
            source_label = "Live log window" if metrics.get("importMode") == "log-tail-window" else "Log signal"
            return (
                f"{source_label} analysis completed for {title} with suggested BPM {suggested_bpm:.0f} "
                f"and {anomaly_count} anomaly markers."
            )
        return f"Repository analysis completed for {title} with suggested BPM {suggested_bpm:.0f}."
    if asset_type == "track_analysis":
        if suggested_bpm is not None:
            return f"Track analysis completed for {title} with heuristic BPM {suggested_bpm:.0f}."
        return f"Track intake completed for {title} with waveform heuristics only."
    if asset_type == "base_asset":
        return f"Base asset {title} registered for local reuse."
    if asset_type == "composition_result":
        if suggested_bpm is not None:
            return f"Composition plan completed for {title} at target BPM {suggested_bpm:.0f}."
        return f"Composition plan completed for {title}."
    return f"Analysis completed for {title}."
