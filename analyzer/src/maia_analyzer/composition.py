from __future__ import annotations

import hashlib
import math
import struct
import wave
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from uuid import uuid4


SUPPORTED_REFERENCE_TYPES = {"track", "repo", "manual"}


def analyze_composition(
    source_kind: str,
    source_path: str,
    *,
    base_asset_category: str | None = None,
    reusable: bool = True,
    entry_count: int | None = None,
    reference_type: str | None = None,
    reference_label: str | None = None,
    reference_bpm: float | None = None,
    preview_output_path: str | None = None,
) -> tuple[dict[str, Any], list[str]]:
    asset_path = Path(source_path).expanduser().resolve()
    if not asset_path.exists():
        raise FileNotFoundError(f"Composition base asset path does not exist: {asset_path}")

    warnings: list[str] = []
    detected_source_kind = "directory" if asset_path.is_dir() else "file"
    normalized_source_kind = detected_source_kind

    if source_kind in {"file", "directory"} and source_kind != detected_source_kind:
        warnings.append(
            "The selected base asset kind did not match the current filesystem source. Maia used the detected kind."
        )

    normalized_reference_type = (reference_type or "").strip().lower()
    if normalized_reference_type not in SUPPORTED_REFERENCE_TYPES:
        raise ValueError(
            f"Unsupported composition reference type: {reference_type!r}. "
            "Expected 'track', 'repo', or 'manual'."
        )

    if reference_bpm is None or not math.isfinite(reference_bpm) or reference_bpm <= 0:
        raise ValueError("Composition target BPM must be a positive number.")

    target_bpm = round(min(180.0, max(60.0, float(reference_bpm))), 3)
    normalized_reference_label = (
        (reference_label or "").strip()
        or ("Manual BPM reference" if normalized_reference_type == "manual" else "Reference asset")
    )
    normalized_category = (
        (base_asset_category or "").strip()
        or ("collection" if normalized_source_kind == "directory" else "file")
    )
    resolved_entry_count = max(1, entry_count or _resolve_entry_count(asset_path))
    strategy = _strategy_for(normalized_category, normalized_reference_type, resolved_entry_count)
    preview_duration_seconds = _preview_duration_seconds(target_bpm)
    waveform_bins = _preview_waveform_bins(
        f"{asset_path}:{normalized_category}:{normalized_reference_type}:{target_bpm}",
        56,
    )
    beat_grid = _build_beat_grid(preview_duration_seconds, target_bpm)
    bpm_curve = _build_bpm_curve(preview_duration_seconds, target_bpm)
    recommended_layers = _recommended_layers(normalized_category, resolved_entry_count)
    arrangement_plan = _arrangement_plan(
        normalized_category,
        normalized_reference_type,
        normalized_reference_label,
        reusable,
    )
    arrangement_sections = _arrangement_sections(
        preview_duration_seconds,
        target_bpm,
        normalized_category,
        normalized_reference_type,
        strategy,
    )
    cue_points = _cue_points(arrangement_sections)
    render_preview = _render_preview(
        normalized_category,
        normalized_reference_type,
        strategy,
        arrangement_sections,
    )
    confidence = round(
        min(
            0.93,
            0.54
            + (0.12 if reusable else 0.04)
            + min(0.15, resolved_entry_count / 40)
            + (0.08 if normalized_reference_type != "manual" else 0.03),
        ),
        2,
    )
    intensity_band = _intensity_band(target_bpm, normalized_category)
    summary = (
        f"Composition plan prepared for {asset_path.name} using {normalized_reference_label} "
        f"at {target_bpm:.0f} BPM with {strategy} strategy."
    )

    if not reusable:
        warnings.append(
            "The selected base asset is marked as reference-only. Maia still generated a composition plan, but reuse remains intentionally limited."
        )
    if resolved_entry_count < 2 and normalized_source_kind == "directory":
        warnings.append(
            "The selected base collection has very few entries, so layering recommendations are conservative."
        )
    if normalized_reference_type == "manual":
        warnings.append(
            "Manual BPM compositions use the typed tempo directly; there is no linked track or repository heuristic source."
        )

    tags = [
        "composition-result",
        f"category:{normalized_category}",
        f"reference:{normalized_reference_type}",
        f"strategy:{strategy}",
    ]
    if reusable:
        tags.append("reusable-base")

    metrics = {
        "analysisMode": "composition-planner",
        "baseAssetCategory": normalized_category,
        "baseAssetSourceKind": normalized_source_kind,
        "baseAssetReusable": reusable,
        "baseAssetEntryCount": resolved_entry_count,
        "referenceType": normalized_reference_type,
        "referenceLabel": normalized_reference_label,
        "referenceBpm": target_bpm,
        "targetBpm": target_bpm,
        "strategy": strategy,
        "intensityBand": intensity_band,
        "previewDurationSeconds": preview_duration_seconds,
        "recommendedBars": 16,
        "recommendedLayerCount": recommended_layers,
        "arrangementPlan": arrangement_plan,
        "arrangementSections": arrangement_sections,
        "cuePoints": cue_points,
        "renderPreview": render_preview,
    }

    if preview_output_path:
        try:
            preview_audio = _write_preview_wav(
                Path(preview_output_path),
                target_bpm,
                preview_duration_seconds,
                arrangement_sections,
                render_preview,
            )
        except OSError as exc:
            warnings.append(f"Maia could not write composition preview audio: {exc}")
        else:
            metrics["previewAudioPath"] = preview_audio["path"]
            metrics["previewAudioFormat"] = preview_audio["format"]
            metrics["previewAudioSampleRateHz"] = preview_audio["sampleRateHz"]
            metrics["previewAudioChannels"] = preview_audio["channels"]
            metrics["previewAudioDurationSeconds"] = preview_audio["durationSeconds"]

    asset = {
        "id": str(uuid4()),
        "assetType": "composition_result",
        "title": f"{asset_path.stem or asset_path.name} x {normalized_reference_label}",
        "sourcePath": str(asset_path),
        "suggestedBpm": target_bpm,
        "confidence": confidence,
        "tags": tags,
        "metrics": metrics,
        "artifacts": {
            "waveformBins": waveform_bins,
            "beatGrid": beat_grid,
            "bpmCurve": bpm_curve,
        },
        "createdAt": datetime.now(UTC).isoformat(),
    }

    return asset, warnings


