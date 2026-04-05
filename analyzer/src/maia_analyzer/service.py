from __future__ import annotations

import platform
from typing import Any

from . import __version__
from .assets import analyze_base_asset
from .composition import analyze_composition
from .audio import analyze_track, get_supported_track_formats
from .dsp import dsp_available
from .contracts import ContractError, error_response, ok_response, parse_request
from .repository import analyze_repository


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
                    "supportedActions": ["health", "analyze"],
                    "modes": [
                        "repo-heuristics",
                        "repo-tree-sitter",
                        "log-file-heuristics",
                        "log-live-tail",
                        "track-embedded-heuristic",
                        "track-librosa-dsp" if dsp_available() else "track-dsp-unavailable",
                        "base-assets",
                        "composition-planner",
                    ],
                    "supportedTrackFormats": get_supported_track_formats(),
                },
            )

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
