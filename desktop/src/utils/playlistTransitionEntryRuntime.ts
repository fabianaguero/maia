import type { LibraryTrack } from "../types/library";

import type { PlaylistEntryPoint } from "./playlistTransitionTypes";
import { roundPlaylistMetric } from "./playlistTransitionSharedRuntime";

export function resolveCueEntryPoint(track: LibraryTrack): PlaylistEntryPoint {
  const durationLimit = Math.min(track.analysis.durationSeconds ?? 45, 45);
  const withinEarlyWindow = (second: number | null | undefined): second is number =>
    typeof second === "number" && Number.isFinite(second) && second >= 0 && second <= durationLimit;

  if (withinEarlyWindow(track.performance.mainCueSecond)) {
    return {
      second: roundPlaylistMetric(track.performance.mainCueSecond),
      label: "Main cue",
    };
  }

  const sortedHotCues = [...track.performance.hotCues].sort(
    (left, right) => left.second - right.second,
  );
  const firstHotCue = sortedHotCues.find((cue) => withinEarlyWindow(cue.second));
  if (firstHotCue) {
    return {
      second: roundPlaylistMetric(firstHotCue.second),
      label: firstHotCue.label || "Hot cue",
    };
  }

  const sortedMemoryCues = [...track.performance.memoryCues].sort(
    (left, right) => left.second - right.second,
  );
  const firstMemoryCue = sortedMemoryCues.find((cue) => withinEarlyWindow(cue.second));
  if (firstMemoryCue) {
    return {
      second: roundPlaylistMetric(firstMemoryCue.second),
      label: firstMemoryCue.label || "Memory cue",
    };
  }

  const introPattern = track.analysis.structuralPatterns.find((pattern) => {
    const lowered = `${pattern.type} ${pattern.label}`.toLowerCase();
    return lowered.includes("intro") || lowered.includes("opening");
  });
  if (introPattern && withinEarlyWindow(introPattern.start)) {
    return {
      second: roundPlaylistMetric(introPattern.start),
      label: introPattern.label || "Intro",
    };
  }

  return {
    second: 0,
    label: "Track start",
  };
}
