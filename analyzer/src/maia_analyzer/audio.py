from __future__ import annotations

from array import array
import hashlib
import math
import struct
import wave
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from uuid import uuid4

try:
    import miniaudio
except ModuleNotFoundError:  # pragma: no cover - protected by project dependency, kept for resilience
    miniaudio = None

from .dsp import analyze_dsp, dsp_available
from .separator import separate_track


MAX_ANALYSIS_SECONDS = 180
FRAME_SIZE = 1024
HOP_SIZE = 512
MIN_BPM = 70
MAX_BPM = 180
WAVE_EXTENSIONS = {".wav", ".wave"}
MINIAUDIO_EXTENSIONS = WAVE_EXTENSIONS | {".mp3", ".flac", ".ogg", ".oga"}
# Formats that miniaudio cannot decode; attempted via librosa/audioread (needs FFmpeg/GStreamer)
LIBROSA_EXTENDED_EXTENSIONS = {".m4a", ".mp4", ".aac", ".aif", ".aiff", ".wma"}


def analyze_track(
    source_path: str,
    waveform_bins: int = 256,
    options: dict[str, Any] | None = None,
) -> tuple[dict[str, Any], list[str]]:
    track_path = Path(source_path).expanduser().resolve()
    if not track_path.is_file():
        raise FileNotFoundError(f"Track path does not exist or is not a file: {track_path}")

    decoded = decode_track_audio(track_path)
    if decoded is not None:
        asset, warnings = _build_embedded_track_asset(track_path, decoded, waveform_bins)

        # Handle Source Separation (Demucs) if requested
        if options and options.get("separateSource"):
            try:
                # Use a standard subdirectory for stems in the managed storage if possible,
                # otherwise use a temporary folder inside the same directory as the track.
                output_dir = track_path.parent / "stems" / asset["id"]
                stems = separate_track(str(track_path), str(output_dir))
                asset["metrics"]["stems"] = stems
                asset["tags"].append("stems-extracted")
            except Exception as e:
                warnings.append(f"Source separation failed: {e}")

        return asset, warnings

    return _build_hash_stub_asset(track_path, waveform_bins)


def get_supported_track_formats() -> list[str]:
    formats: list[str] = ["wav"]
    if miniaudio is not None:
        formats += ["mp3", "flac", "ogg"]
    try:
        import librosa  # noqa: F401 — test presence only
        formats += ["m4a", "aac", "aiff", "mp4"]
    except ModuleNotFoundError:  # pragma: no cover
        pass
    return formats


def _supported_track_format_summary() -> str:
    fmts = get_supported_track_formats()
    if len(fmts) == 1:
        return "WAV/PCM"
    label_map = {"mp3": "MP3", "flac": "FLAC", "ogg": "OGG/Vorbis", "m4a": "M4A/AAC", "aac": "AAC", "aiff": "AIFF", "mp4": "MP4"}
    labels = ["WAV"] + [label_map.get(f, f.upper()) for f in fmts if f != "wav"]
    return ", ".join(labels[:-1]) + (f", and {labels[-1]}" if len(labels) > 1 else "")


