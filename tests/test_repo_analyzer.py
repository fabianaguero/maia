"""Tests for the repository analyzer."""
import os
import textwrap
import pytest
from analyzer.repo_analyzer import (
    analyze_repo,
    _extract_references,
    _find_code_patterns,
)


@pytest.fixture
def sample_repo(tmp_path):
    """Create a minimal sample repo with musical references."""
    src = tmp_path / "src"
    src.mkdir()

    (src / "beat_engine.py").write_text(
        textwrap.dedent("""\
        # Beat engine
        bpm = 128
        key = 'C major'
        tempo: int = 128

        def play_loop():
            # loop this beat
            for beat in range(4):
                sample = get_sample('A4')
        """)
    )

    (src / "config.json").write_text(
        '{"bpm": 120, "scale": "minor", "rhythm": "4/4"}'
    )

    (tmp_path / "README.md").write_text(
        "# Music Tool\nThis plays at bpm=130 in the key of G minor."
    )
    return tmp_path


def test_analyze_repo_returns_dict(sample_repo):
    result = analyze_repo(str(sample_repo))
    assert isinstance(result, dict)
    assert result["type"] == "repo_analysis"
    assert result["repo_path"] == str(sample_repo)


def test_analyze_repo_detects_bpm(sample_repo):
    result = analyze_repo(str(sample_repo))
    assert result["inferred_bpm"] is not None
    # Average of 128, 120, 130 ≈ 126
    assert 100 <= result["inferred_bpm"] <= 150


def test_analyze_repo_finds_references(sample_repo):
    result = analyze_repo(str(sample_repo))
    refs = result["musical_references"]
    assert len(refs) > 0
    ref_types = {r["type"] for r in refs}
    assert "bpm" in ref_types


def test_analyze_repo_language_stats(sample_repo):
    result = analyze_repo(str(sample_repo))
    stats = result["language_stats"]
    assert "Python" in stats
    assert stats["Python"] > 0


def test_analyze_repo_code_patterns(sample_repo):
    result = analyze_repo(str(sample_repo))
    patterns = result["patterns"]
    pattern_names = [p["name"] for p in patterns]
    # "loop", "beat", "bpm" should all be found
    assert any(n in pattern_names for n in ["loop", "beat", "bpm", "key"])


def test_analyze_repo_nonexistent():
    with pytest.raises(FileNotFoundError):
        analyze_repo("/nonexistent/path/to/repo")


def test_extract_references_bpm():
    refs = _extract_references("bpm = 128", "test.py", 1)
    assert any(r.type == "bpm" and r.value == "128" for r in refs)


def test_extract_references_key():
    refs = _extract_references("key = 'C major'", "test.py", 1)
    assert any(r.type == "key" for r in refs)


def test_extract_references_rhythm():
    refs = _extract_references("rhythm = '4/4'", "test.py", 1)
    assert any(r.type == "rhythm" and r.value == "4/4" for r in refs)


def test_extract_references_note():
    refs = _extract_references("sample = get_sample('A4')", "test.py", 1)
    assert any(r.type == "note" and r.value == "A4" for r in refs)


def test_extract_references_empty_line():
    refs = _extract_references("", "test.py", 1)
    assert refs == []


def test_extract_references_no_music():
    refs = _extract_references("x = some_function(y, z)", "test.py", 1)
    assert refs == []
