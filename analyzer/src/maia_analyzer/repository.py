from __future__ import annotations

import hashlib
import re
from collections import Counter
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from urllib.parse import urlparse
from uuid import uuid4

from .stream import ingest_lines
from .presets import get_preset as get_style_preset

try:
    import numpy as np
    from sklearn.ensemble import IsolationForest
except ImportError:
    np = None
    IsolationForest = None

MAX_LOG_LINES = 4000
LOG_BUCKET_COUNT = 24
MAX_ANOMALY_MARKERS = 8
MIN_AI_ANOMALY_SAMPLE_LINES = 24

LEVEL_ALIASES = {
    "trace": "trace",
    "debug": "debug",
    "default": "info",
    "info": "info",
    "notice": "info",
    "warn": "warn",
    "warning": "warn",
    "error": "error",
    "fatal": "error",
    "critical": "error",
}
LEVEL_PATTERN = re.compile(
    r"\b(trace|debug|default|info|notice|warn|warning|error|fatal|critical)\b",
    re.IGNORECASE,
)
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
        raise NotImplementedError("Remote repository analysis is disabled in MVP.")

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

    raise NotImplementedError("Local repository analysis is disabled in MVP.")


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
        if not live_mode:
            raise FileNotFoundError(f"Log path does not exist or is not a file: {log_path}")
        # Virtual / URL / directory sources are valid in live mode —
        # log_path is used only for cosmetic title derivation below.

    raw_lines = chunk.splitlines()
    return _summarize_log_signal(
        log_path,
        raw_lines,
        live_mode=live_mode,
        from_offset=_coerce_non_negative_int(from_offset),
        to_offset=_coerce_non_negative_int(to_offset),
    )





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


def _is_anomaly_line(
    lowered_line: str,
    level: str,
    ai_score: float = 0.0,
    *,
    allow_ai: bool = True,
) -> bool:
    if level == "error":
        return True

    if any(keyword in lowered_line for keyword in ANOMALY_KEYWORDS):
        return True

    # Keep statistical anomaly detection as a fallback only for unknown log shapes.
    # Live windows with INFO/NOTICE timestamps were generating false positives.
    if allow_ai and level == "unknown" and ai_score < -0.24:
        return True

    return False


