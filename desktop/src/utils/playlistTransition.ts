import type { BeatGridPoint, LibraryTrack } from "../types/library";
import type { MutationProfileOption, StyleProfileOption } from "../types/music";

import { DEFAULT_PLAYLIST_CROSSFADE_SECONDS } from "./playlistRuntime";

export type PlaylistTransitionMode =
  | "cue-start"
  | "smooth-blend"
  | "phrase-bridge"
  | "reset-mix";

export interface PlaylistTransitionPlan {
  currentTrackId: string | null;
  nextTrackId: string;
  mode: PlaylistTransitionMode;
  crossfadeSeconds: number;
  entrySecond: number;
  entryLabel: string;
  phraseSpanBeats: number;
  phraseLabel: string;
  tempoRatio: number;
  tempoAdjustPercent: number;
  harmonicLabel: string;
  bpmDelta: number | null;
  energyDelta: number | null;
  summary: string;
}

interface PlaylistEntryPoint {
  second: number;
  label: string;
}

interface PlaylistTransitionOptions {
  styleProfile?: Pick<StyleProfileOption, "playlistCrossfadeSeconds" | "transitionFeel"> | null;
  mutationProfile?: Pick<MutationProfileOption, "transitionTightness"> | null;
}

interface PlaylistDelayAlignmentOptions {
  track: LibraryTrack;
  entrySecond: number;
  playbackRate: number;
  crossfadeSeconds: number;
  phraseSpanBeats: number;
  fallbackDurationSeconds?: number | null;
}

const NOTE_TO_PITCH_CLASS: Record<string, number> = {
  C: 0,
  "B#": 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  F: 5,
  "E#": 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
  Cb: 11,
};

const CAM_MAJOR_BY_PITCH_CLASS: Record<number, number> = {
  11: 1,
  6: 2,
  1: 3,
  8: 4,
  3: 5,
  10: 6,
  5: 7,
  0: 8,
  7: 9,
  2: 10,
  9: 11,
  4: 12,
};

const CAM_MINOR_BY_PITCH_CLASS: Record<number, number> = {
  8: 1,
  3: 2,
  10: 3,
  5: 4,
  0: 5,
  7: 6,
  2: 7,
  9: 8,
  4: 9,
  11: 10,
  6: 11,
  1: 12,
};

function roundMetric(value: number): number {
  return Number(value.toFixed(2));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function resolvePhraseSpanBeats(
  mode: PlaylistTransitionMode,
  transitionFeel: "smooth" | "steady" | "tight",
): number {
  if (mode === "cue-start") {
    return transitionFeel === "smooth" ? 16 : 8;
  }
  if (mode === "smooth-blend") {
    return transitionFeel === "tight" ? 16 : 32;
  }
  if (mode === "phrase-bridge") {
    return transitionFeel === "smooth" ? 16 : 8;
  }
  return 8;
}

function findNearestBeatPoint(
  beatGrid: readonly BeatGridPoint[],
  targetSecond: number,
): BeatGridPoint | null {
  if (beatGrid.length === 0) {
    return null;
  }

  let nearest = beatGrid[0] ?? null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const point of beatGrid) {
    const distance = Math.abs(point.second - targetSecond);
    if (distance < nearestDistance) {
      nearest = point;
      nearestDistance = distance;
    }
  }

  return nearest;
}

function resolvePhraseBoundaryPoint(
  beatGrid: readonly BeatGridPoint[],
  targetSecond: number,
  phraseSpanBeats: number,
  durationLimit: number,
): BeatGridPoint | null {
  const phrasePoints = beatGrid.filter(
    (point) =>
      point.second >= 0 &&
      point.second <= durationLimit &&
      point.index % phraseSpanBeats === 0,
  );

  if (phrasePoints.length === 0) {
    return null;
  }

  const afterTarget = phrasePoints.find((point) => point.second >= targetSecond) ?? null;
  if (afterTarget && afterTarget.second - targetSecond <= 8) {
    return afterTarget;
  }

  return findNearestBeatPoint(phrasePoints, targetSecond);
}

