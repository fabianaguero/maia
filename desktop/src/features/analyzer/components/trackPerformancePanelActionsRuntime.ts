import type {
  LibraryTrack,
  TrackCuePoint,
  TrackSavedLoop,
  UpdateTrackPerformanceInput,
} from "../../../types/library";
import type { BeatGridPhraseRange } from "../../../utils/beatGrid";
import {
  canCreateBeatLoop,
  createTrackCuePoint,
  createTrackSavedLoop,
  createTrackSavedLoopFromRange,
  formatTrackTime,
  removeTrackCuePoint,
  removeTrackSavedLoop,
  resolveTrackPlacementSecond,
  setTrackSavedLoopBoundary,
  snapTrackSecond,
  updateTrackCuePoint,
  updateTrackSavedLoop,
} from "../../../utils/track";

export const LOOP_BEAT_PRESETS = [4, 8, 16];

export function resolveTrackPerformancePlacement(input: {
  currentTime: number;
  durationSeconds: number | null;
  beatGrid: LibraryTrack["analysis"]["beatGrid"];
  quantizeEnabled: boolean;
}): number {
  return resolveTrackPlacementSecond(
    input.currentTime,
    input.durationSeconds,
    input.beatGrid,
    input.quantizeEnabled,
  );
}

export function buildQuantizedPlacementHint(input: {
  currentTime: number;
  placementSecond: number;
  durationSeconds: number | null;
  quantizedToTemplate: string;
  pendingLabel?: string;
}): string {
  return input.placementSecond !== snapTrackSecond(input.currentTime, input.durationSeconds)
    ? ` ${input.quantizedToTemplate.replace(
        "{time}",
        formatTrackTime(input.placementSecond, input.pendingLabel),
      )}`
    : "";
}

export function createTrackPerformanceActions(input: {
  track: LibraryTrack;
  currentTime: number;
  selectedPhraseRange: BeatGridPhraseRange | null;
  canEditPerformance: boolean;
  quantizeEnabled: boolean;
  onUpdatePerformance?: ((update: UpdateTrackPerformanceInput) => Promise<void>) | undefined;
}) {
  const { track, currentTime, selectedPhraseRange, canEditPerformance, quantizeEnabled } = input;
  const { performance } = track;
  const durationSeconds = track.analysis.durationSeconds;
  const bpm = track.analysis.bpm;
  const beatGrid = track.analysis.beatGrid;
  const placementSecond = resolveTrackPerformancePlacement({
    currentTime,
    durationSeconds,
    beatGrid,
    quantizeEnabled,
  });

  const updatePerformance = (update: UpdateTrackPerformanceInput) => {
    if (!canEditPerformance) {
      return;
    }
    return input.onUpdatePerformance?.(update);
  };

  const addCue = (kind: "hot" | "memory") => {
    const existingCues = kind === "hot" ? performance.hotCues : performance.memoryCues;
    const nextCue = createTrackCuePoint(kind, placementSecond, existingCues, durationSeconds);

    return updatePerformance({
      [kind === "hot" ? "hotCues" : "memoryCues"]: [...existingCues, nextCue],
    });
  };

  const removeCue = (kind: "hot" | "memory", cueId: string) => {
    const existingCues = kind === "hot" ? performance.hotCues : performance.memoryCues;
    return updatePerformance({
      [kind === "hot" ? "hotCues" : "memoryCues"]: removeTrackCuePoint(existingCues, cueId),
    });
  };

  const addSavedLoop = (beatCount: number) => {
    const nextLoop = createTrackSavedLoop(
      placementSecond,
      beatCount,
      bpm,
      performance.savedLoops,
      durationSeconds,
    );

    return updatePerformance({
      savedLoops: [...performance.savedLoops, nextLoop],
    });
  };

  const addSelectedPhraseLoop = () => {
    if (!selectedPhraseRange) {
      return;
    }

    const nextLoop = createTrackSavedLoopFromRange(
      selectedPhraseRange.startSecond,
      selectedPhraseRange.endSecond,
      performance.savedLoops,
      durationSeconds,
      selectedPhraseRange.label,
    );

    return updatePerformance({
      savedLoops: [...performance.savedLoops, nextLoop],
    });
  };

  const removeSavedLoop = (loopId: string) =>
    updatePerformance({
      savedLoops: removeTrackSavedLoop(performance.savedLoops, loopId),
    });

  const patchCue = (
    kind: "hot" | "memory",
    cueId: string,
    patch: Partial<Pick<TrackCuePoint, "label" | "color">>,
  ) => {
    const existingCues = kind === "hot" ? performance.hotCues : performance.memoryCues;
    return updatePerformance({
      [kind === "hot" ? "hotCues" : "memoryCues"]: updateTrackCuePoint(existingCues, cueId, patch),
    });
  };

  const patchSavedLoop = (
    loopId: string,
    patch: Partial<Pick<TrackSavedLoop, "label" | "color" | "locked">>,
  ) =>
    updatePerformance({
      savedLoops: updateTrackSavedLoop(performance.savedLoops, loopId, patch),
    });

  const setSavedLoopBoundary = (loopId: string, boundary: "start" | "end") =>
    updatePerformance({
      savedLoops: setTrackSavedLoopBoundary(performance.savedLoops, loopId, boundary, currentTime, {
        bpm,
        durationSeconds,
        beatGrid,
        quantizeEnabled,
      }),
    });

  const addPhraseMemoryCue = () =>
    selectedPhraseRange
      ? updatePerformance({
          memoryCues: [
            ...performance.memoryCues,
            createTrackCuePoint(
              "memory",
              selectedPhraseRange.startSecond,
              performance.memoryCues,
              durationSeconds,
            ),
          ],
        })
      : undefined;

  return {
    placementSecond,
    updatePerformance,
    addCue,
    removeCue,
    addSavedLoop,
    addSelectedPhraseLoop,
    removeSavedLoop,
    patchCue,
    patchSavedLoop,
    setSavedLoopBoundary,
    addPhraseMemoryCue,
    canCreateBeatLoopAtPlacement: (beatCount: number) =>
      canCreateBeatLoop(bpm, placementSecond, beatCount, durationSeconds),
  };
}
