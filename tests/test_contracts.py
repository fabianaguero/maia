"""Tests for JSON contract data structures."""
import json
import uuid
from analyzer.contracts import (
    TrackAnalysis,
    RepoAnalysis,
    BeatInfo,
    BpmPoint,
    WaveformData,
    BeatGrid,
    MusicPattern,
    MusicalReference,
    CodePattern,
    ReuseableBase,
    to_json,
    to_dict,
)


def test_track_analysis_defaults():
    ta = TrackAnalysis(name="test_track", file_path="/tmp/test.mp3")
    assert ta.type == "track_analysis"
    assert ta.name == "test_track"
    assert ta.bpm == 0.0
    assert ta.key == "C"
    assert ta.scale == "major"
    assert ta.beats == []
    assert ta.patterns == []
    assert isinstance(ta.id, str)
    uuid.UUID(ta.id)  # must be valid UUID


def test_track_analysis_to_dict():
    ta = TrackAnalysis(name="beat_drop", file_path="/tmp/beat.wav", bpm=128.0)
    d = to_dict(ta)
    assert d["type"] == "track_analysis"
    assert d["bpm"] == 128.0
    assert d["name"] == "beat_drop"
    assert "id" in d
    assert "created_at" in d


def test_track_analysis_to_json():
    ta = TrackAnalysis(name="test", file_path="/tmp/t.mp3", bpm=120.0)
    j = to_json(ta)
    parsed = json.loads(j)
    assert parsed["bpm"] == 120.0
    assert parsed["type"] == "track_analysis"


def test_beat_info():
    b = BeatInfo(time=1.23, strength=0.9, beat_number=1)
    assert b.time == 1.23
    assert b.strength == 0.9


def test_waveform_data():
    wf = WaveformData(samples=[], sample_rate=44100, duration=180.0, peaks=[0.5, 0.8])
    assert wf.duration == 180.0
    assert len(wf.peaks) == 2


def test_beat_grid():
    bg = BeatGrid(first_beat=0.1, beat_interval=0.5, beats=[0.1, 0.6, 1.1], time_signature=4)
    assert bg.time_signature == 4
    assert len(bg.beats) == 3


def test_music_pattern():
    mp = MusicPattern(type="intro", start=0.0, end=30.0, confidence=0.9, label="Intro")
    d = to_dict(mp)
    assert d["type"] == "intro"
    assert d["start"] == 0.0


def test_repo_analysis_defaults():
    ra = RepoAnalysis(name="my_repo", repo_path="/tmp/repo")
    assert ra.type == "repo_analysis"
    assert ra.musical_references == []
    assert ra.patterns == []
    assert ra.inferred_bpm is None


def test_repo_analysis_to_dict():
    ref = MusicalReference(
        file="src/music.py", line=42, type="bpm", value="128", context="bpm = 128"
    )
    ra = RepoAnalysis(
        name="test_repo",
        repo_path="/tmp/repo",
        musical_references=[ref],
        inferred_bpm=128.0,
    )
    d = to_dict(ra)
    assert d["inferred_bpm"] == 128.0
    assert len(d["musical_references"]) == 1
    assert d["musical_references"][0]["value"] == "128"


def test_code_pattern():
    cp = CodePattern(name="loop", occurrences=5, files=["a.py", "b.py"])
    d = to_dict(cp)
    assert d["occurrences"] == 5


def test_reuseable_base():
    rb = ReuseableBase(
        id=str(uuid.uuid4()),
        source_file="src/beat_engine.py",
        start_line=1,
        end_line=100,
        description="10 musical references found",
        musical_quality=0.5,
    )
    d = to_dict(rb)
    assert d["musical_quality"] == 0.5
