from __future__ import annotations

import hashlib
import re
from collections import Counter
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from urllib.parse import urlparse
from uuid import uuid4

from .treesitter import analyze_java_sources, analyze_kotlin_sources, build_repo_waveform_bins
from .stream import ingest_lines

MAX_LOG_LINES = 4000
LOG_BUCKET_COUNT = 24
MAX_ANOMALY_MARKERS = 8

LEVEL_ALIASES = {
    "trace": "trace",
    "debug": "debug",
    "info": "info",
    "warn": "warn",
    "warning": "warn",
    "error": "error",
    "fatal": "error",
    "critical": "error",
}
LEVEL_PATTERN = re.compile(r"\b(trace|debug|info|warn|warning|error|fatal|critical)\b", re.IGNORECASE)
TIMESTAMP_PATTERN = re.compile(
    r"^\s*(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}|"
    r"\d{2}:\d{2}:\d{2}|"
    r"[A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})"
)
BRACKET_COMPONENT_PATTERN = re.compile(r"\[([A-Za-z0-9_.:/-]{2,64})\]")
KEY_VALUE_COMPONENT_PATTERN = re.compile(
    r"\b(?:component|service|logger|module|class|source)=([A-Za-z0-9_.:/-]{2,64})",
    re.IGNORECASE,
)
ANOMALY_KEYWORDS = {
    "panic",
    "exception",
    "timeout",
    "timed out",
    "connection refused",
    "refused",
    "failed",
    "fatal",
    "critical",
    "deadlock",
    "outofmemory",
    "out of memory",
    "oom",
    "unavailable",
    "reset by peer",
}


def analyze_repository(
    source_kind: str,
    source_path: str,
    options: dict[str, Any] | None = None,
) -> tuple[dict[str, Any], list[str]]:
    if source_kind == "url":
        return _analyze_remote_repository(source_path)

    resolved_path = Path(source_path).expanduser().resolve()
    if source_kind == "file" or resolved_path.is_file():
        if isinstance(options, dict) and isinstance(options.get("logTailChunk"), str):
            session_id = options.get("logTailSessionId")
            chunk = options["logTailChunk"]
            if session_id:
                ingest_lines(str(session_id), chunk.splitlines())
            return _analyze_log_chunk(
                source_path,
                options["logTailChunk"],
                from_offset=options.get("logTailFromOffset"),
                to_offset=options.get("logTailToOffset"),
                live_mode=bool(options.get("logTailLiveMode", False)),
            )
        return _analyze_log_file(source_path)

    return _analyze_local_repository(source_path, options=options)


