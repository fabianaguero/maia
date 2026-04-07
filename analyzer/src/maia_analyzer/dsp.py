"""DSP analysis module — librosa-powered BPM, beats, and waveform.

Falls back gracefully when librosa / numpy are not installed so the
embedded heuristic path in audio.py remains functional.
"""
from __future__ import annotations

from array import array
from typing import Any

try:
    import librosa
    import numpy as np

    _LIBROSA_AVAILABLE = True
except ImportError:  # pragma: no cover - optional dependency
    librosa = None  # type: ignore[assignment]
    np = None  # type: ignore[assignment]
    _LIBROSA_AVAILABLE = False


def dsp_available() -> bool:
    return _LIBROSA_AVAILABLE


def analyze_dsp(
    samples: "array[float]",
    sample_rate_hz: int,
    waveform_bins: int = 256,
) -> dict[str, Any] | None:
    """Run librosa-based tempo, beat, and waveform analysis.

    Returns a dict with keys:
        suggestedBpm, confidence, waveformBins, beatGrid, bpmCurve, analysisMode
    or None if librosa is unavailable or analysis fails.
    """
    if not _LIBROSA_AVAILABLE:
        return None

    try:
        return _run_librosa_analysis(samples, sample_rate_hz, waveform_bins)
    except Exception:  # noqa: BLE001 — never bubble up DSP errors into the IPC contract
        return None


def _run_librosa_analysis(
    samples: "array[float]",
    sample_rate_hz: int,
    waveform_bins: int,
) -> dict[str, Any]:
    y = np.array(samples, dtype=np.float32)
    sr = sample_rate_hz

    # --- tempo and beat tracking ---
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    tempo_arr, beat_frames = librosa.beat.beat_track(
        onset_envelope=onset_env,
        sr=sr,
        units="frames",
        trim=False,
    )
    # librosa >= 0.10 returns a 0-d or 1-d array for tempo
    raw_tempo = float(np.atleast_1d(tempo_arr)[0])
    bpm = round(raw_tempo, 2) if 30 < raw_tempo < 300 else None

    # --- confidence via tempo strength ---
    if bpm is not None and len(onset_env) > 0:
        tempo_strength = float(librosa.feature.rhythm.tempo(
            onset_envelope=onset_env, sr=sr, aggregate=None
        ).std())
        # lower std = more stable tempo = higher confidence
        confidence = round(min(0.96, max(0.45, 0.82 - min(0.37, tempo_strength * 0.04))), 3)
    else:
        confidence = 0.3

    # --- waveform bins from RMS ---
    hop_length = max(512, len(y) // (waveform_bins * 4))
    rms = librosa.feature.rms(y=y, hop_length=hop_length)[0]
    target = max(8, min(waveform_bins, 256))
    chunk = max(1, len(rms) // target)
    raw_bins = [
        float(rms[i * chunk : (i + 1) * chunk].mean())
        for i in range(target)
        if i * chunk < len(rms)
    ]
    peak = max(raw_bins) if raw_bins else 1.0
    waveform = [round(min(1.0, v / (peak or 1.0)), 3) for v in raw_bins]

    # --- beat grid from beat frames ---
    hop_in_samples = 512  # librosa default hop_length for beat_track
    beat_times = librosa.frames_to_time(beat_frames, sr=sr, hop_length=hop_in_samples)
    duration_s = len(y) / sr
    beat_grid = [
        {"index": int(i), "second": round(float(t), 3)}
        for i, t in enumerate(beat_times)
        if float(t) <= duration_s
    ]

    # --- BPM curve via tempo across segments ---
    bpm_curve = _build_dsp_bpm_curve(y, sr, bpm, duration_s)

    return {
        "suggestedBpm": bpm,
        "confidence": confidence,
        "waveformBins": waveform,
        "beatGrid": beat_grid,
        "bpmCurve": bpm_curve,
        "analysisMode": "librosa-dsp",
    }


def _build_dsp_bpm_curve(
    y: Any,
    sr: int,
    global_bpm: float | None,
    duration_s: float,
) -> list[dict[str, Any]]:
    """Build per-segment BPM curve with ~15-second windows."""
    if global_bpm is None or duration_s < 1:
        return []

    segment_seconds = 15.0
    points: list[dict[str, Any]] = []
    offset = 0.0

    while offset < duration_s:
        start_sample = int(offset * sr)
        end_sample = min(len(y), start_sample + int(segment_seconds * sr))
        segment = y[start_sample:end_sample]

        if len(segment) < sr:  # too short — use global
            points.append({"second": round(offset, 3), "bpm": round(global_bpm, 2)})
            offset += segment_seconds
            continue

        try:
            onset_env = librosa.onset.onset_strength(y=segment, sr=sr)
            seg_tempo = librosa.feature.rhythm.tempo(onset_envelope=onset_env, sr=sr)
            seg_bpm = float(np.atleast_1d(seg_tempo)[0])
            seg_bpm = seg_bpm if 30 < seg_bpm < 300 else global_bpm
        except Exception:  # noqa: BLE001
            seg_bpm = global_bpm

        points.append({"second": round(offset, 3), "bpm": round(seg_bpm, 2)})
        offset += segment_seconds

    if not points or points[-1]["second"] < duration_s - 0.5:
        points.append({"second": round(duration_s, 3), "bpm": round(global_bpm, 2)})

    return points
