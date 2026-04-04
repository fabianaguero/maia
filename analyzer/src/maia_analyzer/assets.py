from __future__ import annotations

import hashlib
from collections import Counter
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from uuid import uuid4


def analyze_base_asset(
    source_path: str,
    category: str | None = None,
    reusable: bool = True,
) -> tuple[dict[str, Any], list[str]]:
    asset_path = Path(source_path).expanduser().resolve()
    if not asset_path.exists():
        raise FileNotFoundError(f"Base asset path does not exist: {asset_path}")

    warnings: list[str] = []

    if asset_path.is_dir():
        source_kind = "directory"
        entry_count, total_size_bytes, extension_breakdown, preview_entries = _inspect_directory(
            asset_path
        )
        detected_category = "collection"
        checksum = _digest_directory(asset_path)
        if entry_count == 0:
            warnings.append("The selected directory is empty.")
    else:
        source_kind = "file"
        entry_count = 1
        total_size_bytes = asset_path.stat().st_size
        extension = asset_path.suffix.lower().lstrip(".") or "file"
        extension_breakdown = {extension: 1}
        preview_entries = [asset_path.name]
        detected_category = _infer_file_category(asset_path)
        checksum = _digest_file(asset_path)

    applied_category = category or detected_category
    tags = ["base-asset", applied_category, source_kind]
    tags.append("reusable" if reusable else "reference-only")

    metrics = {
        "category": applied_category,
        "detectedCategory": detected_category,
        "entryCount": entry_count,
        "sourceKind": source_kind,
        "reusable": reusable,
        "checksum": checksum,
        "totalSizeBytes": total_size_bytes,
        "extensionBreakdown": extension_breakdown,
        "previewEntries": preview_entries,
    }

    asset = {
        "id": str(uuid4()),
        "assetType": "base_asset",
        "title": asset_path.name,
        "sourcePath": str(asset_path),
        "suggestedBpm": None,
        "confidence": 0.74 if source_kind == "directory" else 0.79,
        "tags": tags,
        "metrics": metrics,
        "artifacts": {
            "waveformBins": [],
            "beatGrid": [],
            "bpmCurve": [],
        },
        "createdAt": datetime.now(UTC).isoformat(),
    }

    if source_kind == "directory":
        warnings.append(
            "Base assets are referenced in place for MVP. Managed copies inside Maia storage are deferred."
        )

    return asset, warnings


def _inspect_directory(path: Path) -> tuple[int, int, dict[str, int], list[str]]:
    entry_count = 0
    total_size_bytes = 0
    extension_breakdown: Counter[str] = Counter()
    preview_entries: list[str] = []

    for child in path.rglob("*"):
        if not child.is_file():
            continue

        entry_count += 1
        total_size_bytes += child.stat().st_size
        extension_breakdown[child.suffix.lower().lstrip(".") or "<none>"] += 1

        if len(preview_entries) < 6:
            try:
                preview_entries.append(str(child.relative_to(path)))
            except ValueError:
                preview_entries.append(child.name)

    return entry_count, total_size_bytes, dict(extension_breakdown.most_common(8)), preview_entries


def _infer_file_category(path: Path) -> str:
    extension = path.suffix.lower()
    if extension in {".wav", ".mp3", ".flac", ".ogg", ".oga", ".aif", ".aiff", ".m4a"}:
        return "fx-palette"
    if extension in {".mid", ".midi"}:
        return "bass-motif"
    if extension in {".json", ".txt", ".md", ".log"}:
        return "code-pattern"
    return extension.lstrip(".") or "file"


def _digest_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(65536):
            digest.update(chunk)
    return digest.hexdigest()


def _digest_directory(path: Path) -> str:
    digest = hashlib.sha256()

    for child in sorted(path.rglob("*")):
        relative = child.relative_to(path).as_posix()
        digest.update(relative.encode("utf-8"))
        if child.is_file():
            digest.update(str(child.stat().st_size).encode("utf-8"))

    return digest.hexdigest()
