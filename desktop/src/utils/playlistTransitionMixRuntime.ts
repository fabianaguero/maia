import type { LibraryTrack } from "../types/library";

import { DEFAULT_PLAYLIST_CROSSFADE_SECONDS } from "./playlistRuntime";
import {
  resolvePlaylistHarmonicLabel,
  resolvePlaylistTempoRatio,
} from "./playlistTransitionHarmonyRuntime";
import {
  resolvePlaylistCrossfadeSeconds,
  resolvePlaylistTransitionDeltas,
  resolvePlaylistTransitionMode,
} from "./playlistTransitionPlanRuntime";
import {
  clampPlaylistMetric,
  resolvePhraseAlignedEntryPoint,
  resolvePhraseLabel,
  resolvePhraseSpanBeats,
  roundPlaylistMetric,
} from "./playlistTransitionSharedRuntime";
import { resolveCueEntryPoint } from "./playlistTransitionEntryRuntime";
import type { PlaylistTransitionOptions, PlaylistTransitionPlan } from "./playlistTransitionTypes";

export function resolvePlaylistStartPlan(
  track: LibraryTrack,
  options: PlaylistTransitionOptions = {},
): PlaylistTransitionPlan {
  const transitionFeel = options.styleProfile?.transitionFeel ?? "steady";
  const phraseSpanBeats = resolvePhraseSpanBeats("cue-start", transitionFeel);
  const entryPoint = resolvePhraseAlignedEntryPoint(
    track,
    resolveCueEntryPoint(track),
    phraseSpanBeats,
  );
  const preferredCrossfadeSeconds =
    options.styleProfile?.playlistCrossfadeSeconds ?? DEFAULT_PLAYLIST_CROSSFADE_SECONDS;

  return {
    currentTrackId: null,
    nextTrackId: track.id,
    mode: "cue-start",
    crossfadeSeconds: roundPlaylistMetric(
      clampPlaylistMetric(preferredCrossfadeSeconds * 0.55, 0.9, 8),
    ),
    entrySecond: entryPoint.second,
    entryLabel: entryPoint.label,
    phraseSpanBeats,
    phraseLabel: resolvePhraseLabel(phraseSpanBeats),
    tempoRatio: 1,
    tempoAdjustPercent: 0,
    harmonicLabel: "Base start",
    bpmDelta: null,
    energyDelta: null,
    summary:
      entryPoint.second > 0
        ? `Cue start via ${entryPoint.label} · ${resolvePhraseLabel(phraseSpanBeats)}`
        : "Cue start at track head",
  };
}

export function resolvePlaylistTransitionPlan(
  currentTrack: LibraryTrack,
  nextTrack: LibraryTrack,
  options: PlaylistTransitionOptions = {},
): PlaylistTransitionPlan {
  const harmonic = resolvePlaylistHarmonicLabel(currentTrack, nextTrack);
  const tempoRatio = resolvePlaylistTempoRatio(currentTrack, nextTrack);
  const transitionFeel = options.styleProfile?.transitionFeel ?? "steady";
  const { bpmDelta, energyDelta } = resolvePlaylistTransitionDeltas(currentTrack, nextTrack);
  const mode = resolvePlaylistTransitionMode({
    bpmDelta,
    energyDelta,
    harmonicScore: harmonic.score,
  });

  const phraseSpanBeats = resolvePhraseSpanBeats(mode, transitionFeel);
  const entryPoint = resolvePhraseAlignedEntryPoint(
    nextTrack,
    resolveCueEntryPoint(nextTrack),
    phraseSpanBeats,
  );

  const crossfadeSeconds = resolvePlaylistCrossfadeSeconds({
    mode,
    options,
  });

  const tempoAdjustPercent = roundPlaylistMetric((tempoRatio - 1) * 100);
  const modeLabel =
    mode === "smooth-blend"
      ? "Smooth blend"
      : mode === "phrase-bridge"
        ? "Phrase bridge"
        : "Reset mix";
  const tempoLabel =
    tempoAdjustPercent === 0
      ? "tempo neutral"
      : `${tempoAdjustPercent > 0 ? "+" : ""}${tempoAdjustPercent}% tempo`;
  const entryLabel =
    entryPoint.second > 0
      ? `${entryPoint.label} @ ${entryPoint.second.toFixed(1)}s`
      : entryPoint.label;

  return {
    currentTrackId: currentTrack.id,
    nextTrackId: nextTrack.id,
    mode,
    crossfadeSeconds,
    entrySecond: entryPoint.second,
    entryLabel: entryPoint.label,
    phraseSpanBeats,
    phraseLabel: resolvePhraseLabel(phraseSpanBeats),
    tempoRatio,
    tempoAdjustPercent,
    harmonicLabel: harmonic.label,
    bpmDelta,
    energyDelta,
    summary: `${modeLabel} · ${harmonic.label} · ${resolvePhraseLabel(phraseSpanBeats)} · ${tempoLabel} · ${entryLabel}`,
  };
}
