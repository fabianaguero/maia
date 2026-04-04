"""
JSON contract definitions for Maia musical asset data exchange.

All data flowing between the Python analyzer and the Tauri frontend
must conform to these schemas.
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Any, Literal, Optional
import json


AssetType = Literal["track_analysis", "repo_analysis", "base_asset", "composition_result"]


@dataclass
class BeatInfo:
    time: float
    strength: float
    beat_number: int


@dataclass
class BpmPoint:
    time: float
    bpm: float


@dataclass
class WaveformData:
    samples: list[float]
    sample_rate: int
    duration: float
    peaks: list[float]


@dataclass
class BeatGrid:
    first_beat: float
    beat_interval: float
    beats: list[float]
    time_signature: int = 4


@dataclass
class MusicPattern:
    type: Literal["loop", "break", "drop", "intro", "outro"]
    start: float
    end: float
    confidence: float
    label: str


@dataclass
class MusicalAsset:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    type: AssetType = "track_analysis"
    name: str = ""
    created_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    updated_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class TrackAnalysis(MusicalAsset):
    type: AssetType = "track_analysis"
    file_path: str = ""
    duration: float = 0.0
    bpm: float = 0.0
    bpm_confidence: float = 0.0
    bpm_curve: list[BpmPoint] = field(default_factory=list)
    key: str = "C"
    scale: str = "major"
    beats: list[BeatInfo] = field(default_factory=list)
    beat_grid: BeatGrid = field(default_factory=lambda: BeatGrid(0, 0.5, [], 4))
    waveform: WaveformData = field(
        default_factory=lambda: WaveformData([], 44100, 0.0, [])
    )
    energy: float = 0.0
    danceability: float = 0.0
    suggested_bpm: Optional[float] = None
    patterns: list[MusicPattern] = field(default_factory=list)


@dataclass
class MusicalReference:
    file: str
    line: int
    type: Literal["bpm", "key", "scale", "note", "rhythm"]
    value: str
    context: str


@dataclass
class CodePattern:
    name: str
    occurrences: int
    files: list[str]


@dataclass
class ReuseableBase:
    id: str
    source_file: str
    start_line: int
    end_line: int
    description: str
    musical_quality: float


@dataclass
class RepoAnalysis(MusicalAsset):
    type: AssetType = "repo_analysis"
    repo_path: str = ""
    language_stats: dict[str, int] = field(default_factory=dict)
    musical_references: list[MusicalReference] = field(default_factory=list)
    inferred_bpm: Optional[float] = None
    patterns: list[CodePattern] = field(default_factory=list)
    bases: list[ReuseableBase] = field(default_factory=list)


def to_json(obj: Any) -> str:
    """Serialize a dataclass to JSON, handling nested dataclasses."""
    return json.dumps(asdict(obj) if hasattr(obj, "__dataclass_fields__") else obj, indent=2)


def to_dict(obj: Any) -> dict[str, Any]:
    """Convert a dataclass to a plain dict."""
    return asdict(obj) if hasattr(obj, "__dataclass_fields__") else obj
