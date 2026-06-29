import type {
  LibraryTrack,
  TrackCuePoint,
  TrackSavedLoop,
  UpdateTrackPerformanceInput,
} from "../../../types/library";
import type { BeatGridPhraseRange } from "../../../utils/beatGrid";
import {
  canCreateBeatLoop,
  canCreateHotCue,
  canCreateSavedLoop,
  createTrackCuePoint,
  createTrackSavedLoop,
  createTrackSavedLoopFromRange,
  formatTrackTime,
  hasUsableBeatGrid,
  removeTrackCuePoint,
  removeTrackSavedLoop,
  resolveTrackPlacementSecond,
  setTrackSavedLoopBoundary,
  snapTrackSecond,
  updateTrackCuePoint,
  updateTrackSavedLoop,
} from "../../../utils/track";

export const LOOP_BEAT_PRESETS = [4, 8, 16];

export interface TrackColorOption {
  value: string;
  label: string;
}

export function buildTrackColorOptions(t: {
  inspect: {
    none: string;
    amber: string;
    cyan: string;
    red: string;
    violet: string;
    lime: string;
  };
}): TrackColorOption[] {
  return [
    { value: "", label: t.inspect.none },
    { value: "#f59e0b", label: t.inspect.amber },
    { value: "#22d3ee", label: t.inspect.cyan },
    { value: "#ef4444", label: t.inspect.red },
    { value: "#8b5cf6", label: t.inspect.violet },
    { value: "#84cc16", label: t.inspect.lime },
  ];
}

export function renderCueLabel(cue: TrackCuePoint, slotTemplate: string): string {
  const slotLabel = cue.slot !== null ? slotTemplate.replace("{slot}", String(cue.slot)) : cue.kind;
  return `${cue.label} · ${formatTrackTime(cue.second)} · ${slotLabel}`;
}

export function renderLoopLabel(
  loop: TrackSavedLoop,
  slotTemplate: string,
  loopWord: string,
  lockedLabel: string,
  editableLabel: string,
): string {
  const slotLabel =
    loop.slot !== null ? slotTemplate.replace("{slot}", String(loop.slot)) : loopWord;
  const lockLabel = loop.locked ? lockedLabel : editableLabel;
  return `${loop.label} · ${formatTrackTime(loop.startSecond)} -> ${formatTrackTime(loop.endSecond)} · ${slotLabel} · ${lockLabel}`;
}

export function buildTrackPerformancePanelState(input: {
  track: LibraryTrack;
  busy: boolean;
  currentTime: number;
  onUpdatePerformance?: ((update: UpdateTrackPerformanceInput) => Promise<void>) | undefined;
}): {
  durationSeconds: number | null;
  bpm: number | null;
  beatGrid: LibraryTrack["analysis"]["beatGrid"];
  canEditPerformance: boolean;
  canAddHot: boolean;
  canAddLoop: boolean;
  quantizeAvailable: boolean;
} {
  const { track, busy, onUpdatePerformance } = input;
  return {
    durationSeconds: track.analysis.durationSeconds,
    bpm: track.analysis.bpm,
    beatGrid: track.analysis.beatGrid,
    canEditPerformance: !busy && !!onUpdatePerformance,
    canAddHot: canCreateHotCue(track.performance.hotCues),
    canAddLoop: canCreateSavedLoop(track.performance.savedLoops),
    quantizeAvailable: hasUsableBeatGrid(track.analysis.beatGrid),
  };
}

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
}): string {
  return input.placementSecond !== snapTrackSecond(input.currentTime, input.durationSeconds)
    ? ` ${input.quantizedToTemplate.replace("{time}", formatTrackTime(input.placementSecond))}`
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
