from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class AudioCueProfile:
    """Audio parameters for a specific log event type."""
    waveform: str
    freq_multiplier: float
    base_duration_ms: int
    base_gain: float
    filter_cutoff: float | None = None
    resonance: float | None = None


@dataclass
class VisualPalette:
    """Color palette for a specific musical style."""
    primary: str
    secondary: str
    accent: str
    background: str
    anomaly: str


@dataclass
class StylePreset:
    """A complete aesthetic mapping for live sonification."""
    id: str
    label: str
    description: str
    palette: VisualPalette
    mappings: dict[str, AudioCueProfile]
    stem_interaction: str  # 'ducking', 'triggering', 'filtering'


PRESETS: dict[str, StylePreset] = {
    "techno": StylePreset(
        id="techno",
        label="Techno Grid",
        description="Rhythmic and precise. Logs act as percussion triggers.",
        palette=VisualPalette(
            primary="#a855f7",    # Purple
            secondary="#6b21a8",
            accent="#fb7185",
            background="#0f172a",
            anomaly="#f43f5e",    # Rose
        ),
        mappings={
            "trace": AudioCueProfile("sine", 0.8, 100, 0.08),
            "debug": AudioCueProfile("sine", 0.9, 110, 0.1),
            "info": AudioCueProfile("triangle", 1.0, 120, 0.12),
            "warn": AudioCueProfile("sawtooth", 1.2, 140, 0.18, filter_cutoff=1200),
            "error": AudioCueProfile("square", 1.5, 200, 0.25, filter_cutoff=800),
            "unknown": AudioCueProfile("sine", 1.0, 120, 0.1),
        },
        stem_interaction="triggering",
    ),
    "ambient": StylePreset(
        id="ambient",
        label="Oceanic Ambient",
        description="Soft textures and long decays. Logs modulate the atmosphere.",
        palette=VisualPalette(
            primary="#0ea5e9",    # Sky Blue
            secondary="#0369a1",
            accent="#2dd4bf",
            background="#020617",
            anomaly="#facc15",    # Yellow
        ),
        mappings={
            "trace": AudioCueProfile("sine", 0.5, 600, 0.05),
            "debug": AudioCueProfile("sine", 0.6, 700, 0.06),
            "info": AudioCueProfile("sine", 0.8, 800, 0.08),
            "warn": AudioCueProfile("sine", 1.0, 1200, 0.12, filter_cutoff=400, resonance=2.0),
            "error": AudioCueProfile("sine", 1.2, 2000, 0.15, filter_cutoff=300, resonance=4.0),
            "unknown": AudioCueProfile("sine", 0.8, 800, 0.08),
        },
        stem_interaction="filtering",
    ),
    "glitch": StylePreset(
        id="glitch",
        label="Cyberpunk Glitch",
        description="Noisy and aggressive. High-speed system activity creates digital noise.",
        palette=VisualPalette(
            primary="#f97316",    # Orange
            secondary="#9a3412",
            accent="#bef264",
            background="#000000",
            anomaly="#ef4444",    # Red
        ),
        mappings={
            "trace": AudioCueProfile("sawtooth", 1.5, 60, 0.12),
            "debug": AudioCueProfile("sawtooth", 1.8, 80, 0.14),
            "info": AudioCueProfile("square", 2.0, 100, 0.16),
            "warn": AudioCueProfile("square", 2.5, 50, 0.22, filter_cutoff=5000),
            "error": AudioCueProfile("pulse", 3.0, 30, 0.3, filter_cutoff=8000),
            "unknown": AudioCueProfile("sawtooth", 2.0, 100, 0.15),
        },
        stem_interaction="ducking",
    ),
    "heartbeat": StylePreset(
        id="heartbeat",
        label="Zen Heartbeat",
        description="Steady and subtle. Designed for background listening in team environments.",
        palette=VisualPalette(
            primary="#10b981",    # Emerald
            secondary="#064e3b",
            accent="#d1fae5",
            background="#020617",
            anomaly="#f97316",    # Orange/Amber
        ),
        mappings={
            "trace": AudioCueProfile("sine", 0.4, 400, 0.04),
            "debug": AudioCueProfile("sine", 0.5, 500, 0.05),
            "info": AudioCueProfile("sine", 0.6, 600, 0.06),
            "warn": AudioCueProfile("sine", 0.8, 800, 0.1, filter_cutoff=500),
            "error": AudioCueProfile("triangle", 1.0, 1000, 0.15, filter_cutoff=400),
            "unknown": AudioCueProfile("sine", 0.6, 600, 0.05),
        },
        stem_interaction="filtering",
    ),
}


def get_preset(preset_id: str) -> StylePreset:
    return PRESETS.get(preset_id, PRESETS["techno"])


def list_presets() -> list[dict[str, Any]]:
    return [
        {
            "id": p.id,
            "label": p.label,
            "description": p.description,
            "palette": {
                "primary": p.palette.primary,
                "secondary": p.palette.secondary,
                "accent": p.palette.accent,
                "background": p.palette.background,
                "anomaly": p.palette.anomaly,
            },
        }
        for p in PRESETS.values()
    ]