def _build_embedded_track_asset(
    track_path: Path,
    decoded: dict[str, Any],
    waveform_bins: int,
) -> tuple[dict[str, Any], list[str]]:
    samples = decoded["samples"]
    sample_rate_hz = decoded["sampleRateHz"]
    channels = decoded["channels"]
    duration_seconds = decoded["durationSeconds"]
    analysis_seconds = decoded["analysisSeconds"]
    format_name = decoded["formatName"]
    decoder = decoded["decoder"]

    dsp_result = analyze_dsp(samples, sample_rate_hz, waveform_bins)
    if dsp_result is not None:
        waveform = dsp_result["waveformBins"]
        suggested_bpm = dsp_result["suggestedBpm"]
        confidence = dsp_result["confidence"]
        beat_grid = dsp_result["beatGrid"]
        bpm_curve = dsp_result["bpmCurve"]
        analysis_mode = dsp_result["analysisMode"]
    else:
        waveform = _build_waveform_bins(samples, waveform_bins)
        suggested_bpm, confidence = _estimate_bpm(samples, sample_rate_hz)
        beat_grid = _build_beat_grid(samples, sample_rate_hz, suggested_bpm, duration_seconds)
        bpm_curve = _build_bpm_curve(suggested_bpm, duration_seconds)
        analysis_mode = "embedded-heuristic"

    asset = {
        "id": str(uuid4()),
        "assetType": "track_analysis",
        "title": track_path.stem,
        "sourcePath": str(track_path),
        "suggestedBpm": suggested_bpm,
        "confidence": confidence,
        "tags": [
            "track-analysis",
            track_path.suffix.lower().lstrip(".") or "unknown",
            analysis_mode,
            decoder.replace("_", "-"),
        ],
        "metrics": {
            "fileSizeBytes": track_path.stat().st_size,
            "fileExtension": track_path.suffix.lower(),
            "formatName": format_name,
            "durationSeconds": duration_seconds,
            "analysisWindowSeconds": analysis_seconds,
            "sampleRateHz": sample_rate_hz,
            "channels": channels,
            "analysisMode": analysis_mode,
            "decoder": decoder,
            "dspAvailable": dsp_available(),
        },
        "artifacts": {
            "waveformBins": waveform,
            "beatGrid": beat_grid,
            "bpmCurve": bpm_curve,
        },
        "createdAt": datetime.now(UTC).isoformat(),
    }

    warnings = [
        f"Track analysis runs inside the Maia analyzer using the embedded {decoder} decoder."
        + (" librosa DSP active." if analysis_mode == "librosa-dsp" else " Higher-fidelity DSP can later replace this path with librosa or Essentia without depending on system tools."),
    ]
    if duration_seconds and analysis_seconds and analysis_seconds < duration_seconds:
        warnings.append(
            f"Waveform and tempo heuristics currently analyze the first {round(analysis_seconds, 1)} seconds for MVP latency control."
        )
    return asset, warnings


def _build_hash_stub_asset(
    track_path: Path,
    waveform_bins: int,
) -> tuple[dict[str, Any], list[str]]:
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
        "tags": [
            "track-analysis",
            track_path.suffix.lower().lstrip(".") or "unknown",
            "hash-stub",
        ],
        "metrics": {
            "fileSizeBytes": size_bytes,
            "fileExtension": track_path.suffix.lower(),
            "formatName": track_path.suffix.lower().lstrip(".") or "unknown",
            "durationSeconds": None,
            "sampleRateHz": None,
            "channels": None,
            "analysisMode": "hash-stub",
        },
        "artifacts": {
            "waveformBins": bins,
            "beatGrid": [],
            "bpmCurve": [],
        },
        "createdAt": datetime.now(UTC).isoformat(),
    }

    warnings = [
        f"Embedded waveform/BPM analysis currently supports {_supported_track_format_summary()} file intake. This source was stored with a deterministic fallback stub so the app stays self-contained.",
    ]
    return asset, warnings


def decode_track_audio(track_path: Path) -> dict[str, Any] | None:
    extension = track_path.suffix.lower()

    if miniaudio is not None and extension in MINIAUDIO_EXTENSIONS:
        decoded = _decode_miniaudio_audio(track_path)
        if decoded is not None:
            return decoded

    if extension in WAVE_EXTENSIONS:
        return _decode_wave_audio(track_path)

    if extension in LIBROSA_EXTENDED_EXTENSIONS:
        return _decode_librosa_audio(track_path)

    return None