def _resolve_entry_count(asset_path: Path) -> int:
    if asset_path.is_file():
        return 1

    return sum(1 for child in asset_path.rglob("*") if child.is_file())


def _strategy_for(category: str, reference_type: str, entry_count: int) -> str:
    if category == "drum-kit":
        return "rhythm-foundation"
    if category == "bass-motif":
        return "low-end-anchor"
    if category == "pad-texture":
        return "harmonic-bed"
    if category == "fx-palette":
        return "transition-accent"
    if category == "vocal-hook":
        return "hook-framing"
    if category == "code-pattern":
        return "pattern-translation"
    if reference_type == "repo":
        return "structure-follow"
    if entry_count > 12:
        return "layered-pack"
    return "focused-sketch"


def _preview_duration_seconds(target_bpm: float) -> float:
    bars = 16
    beats = bars * 4
    return round(beats * 60.0 / target_bpm, 3)


def _preview_waveform_bins(seed_source: str, length: int) -> list[float]:
    digest = hashlib.sha1(seed_source.encode("utf-8")).digest()
    state = int.from_bytes(digest[:8], "big") or 1
    bins: list[float] = []

    for index in range(length):
        state = (state * 6364136223846793005 + 1442695040888963407) & ((1 << 64) - 1)
        raw = ((state >> 32) & 0xFFFFFFFF) / 0xFFFFFFFF
        envelope = 0.42 + math.sin((index / max(1, length - 1)) * math.pi) * 0.58
        bins.append(round(min(1.0, raw * envelope), 3))

    return bins