class LogAnomalyDetector:
    """Unsupervised anomaly detection for raw text logs using IsolationForest.

    Features:
    - Structural: length, character ratios, entropy
    - Pattern-based: anomaly keywords, stack traces
    - Contextual: similarity to previous line
    """
    def __init__(self, conservative: bool = True):
        self.model = IsolationForest(
            contamination=0.04 if conservative else 0.08,
            random_state=42,
            n_estimators=50  # Lightweight for latency
        ) if IsolationForest else None
        self.is_fitted = False
        self.prev_line = ""

    def _entropy(self, text: str) -> float:
        """Shannon entropy of character distribution (0-8 bits)."""
        if not text:
            return 0.0
        from collections import Counter
        from math import log2
        counts = Counter(text)
        length = len(text)
        entropy = 0.0
        for count in counts.values():
            p = count / length
            if p > 0:
                entropy -= p * log2(p)
        return entropy / 8.0  # Normalize to [0, 1]

    def _vectorize(self, line: str) -> list[float]:
        length = len(line)
        if length == 0:
            return [0.0] * 9

        # Structural features
        alpha_ratio = sum(c.isalpha() for c in line) / length
        symbol_ratio = sum(not c.isalnum() and not c.isspace() for c in line) / length
        digit_ratio = sum(c.isdigit() for c in line) / length
        entropy_norm = self._entropy(line)

        # Pattern features: anomaly indicators
        has_error_keywords = 1.0 if any(kw in line.lower() for kw in ANOMALY_KEYWORDS) else 0.0
        has_stack_trace = 1.0 if re.search(r'\s+at\s+|File.*line\s+\d+|\.rs:\d+', line) else 0.0

        # Contextual: comparison with previous line
        if self.prev_line and self.prev_line != line:
            # Simple diff ratio: how different from last line
            diff_chars = sum(1 for a, b in zip(self.prev_line, line) if a != b)
            max_len = max(len(self.prev_line), len(line))
            dissimilarity = (diff_chars / max_len) if max_len > 0 else 0.0
        else:
            dissimilarity = 0.0

        self.prev_line = line

        return [
            float(length) / 256.0,  # Normalize length [0, 1]
            alpha_ratio,
            symbol_ratio,
            digit_ratio,
            entropy_norm,
            has_error_keywords,
            has_stack_trace,
            dissimilarity,
            0.0  # Reserved for future features
        ]

    def fit(self, lines: list[str]):
        if self.model is None or not lines:
            return

        # Fit on representative sample to establish 'normalcy'
        self.prev_line = ""
        X = []
        for line in lines[:1000]:
            vec = self._vectorize(line)
            X.append(vec)

        if X:
            self.model.fit(X)
            self.is_fitted = True

        # Reset for scoring phase
        self.prev_line = ""

    def score(self, line: str) -> float:
        if not self.is_fitted or self.model is None:
            return 0.0
        X = [self._vectorize(line)]
        return float(self.model.decision_function(X)[0])


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
    options: dict[str, Any] | None = None,
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
    
    # Initialize AI Detector
    detector = LogAnomalyDetector(conservative=True)
    detector_training_lines = [line.strip() for line in raw_lines if line.strip()]
    if len(detector_training_lines) >= MIN_AI_ANOMALY_SAMPLE_LINES:
        detector.fit(detector_training_lines)

    for line_number, raw_line in enumerate(raw_lines, start=1):
        line_count += 1
        stripped = raw_line.strip()
        if not stripped:
            continue

        non_empty_line_count += 1
        lowered = stripped.lower()
        level = _detect_log_level(lowered)
        component = _extract_log_component(stripped) or "unknown"
        
        # AI Scoring
        ai_score = detector.score(stripped)
        anomaly = _is_anomaly_line(
            lowered,
            level,
            ai_score,
            allow_ai=len(detector_training_lines) >= MIN_AI_ANOMALY_SAMPLE_LINES,
        )
        
        # Level elevation if AI detects strong anomaly in unknown logs
        if level == "unknown" and ai_score < -0.15:
            level = "error" if ai_score < -0.22 else "warn"

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
            "waveformBins": cadence_bins,
            "beatGrid": [],
            "bpmCurve": [],
        },
        "createdAt": datetime.now(UTC).isoformat(),
    }

    # Inject Preset-based Visuals
    preset_id = options.get("presetId", "techno") if options else "techno"
    preset = get_style_preset(preset_id)
    asset["metrics"]["colorPalette"] = {
        "primary": preset.palette.primary,
        "secondary": preset.palette.secondary,
        "accent": preset.palette.accent,
        "background": preset.palette.background,
        "anomaly": preset.palette.anomaly,
    }
    asset["metrics"]["sonificationCues"] = _build_sonification_cues(event_records, preset)
    asset["metrics"]["stemInteraction"] = preset.stem_interaction

    return asset, warnings


def _build_sonification_cues(
    event_records: list[dict[str, Any]], 
    preset: Any,
) -> list[dict[str, Any]]:
    cues: list[dict[str, Any]] = []

    # Prioritize anomalies so they are always heard even in dense log streams
    anomalies = [r for r in event_records if r["anomaly"]]
    normals = [r for r in event_records if not r["anomaly"]]
    
    # Take up to 64 cues, prioritizing anomalies
    limited_records = (anomalies + normals)[:64]

    for record in limited_records:
        level = str(record["level"])
        anomaly = bool(record["anomaly"])
        event_index = int(record["eventIndex"])
        component = str(record["component"])
        excerpt = str(record["excerpt"])

        # Mapping governed by Style Preset
        profile = preset.mappings.get(level, preset.mappings.get("unknown"))
        
        note_hz = profile.freq_multiplier * 261.63 # Base on C4
        waveform = profile.waveform
        gain = profile.base_gain
        duration_ms = profile.base_duration_ms

        if anomaly:
            # Shift frequency up by a fifth and use more aggressive waveform
            note_hz *= 1.5
            duration_ms += 120
            gain += 0.12
            # Force aggressive waveform for anomalies to ensure they 'cut through' the mix
            if waveform in ("sine", "triangle"):
                waveform = "square" if preset.id != "ambient" else "sawtooth"

        cues.append(
            {
                "id": f"cue-{event_index}-{level}",
                "eventIndex": event_index,
                "level": level,
                "component": component,
                "excerpt": excerpt,
                "noteHz": round(note_hz, 2),
                "durationMs": duration_ms,
                "gain": round(gain, 3),
                "waveform": waveform,
                "accent": "anomaly" if anomaly else level,
                "filterCutoff": profile.filter_cutoff,
                "resonance": profile.resonance,
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
