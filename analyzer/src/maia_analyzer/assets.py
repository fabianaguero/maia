from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from uuid import uuid4


def analyze_base_asset(source_path: str) -> tuple[dict[str, Any], list[str]]:
    asset_path = Path(source_path).expanduser().resolve()
    if not asset_path.exists():
        raise FileNotFoundError(f"Base asset path does not exist: {asset_path}")

    if asset_path.is_dir():
        category = "collection"
        entry_count = sum(1 for _ in asset_path.iterdir())
        source_kind = "directory"
    else:
        category = asset_path.suffix.lower().lstrip(".") or "file"
        entry_count = 1
        source_kind = "file"

    asset = {
        "id": str(uuid4()),
        "assetType": "base_asset",
        "title": asset_path.name,
        "sourcePath": str(asset_path),
        "suggestedBpm": None,
        "confidence": 0.72,
        "tags": ["base-asset", category, source_kind],
        "metrics": {
            "category": category,
            "entryCount": entry_count,
            "sourceKind": source_kind,
        },
        "artifacts": {
            "waveformBins": [],
            "beatGrid": [],
            "bpmCurve": [],
        },
        "createdAt": datetime.now(UTC).isoformat(),
    }

    return asset, []