function resolvePhraseAlignedEntryPoint(
  track: LibraryTrack,
  entryPoint: PlaylistEntryPoint,
  phraseSpanBeats: number,
): PlaylistEntryPoint {
  const durationLimit = Math.min(track.analysis.durationSeconds ?? 45, 45);
  const phraseBoundary = resolvePhraseBoundaryPoint(
    track.analysis.beatGrid,
    entryPoint.second,
    phraseSpanBeats,
    durationLimit,
  );

  if (!phraseBoundary) {
    return entryPoint;
  }

  const nearestBeat = findNearestBeatPoint(track.analysis.beatGrid, entryPoint.second);
  const fallbackSecond =
    nearestBeat && Math.abs(nearestBeat.second - entryPoint.second) <= 2.5
      ? nearestBeat.second
      : entryPoint.second;

  const chosenSecond =
    Math.abs(phraseBoundary.second - entryPoint.second) <= 8
      ? phraseBoundary.second
      : fallbackSecond;

  if (Math.abs(chosenSecond - entryPoint.second) < 0.05) {
    return {
      second: roundMetric(chosenSecond),
      label: entryPoint.label,
    };
  }

  return {
    second: roundMetric(chosenSecond),
    label: `${entryPoint.label} · phrase`,
  };
}

function resolvePhraseLabel(phraseSpanBeats: number): string {
  const bars = phraseSpanBeats / 4;
  return `${phraseSpanBeats}-beat / ${bars}-bar`;
}