def _decode_librosa_audio(track_path: Path) -> dict[str, Any] | None:
    """Decode formats miniaudio cannot handle (m4a, aac, mp4, aiff, wma) via librosa/audioread.

    Requires FFmpeg or GStreamer to be present on the host; returns None gracefully if not.
    """
    try:
        import numpy as np  # guaranteed present (librosa dep)
        import librosa  # type: ignore[import-untyped]
    except ModuleNotFoundError:  # pragma: no cover
        return None

    try:
        y, sr = librosa.load(
            str(track_path),
            sr=None,          # preserve native sample rate
            mono=True,        # downmix to mono
            duration=float(MAX_ANALYSIS_SECONDS),
        )
    except Exception:  # noqa: BLE001 — audioread/FFmpeg not available or corrupt file
        return None

    if y is None or len(y) == 0:
        return None

    sample_rate_hz = int(sr)
    total_frames = len(y)
    if sample_rate_hz <= 0 or total_frames <= 0:
        return None

    mono_list = y.tolist() if hasattr(y, "tolist") else list(y)

    extension = track_path.suffix.lower().lstrip(".")
    duration_seconds = total_frames / sample_rate_hz
    analysis_seconds = min(duration_seconds, float(MAX_ANALYSIS_SECONDS))

    return {
        "samples": mono_list,
        "sampleRateHz": sample_rate_hz,
        "channels": 1,
        "durationSeconds": round(duration_seconds, 3),
        "analysisSeconds": round(analysis_seconds, 3),
        "formatName": extension or "unknown",
        "decoder": "librosa-audioread",
    }


def _decode_miniaudio_audio(track_path: Path) -> dict[str, Any] | None:
    if miniaudio is None:
        return None

    try:
        info = miniaudio.get_file_info(str(track_path))
    except (miniaudio.DecodeError, miniaudio.MiniaudioError, OSError, ValueError):
        return None

    sample_rate_hz = int(info.sample_rate)
    channels = int(info.nchannels)
    total_frames = int(info.num_frames)
    if sample_rate_hz <= 0 or channels <= 0 or total_frames <= 0:
        return None

    analysis_frames = min(total_frames, sample_rate_hz * MAX_ANALYSIS_SECONDS)
    if analysis_frames <= 0:
        return None

    chunk_frames = max(1024, min(4096, analysis_frames))
    mono = array("f")
    frames_read = 0

    try:
        stream = miniaudio.stream_file(
            str(track_path),
            output_format=miniaudio.SampleFormat.FLOAT32,
            nchannels=channels,
            sample_rate=sample_rate_hz,
            frames_to_read=chunk_frames,
        )
        for chunk in stream:
            if not chunk:
                break

            remaining_frames = analysis_frames - frames_read
            if remaining_frames <= 0:
                break

            available_frames = len(chunk) // channels
            take_frames = min(available_frames, remaining_frames)
            if take_frames <= 0:
                break

            mono.extend(_downmix_interleaved_f32_to_mono(chunk, channels, take_frames))
            frames_read += take_frames

            if frames_read >= analysis_frames:
                break
    except (miniaudio.DecodeError, miniaudio.MiniaudioError, OSError, ValueError):
        return None

    if not mono or frames_read <= 0:
        return None

    file_format_name = info.file_format.name.lower()
    format_name = "ogg" if file_format_name == "vorbis" else file_format_name
    return {
        "samples": mono,
        "sampleRateHz": sample_rate_hz,
        "channels": channels,
        "durationSeconds": round(total_frames / sample_rate_hz, 3),
        "analysisSeconds": round(frames_read / sample_rate_hz, 3),
        "formatName": format_name,
        "decoder": f"miniaudio-{file_format_name}",
    }


def _decode_wave_audio(track_path: Path) -> dict[str, Any] | None:
    try:
        with wave.open(str(track_path), "rb") as handle:
            sample_rate_hz = handle.getframerate()
            channels = handle.getnchannels()
            sample_width = handle.getsampwidth()
            total_frames = handle.getnframes()
            frames_to_read = min(total_frames, sample_rate_hz * MAX_ANALYSIS_SECONDS)
            raw_frames = handle.readframes(frames_to_read)
    except (wave.Error, OSError):
        return None

    if sample_rate_hz <= 0 or channels <= 0 or sample_width <= 0 or not raw_frames:
        return None

    samples = _pcm_to_mono_f32(raw_frames, channels, sample_width)
    if not samples:
        return None

    return {
        "samples": samples,
        "sampleRateHz": sample_rate_hz,
        "channels": channels,
        "durationSeconds": round(total_frames / sample_rate_hz, 3),
        "analysisSeconds": round(frames_to_read / sample_rate_hz, 3),
        "formatName": "wav",
        "decoder": "python-wave",
    }


