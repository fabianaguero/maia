from __future__ import annotations

from array import array

from maia_analyzer.audio import (
    _build_beat_grid,
    _build_bpm_curve,
    _build_waveform_bins,
    _supported_track_format_summary,
    analyze_track,
)


def test_analyze_track_unsupported_format_returns_hash_stub(tmp_path):
    track_path = tmp_path / "mystery.xyz"
    track_path.write_bytes(b"not-really-audio")

    asset, warnings = analyze_track(str(track_path), waveform_bins=16)

    assert asset["assetType"] == "track_analysis"
    assert asset["metrics"]["analysisMode"] == "hash-stub"
    assert asset["suggestedBpm"] is None
    assert len(asset["artifacts"]["waveformBins"]) >= 8
    assert warnings


def test_analyze_track_embedded_analysis_includes_musical_characteristics(
    tmp_path,
    monkeypatch,
):
    track_path = tmp_path / "demo.wav"
    track_path.write_bytes(b"stub")

    monkeypatch.setattr(
        "maia_analyzer.audio.decode_track_audio",
        lambda _path: {
            "samples": array("f", [0.0, 0.1, -0.1, 0.2]),
            "sampleRateHz": 44_100,
            "channels": 2,
            "durationSeconds": 42.0,
            "analysisSeconds": 42.0,
            "formatName": "wav",
            "decoder": "python-wave",
        },
    )
    monkeypatch.setattr(
        "maia_analyzer.audio.analyze_dsp",
        lambda _samples, _sr, _bins: {
            "waveformBins": [0.1, 0.5, 0.2],
            "suggestedBpm": 123.0,
            "confidence": 0.77,
            "beatGrid": [{"index": 0, "second": 0.0}],
            "bpmCurve": [{"second": 0.0, "bpm": 123.0}],
            "analysisMode": "librosa-dsp",
        },
    )
    monkeypatch.setattr(
        "maia_analyzer.audio._analyze_musical_characteristics",
        lambda *_args, **_kwargs: {
            "keySignature": "A minor",
            "energyLevel": 0.61,
            "danceability": 0.73,
            "structuralPatterns": [
                {
                    "type": "drop",
                    "start": 12.0,
                    "end": 24.0,
                    "confidence": 0.84,
                    "label": "Drop",
                }
            ],
        },
    )

    asset, warnings = analyze_track(str(track_path), waveform_bins=3)

    assert asset["suggestedBpm"] == 123.0
    assert asset["metrics"]["keySignature"] == "A minor"
    assert asset["metrics"]["energyLevel"] == 0.61
    assert asset["metrics"]["danceability"] == 0.73
    assert asset["metrics"]["structuralPatterns"][0]["label"] == "Drop"
    assert asset["artifacts"]["waveformBins"] == [0.1, 0.5, 0.2]
    assert warnings


def test_analyze_track_separate_source_adds_stems_tag(tmp_path, monkeypatch):
    track_path = tmp_path / "demo.wav"
    track_path.write_bytes(b"stub")

    monkeypatch.setattr(
        "maia_analyzer.audio.decode_track_audio",
        lambda _path: {
            "samples": array("f", [0.0, 0.1, -0.1, 0.2]),
            "sampleRateHz": 44_100,
            "channels": 1,
            "durationSeconds": 8.0,
            "analysisSeconds": 8.0,
            "formatName": "wav",
            "decoder": "python-wave",
        },
    )
    monkeypatch.setattr(
        "maia_analyzer.audio.analyze_dsp",
        lambda _samples, _sr, _bins: {
            "waveformBins": [0.1],
            "suggestedBpm": 120.0,
            "confidence": 0.6,
            "beatGrid": [],
            "bpmCurve": [],
            "analysisMode": "embedded-heuristic",
        },
    )
    monkeypatch.setattr(
        "maia_analyzer.audio._analyze_musical_characteristics",
        lambda *_args, **_kwargs: {},
    )
    monkeypatch.setattr(
        "maia_analyzer.audio.separate_track",
        lambda _source, _dest: {"drums": "/tmp/drums.wav", "bass": "/tmp/bass.wav"},
    )

    asset, _warnings = analyze_track(
        str(track_path),
        options={"separateSource": True},
    )

    assert "stems-extracted" in asset["tags"]
    assert asset["metrics"]["stems"]["drums"].endswith("drums.wav")


def test_build_waveform_bins_normalizes_values():
    bins = _build_waveform_bins(array("f", [0.0, 0.2, -0.4, 0.8, -0.8, 0.1]), 8)

    assert bins
    assert max(bins) == 1.0
    assert all(0.0 <= value <= 1.0 for value in bins)


def test_build_beat_grid_without_bpm_returns_empty():
    grid = _build_beat_grid(array("f", [0.1] * 32), 44_100, None, 12.0)
    assert grid == []


def test_build_bpm_curve_appends_duration_endpoint():
    curve = _build_bpm_curve(128.0, 33.0)

    assert curve[0]["second"] == 0.0
    assert curve[-1]["second"] == 33.0
    assert all(point["bpm"] == 128.0 for point in curve)


def test_supported_track_format_summary_labels_formats(monkeypatch):
    monkeypatch.setattr(
        "maia_analyzer.audio.get_supported_track_formats",
        lambda: ["wav", "mp3", "flac"],
    )

    assert _supported_track_format_summary() == "WAV, MP3, and FLAC"