function parseKeySignature(keySignature: string | null | undefined): {
  pitchClass: number;
  mode: "major" | "minor";
  camelot: string;
} | null {
  if (!keySignature) {
    return null;
  }

  const match = keySignature.trim().match(/^([A-G](?:#|b)?)(?:\s+)?(major|minor|maj|min)?$/i);
  if (!match) {
    return null;
  }

  const note = match[1] ?? "";
  const normalizedNote = note.charAt(0).toUpperCase() + note.slice(1);
  const pitchClass = NOTE_TO_PITCH_CLASS[normalizedNote];
  if (pitchClass === undefined) {
    return null;
  }

  const rawMode = (match[2] ?? "major").toLowerCase();
  const mode = rawMode.startsWith("min") ? "minor" : "major";
  const camelotNumber =
    mode === "major"
      ? CAM_MAJOR_BY_PITCH_CLASS[pitchClass]
      : CAM_MINOR_BY_PITCH_CLASS[pitchClass];

  if (!camelotNumber) {
    return null;
  }

  return {
    pitchClass,
    mode,
    camelot: `${camelotNumber}${mode === "major" ? "B" : "A"}`,
  };
}

function camelotNumber(camelot: string): number | null {
  const value = Number.parseInt(camelot, 10);
  return Number.isFinite(value) ? value : null;
}

function resolveHarmonicLabel(
  currentTrack: LibraryTrack | null,
  nextTrack: LibraryTrack,
): { label: string; score: number } {
  const currentKey = parseKeySignature(currentTrack?.analysis.keySignature ?? null);
  const nextKey = parseKeySignature(nextTrack.analysis.keySignature);

  if (!currentKey || !nextKey) {
    return { label: "Open key", score: 0 };
  }

  if (currentKey.camelot === nextKey.camelot) {
    return { label: `Same key ${nextKey.camelot}`, score: 3 };
  }

  const currentNumber = camelotNumber(currentKey.camelot);
  const nextNumber = camelotNumber(nextKey.camelot);
  if (currentNumber !== null && nextNumber !== null) {
    if (
      currentNumber === nextNumber &&
      currentKey.mode !== nextKey.mode
    ) {
      return { label: `Relative ${nextKey.camelot}`, score: 2 };
    }

    const wrappedDistance = Math.min(
      Math.abs(currentNumber - nextNumber),
      12 - Math.abs(currentNumber - nextNumber),
    );
    if (wrappedDistance === 1 && currentKey.mode === nextKey.mode) {
      return { label: `Adjacent ${nextKey.camelot}`, score: 2 };
    }
  }

  return { label: `Free mix ${nextKey.camelot}`, score: 1 };
}

function resolveCueEntryPoint(track: LibraryTrack): PlaylistEntryPoint {
  const durationLimit = Math.min(track.analysis.durationSeconds ?? 45, 45);
  const withinEarlyWindow = (second: number | null | undefined): second is number =>
    typeof second === "number" && Number.isFinite(second) && second >= 0 && second <= durationLimit;

  if (withinEarlyWindow(track.performance.mainCueSecond)) {
    return {
      second: roundMetric(track.performance.mainCueSecond),
      label: "Main cue",
    };
  }

  const sortedHotCues = [...track.performance.hotCues].sort((left, right) => left.second - right.second);
  const firstHotCue = sortedHotCues.find((cue) => withinEarlyWindow(cue.second));
  if (firstHotCue) {
    return {
      second: roundMetric(firstHotCue.second),
      label: firstHotCue.label || "Hot cue",
    };
  }

  const sortedMemoryCues = [...track.performance.memoryCues].sort(
    (left, right) => left.second - right.second,
  );
  const firstMemoryCue = sortedMemoryCues.find((cue) => withinEarlyWindow(cue.second));
  if (firstMemoryCue) {
    return {
      second: roundMetric(firstMemoryCue.second),
      label: firstMemoryCue.label || "Memory cue",
    };
  }

  const introPattern = track.analysis.structuralPatterns.find((pattern) => {
    const lowered = `${pattern.type} ${pattern.label}`.toLowerCase();
    return lowered.includes("intro") || lowered.includes("opening");
  });
  if (introPattern && withinEarlyWindow(introPattern.start)) {
    return {
      second: roundMetric(introPattern.start),
      label: introPattern.label || "Intro",
    };
  }

  return {
    second: 0,
    label: "Track start",
  };
}

function resolveTempoRatio(
  currentTrack: LibraryTrack | null,
  nextTrack: LibraryTrack,
): number {
  const currentBpm = currentTrack?.analysis.bpm ?? null;
  const nextBpm = nextTrack.analysis.bpm;
  if (
    typeof currentBpm !== "number" ||
    !Number.isFinite(currentBpm) ||
    currentBpm <= 0 ||
    typeof nextBpm !== "number" ||
    !Number.isFinite(nextBpm) ||
    nextBpm <= 0 ||
    nextTrack.performance.bpmLock
  ) {
    return 1;
  }

  const rawRatio = currentBpm / nextBpm;
  if (Math.abs(rawRatio - 1) > 0.06) {
    return 1;
  }

  const normalized = clamp(rawRatio, 0.94, 1.06);
  return Math.abs(normalized - 1) < 0.005 ? 1 : roundMetric(normalized);
}

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
    crossfadeSeconds: roundMetric(clamp(preferredCrossfadeSeconds * 0.55, 0.9, 8)),
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
  const harmonic = resolveHarmonicLabel(currentTrack, nextTrack);
  const tempoRatio = resolveTempoRatio(currentTrack, nextTrack);
  const preferredCrossfadeSeconds =
    options.styleProfile?.playlistCrossfadeSeconds ?? DEFAULT_PLAYLIST_CROSSFADE_SECONDS;
  const transitionFeel = options.styleProfile?.transitionFeel ?? "steady";
  const transitionTightness = clamp(
    options.mutationProfile?.transitionTightness ?? 1,
    0.7,
    1.35,
  );

  const currentBpm = currentTrack.analysis.bpm;
  const nextBpm = nextTrack.analysis.bpm;
  const bpmDelta =
    typeof currentBpm === "number" && Number.isFinite(currentBpm) &&
    typeof nextBpm === "number" && Number.isFinite(nextBpm)
      ? roundMetric(Math.abs(currentBpm - nextBpm))
      : null;

  const currentEnergy = currentTrack.analysis.energyLevel;
  const nextEnergy = nextTrack.analysis.energyLevel;
  const energyDelta =
    typeof currentEnergy === "number" &&
    Number.isFinite(currentEnergy) &&
    typeof nextEnergy === "number" &&
    Number.isFinite(nextEnergy)
      ? roundMetric(Math.abs(currentEnergy - nextEnergy))
      : null;

  let mode: PlaylistTransitionMode = "reset-mix";
  if ((bpmDelta ?? 999) <= 2.5 && harmonic.score >= 2 && (energyDelta ?? 0) <= 0.18) {
    mode = "smooth-blend";
  } else if ((bpmDelta ?? 999) <= 7 || (energyDelta ?? 0) <= 0.16 || harmonic.score >= 2) {
    mode = "phrase-bridge";
  }

  const phraseSpanBeats = resolvePhraseSpanBeats(mode, transitionFeel);
  const entryPoint = resolvePhraseAlignedEntryPoint(
    nextTrack,
    resolveCueEntryPoint(nextTrack),
    phraseSpanBeats,
  );

  const feelMultiplier =
    transitionFeel === "smooth" ? 1.18 : transitionFeel === "tight" ? 0.82 : 1;
  const modeMultiplier =
    mode === "smooth-blend" ? 1.05 : mode === "phrase-bridge" ? 0.84 : 0.58;
  const crossfadeSeconds = roundMetric(
    clamp(
      preferredCrossfadeSeconds * feelMultiplier * modeMultiplier / transitionTightness,
      1.2,
      12,
    ),
  );

  const tempoAdjustPercent = roundMetric((tempoRatio - 1) * 100);
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
    entryPoint.second > 0 ? `${entryPoint.label} @ ${entryPoint.second.toFixed(1)}s` : entryPoint.label;

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

export function resolvePhraseAlignedTransitionDelayMs(
  options: PlaylistDelayAlignmentOptions,
): number {
  const effectiveDurationSeconds =
    typeof options.track.analysis.durationSeconds === "number" &&
    Number.isFinite(options.track.analysis.durationSeconds)
      ? options.track.analysis.durationSeconds
      : options.fallbackDurationSeconds ?? null;
  const naturalDelaySeconds = Math.max(
    0.25,
    effectiveDurationSeconds !== null
      ? (effectiveDurationSeconds - options.entrySecond) / Math.max(0.0001, options.playbackRate) -
          options.crossfadeSeconds
      : 0.25,
  );

  const beatGrid = options.track.analysis.beatGrid;
  if (beatGrid.length === 0) {
    return Math.round(naturalDelaySeconds * 1000);
  }

  const startBeat = beatGrid.find((point) => point.second >= options.entrySecond) ?? null;
  if (!startBeat) {
    return Math.round(naturalDelaySeconds * 1000);
  }

  const phrasePlaybackOffsets = beatGrid
    .filter(
      (point) =>
        point.second >= options.entrySecond &&
        (point.index - startBeat.index) % options.phraseSpanBeats === 0,
    )
    .map((point) => (point.second - options.entrySecond) / Math.max(0.0001, options.playbackRate))
    .filter((offset) => offset > 0.25 && offset <= naturalDelaySeconds + 1.5);

  if (phrasePlaybackOffsets.length === 0) {
    return Math.round(naturalDelaySeconds * 1000);
  }

  const alignedDelaySeconds =
    [...phrasePlaybackOffsets]
      .reverse()
      .find((offset) => offset <= naturalDelaySeconds) ??
    phrasePlaybackOffsets[0] ??
    naturalDelaySeconds;

  return Math.round(Math.max(0.25, alignedDelaySeconds) * 1000);
}
