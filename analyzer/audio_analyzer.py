"""
Audio track analyzer using librosa for feature extraction.

Produces TrackAnalysis JSON contracts consumable by the Tauri frontend.
Deterministic heuristics are preferred over black-box ML per project spec.
"""
from __future__ import annotations

import os
import math
import logging
from pathlib import Path
from typing import Optional

from .contracts import (
    TrackAnalysis,
    BeatInfo,
    BpmPoint,
    WaveformData,
    BeatGrid,
    MusicPattern,
    to_dict,
)

logger = logging.getLogger(__name__)

_WAVEFORM_PEAKS = 1024  # Number of peaks for UI display
_BPM_WINDOW = 8.0       # Seconds per BPM curve window
_ENERGY_HOP = 2048
_KEY_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def analyze_track(file_path: str) -> dict:
    """
    Analyze an audio file and return a TrackAnalysis dict.

    Args:
        file_path: Absolute path to the audio file.

    Returns:
        Dict conforming to the TrackAnalysis contract.

    Raises:
        FileNotFoundError: If the file does not exist.
        ImportError: If librosa is not installed.
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Audio file not found: {file_path}")

    try:
        import librosa  # type: ignore
        import numpy as np  # type: ignore
    except ImportError as exc:
        raise ImportError("librosa and numpy are required for audio analysis") from exc

    logger.info("Analyzing track: %s", file_path)

    # Load audio
    y, sr = librosa.load(file_path, sr=None, mono=True)
    duration = float(librosa.get_duration(y=y, sr=sr))

    # BPM and beat tracking
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr, units="frames")
    bpm = float(tempo[0]) if hasattr(tempo, "__len__") else float(tempo)
    beat_times = librosa.frames_to_time(beat_frames, sr=sr).tolist()

    # Beat confidence via onset strength
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    beat_strengths = _compute_beat_strengths(onset_env, beat_frames)

    beats = [
        BeatInfo(
            time=float(t),
            strength=float(s),
            beat_number=i + 1,
        )
        for i, (t, s) in enumerate(zip(beat_times, beat_strengths))
    ]

    # BPM curve (windowed tempo estimation)
    bpm_curve = _compute_bpm_curve(y, sr, window=_BPM_WINDOW)
    bpm_confidence = _estimate_bpm_confidence(bpm_curve, bpm)

    # Beat grid
    beat_grid = _build_beat_grid(beat_times, bpm)

    # Key detection using chromagram
    key_name, scale = _detect_key(y, sr)

    # Waveform peaks for display
    waveform = _extract_waveform(y, sr, duration)

    # Energy (RMS)
    rms = librosa.feature.rms(y=y, hop_length=_ENERGY_HOP)[0]
    energy = float(np.mean(rms))
    energy_norm = min(1.0, energy / 0.2)  # normalize rough ceiling

    # Danceability heuristic: high beat confidence + moderate tempo
    bpm_dance_score = 1.0 - abs(bpm - 128) / 128.0
    danceability = max(0.0, min(1.0, bpm_confidence * 0.6 + bpm_dance_score * 0.4))

    # Structural pattern detection
    patterns = _detect_patterns(y, sr, duration, beat_times)

    # Suggested BPM: nearest "standard" DJ BPM
    suggested_bpm = _suggest_bpm(bpm)

    analysis = TrackAnalysis(
        name=path.stem,
        file_path=str(path),
        duration=duration,
        bpm=round(bpm, 2),
        bpm_confidence=round(bpm_confidence, 3),
        bpm_curve=bpm_curve,
        key=key_name,
        scale=scale,
        beats=beats,
        beat_grid=beat_grid,
        waveform=waveform,
        energy=round(energy_norm, 3),
        danceability=round(danceability, 3),
        suggested_bpm=suggested_bpm,
        patterns=patterns,
    )
    return to_dict(analysis)


def _compute_beat_strengths(
    onset_env: "np.ndarray", beat_frames: "np.ndarray"
) -> list[float]:
    """Normalize onset envelope at beat positions to 0-1 range."""
    import numpy as np

    if len(onset_env) == 0 or len(beat_frames) == 0:
        return [1.0] * len(beat_frames)

    max_val = float(np.max(onset_env)) or 1.0
    strengths = []
    for frame in beat_frames:
        idx = min(int(frame), len(onset_env) - 1)
        strengths.append(float(onset_env[idx]) / max_val)
    return strengths


def _compute_bpm_curve(y: "np.ndarray", sr: int, window: float = 8.0) -> list[BpmPoint]:
    """Estimate BPM in sliding windows across the track."""
    import librosa
    import numpy as np

    hop = int(sr * window / 2)
    n_samples = len(y)
    points: list[BpmPoint] = []
    step = hop

    for start in range(0, n_samples - int(sr * window), step):
        end = start + int(sr * window)
        segment = y[start:end]
        try:
            tempo, _ = librosa.beat.beat_track(y=segment, sr=sr)
            seg_bpm = float(tempo[0]) if hasattr(tempo, "__len__") else float(tempo)
        except Exception:
            seg_bpm = 0.0
        t = (start + end) / 2 / sr
        points.append(BpmPoint(time=round(t, 2), bpm=round(seg_bpm, 2)))

    return points


def _estimate_bpm_confidence(bpm_curve: list[BpmPoint], avg_bpm: float) -> float:
    """Confidence 0-1: how stable the BPM is across the track."""
    if not bpm_curve:
        return 0.0
    bpm_vals = [p.bpm for p in bpm_curve if p.bpm > 0]
    if not bpm_vals:
        return 0.0
    import statistics
    std = statistics.stdev(bpm_vals) if len(bpm_vals) > 1 else 0.0
    confidence = max(0.0, 1.0 - std / max(avg_bpm, 1.0))
    return round(confidence, 3)


def _build_beat_grid(beat_times: list[float], bpm: float) -> BeatGrid:
    """Build a quantized beat grid from detected beat times."""
    if not beat_times:
        interval = 60.0 / max(bpm, 1.0)
        return BeatGrid(first_beat=0.0, beat_interval=interval, beats=[], time_signature=4)

    first_beat = beat_times[0]
    interval = 60.0 / max(bpm, 1.0)

    # Quantize beats to the grid
    quantized = [round(first_beat + i * interval, 4) for i in range(len(beat_times))]

    return BeatGrid(
        first_beat=round(first_beat, 4),
        beat_interval=round(interval, 4),
        beats=quantized,
        time_signature=4,
    )


def _detect_key(y: "np.ndarray", sr: int) -> tuple[str, str]:
    """Estimate musical key and scale using chroma features + Krumhansl-Schmuckler."""
    import librosa
    import numpy as np

    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    chroma_mean = np.mean(chroma, axis=1)

    # Krumhansl-Schmuckler key profiles
    major_profile = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09,
                               2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
    minor_profile = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53,
                               2.54, 4.75, 3.98, 2.69, 3.34, 3.17])

    def correlate(profile: "np.ndarray") -> list[float]:
        scores = []
        for shift in range(12):
            shifted = np.roll(profile, shift)
            corr = float(np.corrcoef(chroma_mean, shifted)[0, 1])
            scores.append(corr)
        return scores

    major_scores = correlate(major_profile)
    minor_scores = correlate(minor_profile)

    best_major = max(range(12), key=lambda i: major_scores[i])
    best_minor = max(range(12), key=lambda i: minor_scores[i])

    if major_scores[best_major] >= minor_scores[best_minor]:
        return _KEY_NAMES[best_major], "major"
    else:
        return _KEY_NAMES[best_minor], "minor"


def _extract_waveform(y: "np.ndarray", sr: int, duration: float) -> WaveformData:
    """Downsample audio to a fixed number of peaks for UI display."""
    import numpy as np

    n = len(y)
    if n == 0:
        return WaveformData(samples=[], sample_rate=sr, duration=duration, peaks=[])

    # Chunk into N bins
    chunk_size = max(1, n // _WAVEFORM_PEAKS)
    peaks: list[float] = []
    for i in range(_WAVEFORM_PEAKS):
        start = i * chunk_size
        end = min(start + chunk_size, n)
        if start >= n:
            peaks.append(0.0)
        else:
            chunk = y[start:end]
            peaks.append(float(np.max(np.abs(chunk))))

    return WaveformData(
        samples=[],   # omit full samples for performance
        sample_rate=sr,
        duration=round(duration, 3),
        peaks=peaks,
    )


def _detect_patterns(
    y: "np.ndarray", sr: int, duration: float, beat_times: list[float]
) -> list[MusicPattern]:
    """
    Detect structural patterns (intro, drop, break, outro) using energy analysis.
    Uses purely deterministic heuristics.
    """
    import librosa
    import numpy as np

    if duration < 10:
        return []

    # RMS energy over time (1-second frames)
    hop = sr
    rms = librosa.feature.rms(y=y, hop_length=hop)[0]
    times = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=hop)

    if len(rms) < 4:
        return []

    # Normalize energy
    max_e = float(np.max(rms)) or 1.0
    norm_rms = rms / max_e

    patterns: list[MusicPattern] = []
    total = len(norm_rms)

    # Intro: first 10-20% at lower energy
    intro_end_idx = int(total * 0.15)
    if intro_end_idx > 1:
        intro_energy = float(np.mean(norm_rms[:intro_end_idx]))
        if intro_energy < 0.6:
            patterns.append(
                MusicPattern(
                    type="intro",
                    start=round(float(times[0]), 2),
                    end=round(float(times[min(intro_end_idx, len(times) - 1)]), 2),
                    confidence=round(1.0 - intro_energy, 2),
                    label="Intro",
                )
            )

    # Outro: last 10-15% at lower energy
    outro_start_idx = int(total * 0.85)
    if outro_start_idx < total - 1:
        outro_energy = float(np.mean(norm_rms[outro_start_idx:]))
        if outro_energy < 0.6:
            patterns.append(
                MusicPattern(
                    type="outro",
                    start=round(float(times[min(outro_start_idx, len(times) - 1)]), 2),
                    end=round(duration, 2),
                    confidence=round(1.0 - outro_energy, 2),
                    label="Outro",
                )
            )

    # Drop: find highest-energy region
    window = max(1, int(total * 0.1))
    best_drop_start = 0
    best_drop_energy = 0.0
    for i in range(int(total * 0.2), int(total * 0.8)):
        seg_energy = float(np.mean(norm_rms[i : i + window]))
        if seg_energy > best_drop_energy:
            best_drop_energy = seg_energy
            best_drop_start = i

    if best_drop_energy > 0.8:
        drop_end = min(best_drop_start + window, total - 1)
        patterns.append(
            MusicPattern(
                type="drop",
                start=round(float(times[best_drop_start]), 2),
                end=round(float(times[drop_end]), 2),
                confidence=round(best_drop_energy, 2),
                label="Drop",
            )
        )

    # Break: low-energy region in the middle
    mid_start = int(total * 0.3)
    mid_end = int(total * 0.7)
    for i in range(mid_start, mid_end - window):
        seg_energy = float(np.mean(norm_rms[i : i + window]))
        if seg_energy < 0.35:
            break_end = min(i + window, total - 1)
            patterns.append(
                MusicPattern(
                    type="break",
                    start=round(float(times[i]), 2),
                    end=round(float(times[break_end]), 2),
                    confidence=round(1.0 - seg_energy, 2),
                    label="Break",
                )
            )
            break

    return patterns


def _suggest_bpm(bpm: float) -> Optional[float]:
    """Suggest the nearest 'standard' DJ BPM (multiples of 2, common tempos)."""
    standard_bpms = [
        60, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 124, 126,
        128, 130, 132, 135, 138, 140, 145, 150, 155, 160, 165, 170, 174, 175, 180,
    ]
    if bpm <= 0:
        return None
    # Also consider half/double tempo
    candidates = standard_bpms + [b * 2 for b in standard_bpms] + [b / 2 for b in standard_bpms]
    nearest = min(candidates, key=lambda b: abs(b - bpm))
    # Only suggest if within 8% of detected BPM
    if abs(nearest - bpm) / bpm < 0.08:
        return float(nearest)
    return None