def _analyze_local_repository(
    source_path: str,
    options: dict[str, Any] | None = None,
) -> tuple[dict[str, Any], list[str]]:
    root = Path(source_path).expanduser().resolve()
    if not root.is_dir():
        raise FileNotFoundError(f"Repository path does not exist or is not a directory: {root}")

    warnings: list[str] = []
    extension_counts: Counter[str] = Counter()
    sample_packages: set[str] = set()

    java_files = 0
    kotlin_files = 0
    test_files = 0
    controller_count = 0
    service_count = 0
    repository_count = 0
    entity_count = 0
    resource_count = 0
    has_jakarta = False
    has_javax = False

    java_paths: list[Path] = []
    kotlin_paths: list[Path] = []
    allowed_extensions = _normalize_extension_filter(options)
    allowed_languages = _normalize_language_filter(options)
    extension_by_language = {
        "java": ".java",
        "kotlin": ".kt",
    }

    for file_path in root.rglob("*"):
        if not file_path.is_file():
            continue

        extension = file_path.suffix.lower() or "<none>"
        if not _should_include_extension(
            extension,
            allowed_extensions,
            allowed_languages,
            extension_by_language,
        ):
            continue
        extension_counts[extension] += 1

        if extension == ".java":
            java_files += 1
            if len(java_paths) < 600:
                java_paths.append(file_path)
            lower_name = file_path.name.lower()
            lower_parts = [part.lower() for part in file_path.parts]

            if "test" in lower_parts or lower_name.endswith("test.java"):
                test_files += 1
            if lower_name.endswith("controller.java"):
                controller_count += 1
            if lower_name.endswith("service.java"):
                service_count += 1
            if lower_name.endswith("repository.java"):
                repository_count += 1
            if lower_name.endswith("entity.java"):
                entity_count += 1
            if lower_name.endswith("resource.java"):
                resource_count += 1

            if len(sample_packages) < 5:
                try:
                    relative_parent = file_path.parent.relative_to(root)
                    sample_packages.add(str(relative_parent))
                except ValueError:
                    pass

            if java_files <= 25:
                content = file_path.read_text(encoding="utf-8", errors="ignore")
                has_jakarta = has_jakarta or ("jakarta." in content)
                has_javax = has_javax or ("javax." in content)

        if extension == ".kt":
            kotlin_files += 1
            if len(kotlin_paths) < 400:
                kotlin_paths.append(file_path)

    build_system = "plain"
    if (root / "pom.xml").exists():
        build_system = "maven"
    elif any((root / name).exists() for name in ("build.gradle", "build.gradle.kts", "settings.gradle.kts")):
        build_system = "gradle"

    if java_files == 0 and kotlin_files == 0:
        warnings.append("No Java or Kotlin source files were detected.")

    ast_metrics = analyze_java_sources(java_paths)
    kt_metrics = analyze_kotlin_sources(kotlin_paths)
    ast_enabled = bool(ast_metrics.get("enabled"))
    kt_enabled = bool(kt_metrics.get("enabled")) and kotlin_files > 0
    ast_class_count = int(ast_metrics.get("classCount", 0) or 0)
    ast_method_count = int(ast_metrics.get("methodCount", 0) or 0)
    ast_annotation_count = int(ast_metrics.get("annotationCount", 0) or 0)
    ast_endpoint_count = int(ast_metrics.get("endpointAnnotationCount", 0) or 0)
    kt_class_count = int(kt_metrics.get("classCount", 0) or 0)
    kt_function_count = int(kt_metrics.get("functionCount", 0) or 0)

    suggested_bpm = max(
        85,
        min(
            160,
            96
            + min(32, java_files // 8)
            + min(12, kotlin_files // 10)
            + controller_count * 2
            + service_count
            + repository_count
            + entity_count // 2
            + (6 if has_jakarta else 0)
            + (3 if has_javax else 0)
            + (min(12, ast_method_count // 40) if ast_enabled else 0)
            + (min(10, ast_class_count // 30) if ast_enabled else 0)
            + (min(6, ast_annotation_count // 80) if ast_enabled else 0)
            + (min(8, ast_endpoint_count * 2) if ast_enabled else 0)
            + (min(8, kt_function_count // 30) if kt_enabled else 0)
            + (min(6, kt_class_count // 20) if kt_enabled else 0)
            + (4 if build_system == "maven" else 2 if build_system == "gradle" else 0),
        ),
    )

    confidence = round(
        min(
            0.94,
            0.3
            + min(0.35, java_files / 400)
            + min(0.12, kotlin_files / 200)
            + (0.1 if build_system != "plain" else 0)
            + (0.07 if has_jakarta or has_javax else 0)
            + (0.06 if ast_enabled and ast_metrics.get("parseErrors", 0) == 0 else 0)
            + (0.04 if kt_enabled and kt_metrics.get("parseErrors", 0) == 0 else 0),
        ),
        2,
    )

    primary_language = "java"
    if kotlin_files > java_files:
        primary_language = "kotlin"
    elif java_files == 0 and kotlin_files == 0:
        primary_language = "unknown"

    tags = ["repo-analysis", build_system, primary_language]
    if has_jakarta:
        tags.append("jakarta-ee")
    elif has_javax:
        tags.append("java-ee")
    if ast_enabled:
        tags.append("tree-sitter-java")
    if kt_enabled:
        tags.append("tree-sitter-kotlin")

    metrics = {
        "buildSystem": build_system,
        "primaryLanguage": primary_language,
        "javaFileCount": java_files,
        "kotlinFileCount": kotlin_files,
        "testFileCount": test_files,
        "controllerCount": controller_count,
        "serviceCount": service_count,
        "repositoryCount": repository_count,
        "entityCount": entity_count,
        "resourceCount": resource_count,
        "samplePackages": sorted(sample_packages),
        "fileExtensionBreakdown": dict(extension_counts.most_common(8)),
        "astEnabled": ast_enabled,
        "astFileCount": ast_metrics.get("fileCount", 0),
        "astFileLimit": ast_metrics.get("fileLimit", 0),
        "astParseErrors": ast_metrics.get("parseErrors", 0),
        "astClassCount": ast_metrics.get("classCount", 0),
        "astInterfaceCount": ast_metrics.get("interfaceCount", 0),
        "astEnumCount": ast_metrics.get("enumCount", 0),
        "astRecordCount": ast_metrics.get("recordCount", 0),
        "astMethodCount": ast_metrics.get("methodCount", 0),
        "astFieldCount": ast_metrics.get("fieldCount", 0),
        "astAnnotationCount": ast_metrics.get("annotationCount", 0),
        "astEndpointAnnotationCount": ast_metrics.get("endpointAnnotationCount", 0),
        "astJakartaImportCount": ast_metrics.get("jakartaImportCount", 0),
        "astJavaxImportCount": ast_metrics.get("javaxImportCount", 0),
        "astAnnotationBreakdown": ast_metrics.get("annotationBreakdown", {}),
        "ktAstEnabled": kt_enabled,
        "ktAstFileCount": kt_metrics.get("fileCount", 0),
        "ktAstClassCount": kt_metrics.get("classCount", 0),
        "ktAstFunctionCount": kt_metrics.get("functionCount", 0),
        "ktAstPropertyCount": kt_metrics.get("propertyCount", 0),
        "ktAstEndpointAnnotationCount": kt_metrics.get("endpointAnnotationCount", 0),
        "ktAstAnnotationBreakdown": kt_metrics.get("annotationBreakdown", {}),
    }

    if ast_enabled is False and ast_metrics.get("error"):
        warnings.append(str(ast_metrics["error"]))

    if allowed_extensions or allowed_languages:
        metrics["parseExtensionFilter"] = sorted(allowed_extensions)
        metrics["parseLanguageFilter"] = sorted(allowed_languages)

    repo_waveform = build_repo_waveform_bins(java_paths, kotlin_paths)
    repo_beat_grid = _repo_beat_grid(float(suggested_bpm), len(repo_waveform))
    repo_bpm_curve = _repo_bpm_curve(float(suggested_bpm), len(repo_waveform))

    asset = {
        "id": str(uuid4()),
        "assetType": "repo_analysis",
        "title": root.name,
        "sourcePath": str(root),
        "suggestedBpm": float(suggested_bpm),
        "confidence": confidence,
        "tags": tags,
        "metrics": metrics,
        "artifacts": {
            "waveformBins": repo_waveform,
            "beatGrid": repo_beat_grid,
            "bpmCurve": repo_bpm_curve,
        },
        "createdAt": datetime.now(UTC).isoformat(),
    }

    return asset, warnings


def _normalize_extension_filter(options: dict[str, Any] | None) -> set[str]:
    if not options:
        return set()
    raw = options.get("parseExtensions")
    if not isinstance(raw, list):
        return set()
    normalized = {str(item).strip().lower() for item in raw if str(item).strip()}
    return {ext if ext.startswith(".") else f".{ext}" for ext in normalized}


def _normalize_language_filter(options: dict[str, Any] | None) -> set[str]:
    if not options:
        return set()
    raw = options.get("parseLanguages")
    if not isinstance(raw, list):
        return set()
    return {str(item).strip().lower() for item in raw if str(item).strip()}


def _should_include_extension(
    extension: str,
    allowed_extensions: set[str],
    allowed_languages: set[str],
    extension_by_language: dict[str, str],
) -> bool:
    if not allowed_extensions and not allowed_languages:
        return True

    if allowed_extensions and extension in allowed_extensions:
        return True

    if allowed_languages:
        for language in allowed_languages:
            if extension_by_language.get(language) == extension:
                return True

    return False


def _repo_beat_grid(bpm: float, bin_count: int) -> list[float]:
    """Return beat positions (0.0–1.0) normalized to the waveform bin count."""
    if bpm <= 0 or bin_count <= 0:
        return []
    seconds_per_beat = 60.0 / bpm
    total_seconds = bin_count * 0.5  # treat each bin as ~0.5s for display purposes
    beats: list[float] = []
    t = 0.0
    while t < total_seconds:
        beats.append(round(t / total_seconds, 5))
        t += seconds_per_beat
    return beats


def _repo_bpm_curve(bpm: float, bin_count: int) -> list[dict[str, float]]:
    """Return a flat BPM curve with 5 evenly-spaced checkpoints."""
    if bpm <= 0 or bin_count <= 0:
        return []
    return [
        {"position": round(i / 4, 2), "bpm": round(bpm, 2)}
        for i in range(5)
    ]


def _analyze_log_file(source_path: str) -> tuple[dict[str, Any], list[str]]:
    log_path = Path(source_path).expanduser().resolve()
    if not log_path.is_file():
        raise FileNotFoundError(f"Log path does not exist or is not a file: {log_path}")

    raw_lines: list[str] = []
    truncated = False

    with log_path.open("r", encoding="utf-8", errors="ignore") as handle:
        for line_number, raw_line in enumerate(handle, start=1):
            if line_number > MAX_LOG_LINES:
                truncated = True
                break
            raw_lines.append(raw_line)

    return _summarize_log_signal(
        log_path,
        raw_lines,
        live_mode=False,
        truncated=truncated,
    )


def _analyze_log_chunk(
    source_path: str,
    chunk: str,
    *,
    from_offset: Any = None,
    to_offset: Any = None,
    live_mode: bool = False,
) -> tuple[dict[str, Any], list[str]]:
    log_path = Path(source_path).expanduser().resolve()
    if not log_path.is_file():
        raise FileNotFoundError(f"Log path does not exist or is not a file: {log_path}")

    raw_lines = chunk.splitlines()
    return _summarize_log_signal(
        log_path,
        raw_lines,
        live_mode=live_mode,
        from_offset=_coerce_non_negative_int(from_offset),
        to_offset=_coerce_non_negative_int(to_offset),
    )


def _analyze_remote_repository(source_path: str) -> tuple[dict[str, Any], list[str]]:
    parsed = urlparse(source_path)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError(f"Repository URL is invalid: {source_path}")

    path_parts = [part for part in parsed.path.split("/") if part]
    repo_name = path_parts[-1].removesuffix(".git") if path_parts else parsed.netloc
    owner = path_parts[-2] if len(path_parts) >= 2 else "unknown"
    provider = "github" if parsed.netloc.lower() == "github.com" else parsed.netloc.lower()

    seed = int(hashlib.sha1(source_path.encode("utf-8")).hexdigest()[:8], 16)
    suggested_bpm = 88 + (seed % 48)
    confidence = 0.34 if provider == "github" else 0.22

    asset = {
        "id": str(uuid4()),
        "assetType": "repo_analysis",
        "title": repo_name or "remote-repository",
        "sourcePath": source_path,
        "suggestedBpm": float(suggested_bpm),
        "confidence": confidence,
        "tags": ["repo-analysis", "remote-url", provider],
        "metrics": {
            "buildSystem": "unknown",
            "primaryLanguage": "unknown",
            "javaFileCount": 0,
            "kotlinFileCount": 0,
            "testFileCount": 0,
            "controllerCount": 0,
            "serviceCount": 0,
            "repositoryCount": 0,
            "entityCount": 0,
            "resourceCount": 0,
            "samplePackages": [],
            "fileExtensionBreakdown": {},
            "importMode": "remote-url",
            "provider": provider,
            "owner": owner,
            "repoName": repo_name,
            "remoteCloneAvailable": False,
        },
        "artifacts": {
            "waveformBins": [],
            "beatGrid": [],
            "bpmCurve": [],
        },
        "createdAt": datetime.now(UTC).isoformat(),
    }

    warnings = [
        "Remote repository intake is metadata-only for MVP.",
        "Clone or import a local checkout to run code heuristics over filesystem contents.",
    ]
    return asset, warnings


def _detect_log_level(lowered_line: str) -> str:
    match = LEVEL_PATTERN.search(lowered_line)
    if not match:
        return "unknown"

    return LEVEL_ALIASES[match.group(1).lower()]


def _extract_log_component(line: str) -> str | None:
    for match in BRACKET_COMPONENT_PATTERN.finditer(line):
        candidate = match.group(1)
        if not TIMESTAMP_PATTERN.match(candidate):
            return candidate

    key_value_match = KEY_VALUE_COMPONENT_PATTERN.search(line)
    if key_value_match:
        return key_value_match.group(1)

    return None


def _is_anomaly_line(lowered_line: str, level: str) -> bool:
    if level == "error":
        return True

    return any(keyword in lowered_line for keyword in ANOMALY_KEYWORDS)


def _event_weight(level: str, anomaly: bool) -> float:
    weight = {
        "trace": 0.3,
        "debug": 0.45,
        "info": 0.8,
        "warn": 1.8,
        "error": 3.4,
        "unknown": 0.65,
    }.get(level, 0.65)

    if anomaly:
        weight += 1.2

    return weight


def _build_log_cadence_bins(samples: list[float]) -> list[float]:
    if not samples:
        return []

    bucket_count = min(LOG_BUCKET_COUNT, max(1, len(samples)))
    buckets = [0.0] * bucket_count

    for index, sample in enumerate(samples):
        bucket_index = min(bucket_count - 1, int(index * bucket_count / len(samples)))
        buckets[bucket_index] += sample

    peak = max(buckets) or 1.0
    return [round(bucket / peak, 3) for bucket in buckets]


def _dominant_level(level_counts: Counter[str]) -> str:
    for level, _count in level_counts.most_common():
        if level != "unknown":
            return level
    return "unknown"


def _log_bpm(
    non_empty_line_count: int,
    level_counts: Counter[str],
    anomaly_count: int,
    cadence_bins: list[float],
) -> int:
    warn_count = level_counts.get("warn", 0)
    error_count = level_counts.get("error", 0)
    activity_pressure = min(14, non_empty_line_count // 120)
    severity_ratio = (warn_count + (error_count * 2) + (anomaly_count * 2)) / max(
        1,
        non_empty_line_count,
    )
    severity_pressure = min(26, int(round(severity_ratio * 140)))
    burst_bonus = 7 if cadence_bins and max(cadence_bins) >= 0.88 else 0
    return max(82, min(160, 92 + activity_pressure + severity_pressure + burst_bonus))


def _log_confidence(
    non_empty_line_count: int,
    timestamped_line_count: int,
    anomaly_count: int,
    component_counts: Counter[str],
) -> float:
    return round(
        min(
            0.94,
            0.36
            + min(0.28, non_empty_line_count / 1800)
            + min(0.1, timestamped_line_count / 600)
            + (0.08 if anomaly_count > 0 else 0.0)
            + (0.06 if component_counts else 0.0),
        ),
        2,
    )


def _summarize_log_signal(
    log_path: Path,
    raw_lines: list[str],
    *,
    live_mode: bool,
    from_offset: int | None = None,
    to_offset: int | None = None,
    truncated: bool = False,
) -> tuple[dict[str, Any], list[str]]:
    warnings: list[str] = []
    level_counts: Counter[str] = Counter()
    component_counts: Counter[str] = Counter()
    cadence_samples: list[float] = []
    anomaly_markers: list[dict[str, Any]] = []
    event_records: list[dict[str, Any]] = []
    line_count = 0
    non_empty_line_count = 0
    timestamped_line_count = 0
    anomaly_count = 0

    for line_number, raw_line in enumerate(raw_lines, start=1):
        line_count += 1
        stripped = raw_line.strip()
        if not stripped:
            continue

        non_empty_line_count += 1
        lowered = stripped.lower()
        level = _detect_log_level(lowered)
        component = _extract_log_component(stripped) or "unknown"
        anomaly = _is_anomaly_line(lowered, level)

        level_counts[level] += 1
        if component != "unknown":
            component_counts[component] += 1
        if TIMESTAMP_PATTERN.search(stripped):
            timestamped_line_count += 1
        if anomaly:
            anomaly_count += 1
            if len(anomaly_markers) < MAX_ANOMALY_MARKERS:
                anomaly_markers.append(
                    {
                        ("eventIndex" if live_mode else "lineNumber"): line_number,
                        "level": level,
                        "component": component,
                        "excerpt": stripped[:140],
                    }
                )

        event_records.append(
            {
                "eventIndex": line_number,
                "level": level,
                "component": component,
                "anomaly": anomaly,
                "excerpt": stripped[:140],
            }
        )
        cadence_samples.append(_event_weight(level, anomaly))

    cadence_bins = _build_log_cadence_bins(cadence_samples)
    dominant_level = _dominant_level(level_counts)
    top_components = [
        {"component": name, "count": count}
        for name, count in component_counts.most_common(5)
    ]
    suggested_bpm = _log_bpm(non_empty_line_count, level_counts, anomaly_count, cadence_bins)
    confidence = _log_confidence(
        non_empty_line_count,
        timestamped_line_count,
        anomaly_count,
        component_counts,
    )
    file_extension = log_path.suffix.lower().lstrip(".") or "log"

    if truncated:
        warnings.append(
            f"Maia analyzed the first {MAX_LOG_LINES} log lines for MVP latency control."
        )
    if non_empty_line_count == 0:
        warnings.append(
            "No complete log lines were available in this window yet. Maia is waiting for more data."
            if live_mode
            else "The selected log file is empty after whitespace filtering."
        )
    elif sum(level_counts.values()) == level_counts.get("unknown", 0):
        warnings.append(
            "No explicit log levels were detected. Maia still inferred a rhythmic profile from line cadence."
        )
    if anomaly_count == 0 and non_empty_line_count > 0:
        warnings.append(
            "No anomaly keywords were detected. This log source currently looks steady rather than spiky."
        )

    metrics = {
        "buildSystem": "log-stream",
        "primaryLanguage": "logs",
        "javaFileCount": 0,
        "kotlinFileCount": 0,
        "testFileCount": 0,
        "controllerCount": 0,
        "serviceCount": 0,
        "repositoryCount": 0,
        "entityCount": 0,
        "resourceCount": 0,
        "samplePackages": [],
        "fileExtensionBreakdown": {file_extension: 1},
        "sourceKind": "file",
        "importMode": "log-tail-window" if live_mode else "log-file",
        "lineCount": line_count,
        "nonEmptyLineCount": non_empty_line_count,
        "timestampedLineCount": timestamped_line_count,
        "levelCounts": dict(level_counts),
        "dominantLevel": dominant_level,
        "anomalyCount": anomaly_count,
        "anomalyRatio": round(anomaly_count / max(1, non_empty_line_count), 3),
        "topComponents": top_components,
        "logCadenceBins": cadence_bins,
        "logCadenceBucketCount": len(cadence_bins),
        "anomalyMarkers": anomaly_markers,
        "detectedFormat": file_extension,
        "trackedAs": "log-tail-window" if live_mode else "log-signal",
        "sonificationCues": _build_sonification_cues(event_records),
    }
    if live_mode:
        metrics["logTailFromOffset"] = from_offset
        metrics["logTailToOffset"] = to_offset

    tags = ["repo-analysis", "log-file", f"dominant:{dominant_level}"]
    if anomaly_count > 0:
        tags.append("anomaly-spikes")
    if timestamped_line_count > 0:
        tags.append("timestamped")
    if live_mode:
        tags.append("live-window")

    asset = {
        "id": str(uuid4()),
        "assetType": "repo_analysis",
        "title": log_path.stem or log_path.name,
        "sourcePath": str(log_path),
        "suggestedBpm": float(suggested_bpm),
        "confidence": confidence,
        "tags": tags,
        "metrics": metrics,
        "artifacts": {
            "waveformBins": [],
            "beatGrid": [],
            "bpmCurve": [],
        },
        "createdAt": datetime.now(UTC).isoformat(),
    }

    return asset, warnings


def _build_sonification_cues(event_records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    cues: list[dict[str, Any]] = []

    for record in event_records[:24]:
        level = str(record["level"])
        anomaly = bool(record["anomaly"])
        event_index = int(record["eventIndex"])
        component = str(record["component"])
        excerpt = str(record["excerpt"])

        note_hz = {
            "trace": 196.0,
            "debug": 220.0,
            "info": 261.63,
            "warn": 329.63,
            "error": 392.0,
            "unknown": 246.94,
        }.get(level, 246.94)
        if anomaly:
            note_hz *= 1.5

        cues.append(
            {
                "id": f"cue-{event_index}-{level}",
                "eventIndex": event_index,
                "level": level,
                "component": component,
                "excerpt": excerpt,
                "noteHz": round(note_hz, 2),
                "durationMs": 260 if anomaly else 180 if level in {"warn", "error"} else 120,
                "gain": 0.22 if anomaly else 0.16 if level in {"warn", "error"} else 0.1,
                "waveform": "sawtooth" if anomaly else "triangle" if level == "warn" else "sine",
                "accent": "anomaly" if anomaly else level,
            }
        )

    return cues


def _coerce_non_negative_int(value: Any) -> int | None:
    if isinstance(value, bool) or value is None:
        return None

    if isinstance(value, int):
        return max(0, value)

    if isinstance(value, float) and value.is_integer():
        return max(0, int(value))

    return None