def _pcm_to_mono_f32(raw_frames: bytes, channels: int, sample_width: int) -> array[float]:
    if sample_width == 1:
        mono = array("f")
        step = channels
        for index in range(0, len(raw_frames), step):
            channel_values = raw_frames[index : index + channels]
            if len(channel_values) < channels:
                break
            averaged = sum((value - 128) / 128.0 for value in channel_values) / channels
            mono.append(float(averaged))
        return mono

    if sample_width == 2:
        ints = struct.unpack("<{}h".format(len(raw_frames) // 2), raw_frames)
        return _downmix_integers_to_mono(ints, channels, 32768.0)

    if sample_width == 3:
        return _decode_pcm24_to_mono(raw_frames, channels)

    if sample_width == 4:
        ints = struct.unpack("<{}i".format(len(raw_frames) // 4), raw_frames)
        return _downmix_integers_to_mono(ints, channels, 2147483648.0)

    return array("f")


def _downmix_integers_to_mono(
    values: tuple[int, ...],
    channels: int,
    scale: float,
) -> array[float]:
    mono = array("f")
    for index in range(0, len(values), channels):
        frame = values[index : index + channels]
        if len(frame) < channels:
            break
        mono.append(float(sum(frame) / channels / scale))
    return mono


def _decode_pcm24_to_mono(raw_frames: bytes, channels: int) -> array[float]:
    mono = array("f")
    frame_width = channels * 3

    for offset in range(0, len(raw_frames), frame_width):
        frame = raw_frames[offset : offset + frame_width]
        if len(frame) < frame_width:
            break

        channel_values = []
        for channel_index in range(channels):
            start = channel_index * 3
            sample_bytes = frame[start : start + 3]
            value = int.from_bytes(sample_bytes, byteorder="little", signed=False)
            if value & 0x800000:
                value -= 0x1000000
            channel_values.append(value / 8388608.0)

        mono.append(float(sum(channel_values) / channels))

    return mono


def _downmix_interleaved_f32_to_mono(
    values: array[float],
    channels: int,
    frame_count: int,
) -> array[float]:
    mono = array("f")
    limit = min(len(values), frame_count * channels)

    for index in range(0, limit, channels):
        if index + channels > limit:
            break
        mono.append(float(sum(values[index + channel] for channel in range(channels)) / channels))

    return mono


def _build_waveform_bins(samples: array[float], waveform_bins: int) -> list[float]:
    target_bins = max(8, min(waveform_bins, 512))
    chunk_size = max(1, len(samples) // target_bins)
    raw_bins = []

    for start in range(0, len(samples), chunk_size):
        frame = samples[start : start + chunk_size]
        if not frame:
            continue
        # RMS for better perceptual representation
        rms = math.sqrt(sum(sample * sample for sample in frame) / len(frame))
        # Peak absolute value for transient capture
        peak_val = max(abs(s) for s in frame) if frame else 0.0
        # Blend: 70% RMS (smooth), 30% peak (transients)
        energy = (0.7 * rms) + (0.3 * peak_val)
        raw_bins.append(energy)
        if len(raw_bins) >= target_bins:
            break

    if not raw_bins:
        return [0.0] * target_bins

    peak = max(raw_bins) or 1.0
    return [round(min(1.0, value / peak), 3) for value in raw_bins]


def _estimate_bpm(samples: array[float], sample_rate_hz: int) -> tuple[float | None, float]:
    onset = _build_onset_envelope(samples, sample_rate_hz)
    if len(onset) < 16:
        return None, 0.18

    hop_seconds = HOP_SIZE / sample_rate_hz
    scores: list[tuple[int, float]] = []

    for bpm in range(MIN_BPM, MAX_BPM + 1):
        score = _score_candidate_tempo(onset, hop_seconds, bpm)
        scores.append((bpm, score))

    if not scores:
        return None, 0.18

    scores.sort(key=lambda item: item[1], reverse=True)
    best_bpm, best_score = scores[0]
    second_score = scores[1][1] if len(scores) > 1 else 0.0
    average_score = sum(score for _, score in scores) / len(scores)
    dominance = (best_score - second_score) / best_score if best_score else 0.0
    lift = (
        max(0.0, (best_score / average_score) - 1.0)
        if average_score > 0
        else 0.0
    )
    confidence = min(0.91, max(0.22, 0.34 + (dominance * 0.34) + min(0.18, lift * 0.08)))
    return float(best_bpm), round(confidence, 3)


def _build_onset_envelope(samples: array[float], sample_rate_hz: int) -> list[float]:
    if len(samples) < FRAME_SIZE:
        return []

    rms_values: list[float] = []
    for start in range(0, len(samples) - FRAME_SIZE + 1, HOP_SIZE):
        frame = samples[start : start + FRAME_SIZE]
        rms = math.sqrt(sum(sample * sample for sample in frame) / FRAME_SIZE)
        rms_values.append(rms)

    if len(rms_values) < 2:
        return []

    onset = [0.0]
    for previous, current in zip(rms_values, rms_values[1:]):
        onset.append(max(0.0, current - previous))

    peak = max(onset) or 1.0
    return [value / peak for value in onset]


def _score_candidate_tempo(onset: list[float], hop_seconds: float, bpm: int) -> float:
    lag = 60.0 / (bpm * hop_seconds)
    if lag <= 1:
        return 0.0

    main_score = _autocorrelation_score(onset, lag)
    half_score = _autocorrelation_score(onset, lag * 2.0)
    double_score = _autocorrelation_score(onset, lag / 2.0)
    return main_score + (0.35 * half_score) + (0.2 * double_score)


def _autocorrelation_score(onset: list[float], lag: float) -> float:
    lag_floor = int(lag)
    lag_fraction = lag - lag_floor
    if lag_floor < 1 or lag_floor + 1 >= len(onset):
        return 0.0

    score = 0.0
    for index in range(lag_floor + 1, len(onset)):
        previous = (onset[index - lag_floor] * (1.0 - lag_fraction)) + (
            onset[index - lag_floor - 1] * lag_fraction
        )
        score += onset[index] * previous

    return score


def _build_beat_grid(
    samples: array[float],
    sample_rate_hz: int,
    bpm: float | None,
    duration_seconds: float | None,
) -> list[dict[str, Any]]:
    if bpm is None or not duration_seconds:
        return []

    onset = _build_onset_envelope(samples, sample_rate_hz)
    if not onset:
        return []

    hop_seconds = HOP_SIZE / sample_rate_hz
    beat_period = 60.0 / bpm
    search_frames = min(len(onset), max(8, int((beat_period * 6) / hop_seconds)))
    lead_slice = onset[:search_frames]
    if not lead_slice:
        return []

    anchor_index = max(range(len(lead_slice)), key=lead_slice.__getitem__)
    anchor_second = anchor_index * hop_seconds

    beat_grid = []
    max_beats = int(duration_seconds / beat_period) + 2
    for index in range(max_beats):
        second = anchor_second + (index * beat_period)
        if second > duration_seconds:
            break
        beat_grid.append({"index": index, "second": round(second, 3)})

    return beat_grid


def _build_bpm_curve(
    bpm: float | None,
    duration_seconds: float | None,
) -> list[dict[str, Any]]:
    if bpm is None or not duration_seconds:
        return []

    step_seconds = 15.0 if duration_seconds > 60 else 8.0
    points = []
    second = 0.0
    while second < duration_seconds:
        points.append({"second": round(second, 3), "bpm": round(bpm, 3)})
        second += step_seconds

    if not points or points[-1]["second"] != round(duration_seconds, 3):
        points.append({"second": round(duration_seconds, 3), "bpm": round(bpm, 3)})

    return points
