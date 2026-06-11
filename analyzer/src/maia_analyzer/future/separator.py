from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any

import torch
import torchaudio
from demucs.apply import apply_model
from demucs.audio import save_audio
from demucs.pretrained import get_model

logger = logging.getLogger(__name__)


class SourceSeparator:
    """Audio source separation using Demucs (bass, drums, other, vocals)."""

    def __init__(self, model_name: str = "htdemucs") -> None:
        self.model_name = model_name
        self._model = None
        self._device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    def _load_model(self):
        if self._model is None:
            logger.info("Loading Demucs model: %s on %s", self.model_name, self._device)
            self._model = get_model(name=self.model_name)
            self._model.to(self._device)
            self._model.eval()
        return self._model

    def separate(
        self,
        input_path: Path,
        output_dir: Path,
        max_duration_s: float = 90.0,
    ) -> dict[str, str]:
        """Separate audio into 4 stems and save them to output_dir."""
        model = self._load_model()
        
        logger.info("Separating audio: %s", input_path)
        wav, sr = torchaudio.load(str(input_path))
        
        # Limit duration for MVP performance
        if max_duration_s > 0:
            max_samples = int(max_duration_s * sr)
            wav = wav[:, :max_samples]

        # Add batch dimension and move to device
        wav = wav.to(self._device)
        ref = wav.mean(0)
        wav = (wav - ref.mean()) / ref.std()

        with torch.no_grad():
            sources = apply_model(model, wav[None], device=self._device)[0]

        sources = sources * ref.std() + ref.mean()

        output_dir.mkdir(parents=True, exist_ok=True)
        stems = {}
        
        for source, name in zip(sources, model.sources):
            stem_path = output_dir / f"{name}.wav"
            save_audio(source.cpu(), str(stem_path), samplerate=model.samplerate)
            stems[name] = str(stem_path)
            logger.info("Saved stem: %s", stem_path)

        return stems


def separate_track(
    source_path: str,
    output_dir: str,
    max_duration: float = 90.0,
) -> dict[str, str]:
    """Helper function for integration."""
    separator = SourceSeparator()
    return separator.separate(
        Path(source_path),
        Path(output_dir),
        max_duration_s=max_duration,
    )