def _build_beat_grid(duration_seconds: float, bpm: float) -> list[dict[str, float | int]]:
    beat_period = 60.0 / bpm
    beat_grid: list[dict[str, float | int]] = []
    index = 0
    second = 0.0

    while second <= duration_seconds:
        beat_grid.append({"index": index, "second": round(second, 3)})
        index += 1
        second += beat_period

    return beat_grid


def _build_bpm_curve(duration_seconds: float, bpm: float) -> list[dict[str, float]]:
    checkpoints = [0.0, duration_seconds / 2.0, duration_seconds]
    return [{"second": round(second, 3), "bpm": bpm} for second in checkpoints]


def _recommended_layers(category: str, entry_count: int) -> int:
    category_bonus = {
        "collection": 1,
        "drum-kit": 2,
        "bass-motif": 1,
        "pad-texture": 1,
        "fx-palette": 1,
        "vocal-hook": 1,
        "code-pattern": 1,
    }.get(category, 1)
    return min(8, max(2, category_bonus + min(4, entry_count // 4)))


def _intensity_band(target_bpm: float, category: str) -> str:
    if category in {"drum-kit", "fx-palette"} and target_bpm >= 126:
        return "driving"
    if category in {"pad-texture", "vocal-hook"} and target_bpm <= 118:
        return "immersive"
    if target_bpm >= 132:
        return "peak-time"
    if target_bpm <= 108:
        return "warmup"
    return "steady"


def _arrangement_plan(
    category: str,
    reference_type: str,
    reference_label: str,
    reusable: bool,
) -> list[str]:
    plan = [
        f"Lock the base groove to {reference_label} before layering.",
        "Use a 16-bar preview section to validate beat alignment and phrase balance.",
    ]

    if category == "drum-kit":
        plan.append("Start with kick and hats, then add percussion fills after bar 8.")
    elif category == "bass-motif":
        plan.append("Place the bass motif after the first downbeat and reserve space for the low-end transient.")
    elif category == "pad-texture":
        plan.append("Open with the pad texture alone, then fade rhythmic elements in over the first phrase.")
    elif category == "fx-palette":
        plan.append("Reserve impacts and risers for transitions at bars 8 and 16.")
    elif category == "vocal-hook":
        plan.append("Delay the hook entry until the groove is established to avoid masking the drop.")
    elif category == "code-pattern":
        plan.append("Mirror the structural cadence of the reference before translating it into rhythm layers.")
    else:
        plan.append("Layer the pack incrementally so each reusable element keeps a clear role.")

    if reference_type == "repo":
        plan.append("Treat repository BPM as structural pacing, not as literal audio timing.")
    elif reference_type == "manual":
        plan.append("Re-check the manual tempo against the final groove once a real track reference exists.")

    if not reusable:
        plan.append("Keep the result flagged as a local sketch because the source base asset is reference-only.")

    return plan


def _arrangement_sections(
    duration_seconds: float,
    bpm: float,
    category: str,
    reference_type: str,
    strategy: str,
) -> list[dict[str, Any]]:
    section_definitions = [
        ("intro", "Intro lock", "low"),
        (_mid_label(category, reference_type), _mid_title(category, reference_type), "rising"),
        (_peak_label(strategy, category), _peak_title(strategy, category), "high"),
        ("outro", "Transition out", "medium"),
    ]
    beats_per_bar = 4
    total_bars = 16
    seconds_per_bar = beats_per_bar * 60.0 / bpm
    sections: list[dict[str, Any]] = []

    for index, (role, label, energy) in enumerate(section_definitions):
        start_bar = index * 4 + 1
        end_bar = min(total_bars, start_bar + 3)
        start_second = round((start_bar - 1) * seconds_per_bar, 3)
        end_second = round(min(duration_seconds, end_bar * seconds_per_bar), 3)
        sections.append(
            {
                "id": role,
                "role": role,
                "label": label,
                "energy": energy,
                "startBar": start_bar,
                "endBar": end_bar,
                "startSecond": start_second,
                "endSecond": end_second,
                "focus": _section_focus(role, category, reference_type, strategy),
            }
        )

    return sections


def _cue_points(sections: list[dict[str, Any]]) -> list[dict[str, Any]]:
    cue_points: list[dict[str, Any]] = []

    for index, section in enumerate(sections):
        cue_points.append(
            {
                "id": f"cue-{section['id']}",
                "label": section["label"],
                "role": section["role"],
                "bar": section["startBar"],
                "second": section["startSecond"],
            }
        )

        if index == len(sections) - 1:
            cue_points.append(
                {
                    "id": "cue-end",
                    "label": "Preview end",
                    "role": "end",
                    "bar": section["endBar"] + 1,
                    "second": section["endSecond"],
                }
            )

    return cue_points


def _render_preview(
    category: str,
    reference_type: str,
    strategy: str,
    sections: list[dict[str, Any]],
) -> dict[str, Any]:
    main_sections = [section["id"] for section in sections if section["role"] != "outro"]
    peak_section = sections[2]["id"] if len(sections) > 2 else "drop"

    stems: list[dict[str, Any]] = [
        {
            "id": "stem-foundation",
            "label": (
                "Rhythm foundation"
                if category == "drum-kit"
                else "Pattern foundation"
                if category == "code-pattern"
                else "Base foundation"
            ),
            "role": "foundation",
            "source": "base-asset",
            "focus": "carry the groove and preserve the reusable source identity",
            "gainDb": -6.5,
            "pan": 0.0,
            "sectionIds": [section["id"] for section in sections],
        },
        {
            "id": "stem-motion",
            "label": (
                "Transition motion"
                if category == "fx-palette"
                else "Texture motion"
                if category == "pad-texture"
                else "Energy motion"
            ),
            "role": "support",
            "source": "base-asset",
            "focus": "increase motion through the middle sections without masking the foundation",
            "gainDb": -9.0,
            "pan": -0.18 if category == "pad-texture" else 0.12,
            "sectionIds": main_sections,
        },
        {
            "id": "stem-reference-glue",
            "label": (
                "Structural glue"
                if reference_type == "repo"
                else "Reference groove glue"
                if reference_type == "track"
                else "Tempo guide glue"
            ),
            "role": "glue",
            "source": "manual" if reference_type == "manual" else "reference",
            "focus": (
                "translate reference pacing into arrangement density"
                if reference_type == "repo"
                else "keep section changes aligned with the imported groove"
                if reference_type == "track"
                else "stabilize the typed tempo through each section boundary"
            ),
            "gainDb": -11.0,
            "pan": 0.0,
            "sectionIds": [sections[1]["id"] if len(sections) > 1 else "build", peak_section],
        },
    ]

    if category in {"vocal-hook", "bass-motif"}:
        stems.append(
            {
                "id": "stem-spotlight",
                "label": "Hook spotlight" if category == "vocal-hook" else "Low-end spotlight",
                "role": "spotlight",
                "source": "base-asset",
                "focus": (
                    "reserve space for the hook entry at the main section"
                    if category == "vocal-hook"
                    else "push the bass motif forward without collapsing headroom"
                ),
                "gainDb": -7.5,
                "pan": 0.08 if category == "vocal-hook" else 0.0,
                "sectionIds": [peak_section],
            }
        )

    return {
        "mode": "deterministic-stem-preview",
        "headroomDb": -7.5 if category == "fx-palette" else -6.0,
        "masterChain": [
            "sub cleanup",
            "structural glue compression" if reference_type == "repo" else "glue compression",
            "transition tame limiter" if category == "fx-palette" else "soft clip guard",
        ],
        "exportTargets": ["preview-loop", "stem-balance-pass", "arrangement-audit"],
        "stems": stems,
        "automation": [
            {
                "id": "auto-build-rise",
                "target": "stem-motion",
                "move": "riser emphasis" if category == "fx-palette" else "filter open",
                "sectionId": sections[1]["id"] if len(sections) > 1 else "build",
                "startBar": sections[1]["startBar"] if len(sections) > 1 else 5,
                "endBar": sections[1]["endBar"] if len(sections) > 1 else 8,
            },
            {
                "id": "auto-main-impact",
                "target": "stem-foundation",
                "move": "pattern spotlight" if strategy == "pattern-translation" else "transient lift",
                "sectionId": peak_section,
                "startBar": sections[2]["startBar"] if len(sections) > 2 else 9,
                "endBar": sections[2]["endBar"] if len(sections) > 2 else 12,
            },
            {
                "id": "auto-outro-clear",
                "target": "master",
                "move": "headroom release",
                "sectionId": sections[3]["id"] if len(sections) > 3 else "outro",
                "startBar": sections[3]["startBar"] if len(sections) > 3 else 13,
                "endBar": sections[3]["endBar"] if len(sections) > 3 else 16,
            },
        ],
    }


def _mid_label(category: str, reference_type: str) -> str:
    if category == "fx-palette":
        return "lift"
    if reference_type == "repo":
        return "translation"
    return "build"


def _mid_title(category: str, reference_type: str) -> str:
    if category == "pad-texture":
        return "Texture rise"
    if category == "vocal-hook":
        return "Hook setup"
    if reference_type == "repo":
        return "Structure translation"
    return "Energy build"


def _peak_label(strategy: str, category: str) -> str:
    if strategy == "pattern-translation":
        return "pattern"
    if category == "vocal-hook":
        return "hook"
    return "drop"


def _peak_title(strategy: str, category: str) -> str:
    if strategy == "pattern-translation":
        return "Pattern reveal"
    if category == "bass-motif":
        return "Low-end focus"
    if category == "vocal-hook":
        return "Hook release"
    return "Main section"


def _section_focus(role: str, category: str, reference_type: str, strategy: str) -> str:
    if role == "intro":
        return "tempo lock and phrase alignment"
    if role in {"build", "lift", "translation"}:
        if reference_type == "repo":
            return "translate structural pacing into musical tension"
        if category == "fx-palette":
            return "stack transitions without crowding the groove"
        return "increase tension while preserving headroom"
    if role in {"drop", "pattern", "hook"}:
        if strategy == "pattern-translation":
            return "surface the reusable pattern in its clearest form"
        if category == "bass-motif":
            return "anchor the low-end transient and keep the kick clear"
        if category == "vocal-hook":
            return "land the hook after the groove is fully established"
        return "present the strongest layer combination"
    return "set up the next transition or render pass"


def _write_preview_wav(
    output_path: Path,
    bpm: float,
    duration_seconds: float,
    sections: list[dict[str, Any]],
    render_preview: dict[str, Any],
) -> dict[str, Any]:
    sample_rate = 22050
    channels = 2
    beat_period = 60.0 / bpm
    total_frames = max(1, int(duration_seconds * sample_rate))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    automation = render_preview.get("automation", [])
    stems = render_preview.get("stems", [])
    headroom = float(render_preview.get("headroomDb", -6.0))
    headroom_amp = min(0.95, max(0.2, 10 ** (headroom / 20.0) * 1.35))

    with wave.open(str(output_path), "wb") as wav_file:
        wav_file.setnchannels(channels)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)

        for frame_index in range(total_frames):
            second = frame_index / sample_rate
            section = _active_section(sections, second)
            energy = _energy_multiplier(str(section.get("energy", "medium")))
            left = 0.0
            right = 0.0

            for stem in stems:
                if str(section.get("id", "")) not in stem.get("sectionIds", []):
                    continue

                gain = _db_to_amplitude(float(stem.get("gainDb", -12.0)))
                pan = float(stem.get("pan", 0.0))
                freq = _stem_frequency(str(stem.get("role", "stem")))
                envelope = _stem_envelope(
                    str(stem.get("role", "stem")),
                    second,
                    beat_period,
                    freq,
                )
                automation_gain = _automation_gain(
                    automation,
                    stem_target=str(stem.get("id", "")),
                    section_id=str(section.get("id", "")),
                    second=second,
                    section_start=float(section.get("startSecond", 0.0)),
                    section_end=float(section.get("endSecond", duration_seconds)),
                )
                sample = envelope * gain * energy * automation_gain
                left_gain = math.sqrt((1.0 - pan) * 0.5)
                right_gain = math.sqrt((1.0 + pan) * 0.5)
                left += sample * left_gain
                right += sample * right_gain

            master_gain = _automation_gain(
                automation,
                stem_target="master",
                section_id=str(section.get("id", "")),
                second=second,
                section_start=float(section.get("startSecond", 0.0)),
                section_end=float(section.get("endSecond", duration_seconds)),
            )
            left = math.tanh(left * headroom_amp * master_gain)
            right = math.tanh(right * headroom_amp * master_gain)
            wav_file.writeframesraw(
                struct.pack(
                    "<hh",
                    int(max(-1.0, min(1.0, left)) * 32767),
                    int(max(-1.0, min(1.0, right)) * 32767),
                )
            )

    return {
        "path": str(output_path),
        "format": "wav",
        "sampleRateHz": sample_rate,
        "channels": channels,
        "durationSeconds": round(duration_seconds, 3),
    }


def _active_section(sections: list[dict[str, Any]], second: float) -> dict[str, Any]:
    for section in sections:
        if second <= float(section.get("endSecond", 0.0)):
            return section
    return sections[-1] if sections else {"id": "section", "energy": "medium"}


def _db_to_amplitude(gain_db: float) -> float:
    return 10 ** (gain_db / 20.0)


def _energy_multiplier(energy: str) -> float:
    return {
        "low": 0.52,
        "rising": 0.74,
        "high": 1.0,
        "medium": 0.66,
    }.get(energy, 0.66)


def _stem_frequency(role: str) -> float:
    return {
        "foundation": 55.0,
        "support": 220.0,
        "glue": 330.0,
        "spotlight": 440.0,
    }.get(role, 180.0)


def _stem_envelope(role: str, second: float, beat_period: float, freq: float) -> float:
    phase = second % beat_period
    beat_click = math.exp(-phase * 28.0)
    if role == "foundation":
        return (
            math.sin(2.0 * math.pi * freq * second) * 0.48
            + beat_click * 0.8
            + math.sin(2.0 * math.pi * (freq * 2.0) * second) * 0.12
        )
    if role == "support":
        modulation = 0.58 + 0.42 * math.sin(2.0 * math.pi * 0.33 * second)
        return math.sin(2.0 * math.pi * freq * second) * modulation * 0.38
    if role == "glue":
        swing = 0.5 + 0.5 * math.sin(2.0 * math.pi * 0.125 * second)
        return math.sin(2.0 * math.pi * freq * second) * swing * 0.24 + beat_click * 0.15
    if role == "spotlight":
        pulse = 0.72 + 0.28 * math.sin(2.0 * math.pi * 0.5 * second)
        return math.sin(2.0 * math.pi * freq * second) * pulse * 0.42
    return math.sin(2.0 * math.pi * freq * second) * 0.25


def _automation_gain(
    automation: list[dict[str, Any]],
    *,
    stem_target: str,
    section_id: str,
    second: float,
    section_start: float,
    section_end: float,
) -> float:
    if section_end <= section_start:
        return 1.0

    progress = max(0.0, min(1.0, (second - section_start) / (section_end - section_start)))
    gain = 1.0

    for move in automation:
        if move.get("sectionId") != section_id:
            continue
        if move.get("target") not in {stem_target, "master"}:
            continue

        action = str(move.get("move", ""))
        if action in {"filter open", "riser emphasis"}:
            gain *= 0.72 + progress * 0.55
        elif action in {"transient lift", "pattern spotlight"}:
            gain *= 0.92 + math.sin(progress * math.pi) * 0.28
        elif action == "headroom release":
            gain *= 0.95 - progress * 0.18

    return gain
