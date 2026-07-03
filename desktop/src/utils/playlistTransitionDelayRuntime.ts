import type { PlaylistDelayAlignmentOptions } from "./playlistTransitionTypes";

export function resolvePhraseAlignedTransitionDelayMs(
  options: PlaylistDelayAlignmentOptions,
): number {
  const effectiveDurationSeconds =
    typeof options.track.analysis.durationSeconds === "number" &&
    Number.isFinite(options.track.analysis.durationSeconds)
      ? options.track.analysis.durationSeconds
      : (options.fallbackDurationSeconds ?? null);
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
    [...phrasePlaybackOffsets].reverse().find((offset) => offset <= naturalDelaySeconds) ??
    phrasePlaybackOffsets[0] ??
    naturalDelaySeconds;

  return Math.round(Math.max(0.25, alignedDelaySeconds) * 1000);
}
