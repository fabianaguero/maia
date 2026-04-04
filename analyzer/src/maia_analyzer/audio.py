from __future__ import annotations

import hashlib
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from uuid import uuid4


def analyze_track(source_path: str, waveform_bins: int = 24) -> tuple[dict[str, Any], list[str]]:
    track_path = Path(source_path).expanduser().resolve()
    if not track_path.is_file():
        raise FileNotFoundError(f"Track path does not exist or is not a file: {track_path}")

    size_bytes = track_path.stat().st_size
    digest = hashlib.sha256(f"{track_path}:{size_bytes}".encode("utf-8")).digest()
    bins = [round(byte / 255, 3) for byte in digest[: max(8, min(waveform_bins, 32))]]

    asset = {
        "id": str(uuid4()),
        "assetType": "track_analysis",
        "title": track_path.stem,
        "sourcePath": str(track_path),
        "suggestedBpm": None,
        "confidence": 0.18,
        "tags": ["track-analysis", track_path.suffix.lower().lstrip(".") or "unknown"],
        "metrics": {
            "fileSizeBytes": size_bytes,
            "fileExtension": track_path.suffix.lower(),
            "analysisMode": "stub",
        },
        "artifacts": {
            "waveformBins": bins,
            "beatGrid": [],
            "bpmCurve": [],
        },
        "createdAt": datetime.now(UTC).isoformat(),
    }

    warnings = [
        "Audio DSP is scaffolded only. Integrate librosa and Essentia for waveform, beat grid, and BPM curve.",
    ]
    return asset, warnings

