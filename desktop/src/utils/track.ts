import type {
  BeatGridPoint,
  LibraryTrack,
  TrackCuePoint,
  TrackSavedLoop,
  VisualizationCuePoint,
  VisualizationRegionPoint,
} from "../types/library";

export const MAX_HOT_CUES = 8;
export const MAX_SAVED_LOOPS = 8;

export interface TrackCompareAuditionPoint {
  id: "original" | "altered" | "loop";
  label: string;
  detail: string;
  second: number;
}

const HOT_CUE_COLORS = ["#f59e0b", "#22d3ee", "#ef4444", "#8b5cf6"];

export function getTrackTitle(track: LibraryTrack): string {
  return track.tags.title;
}

export function getTrackSourcePath(track: LibraryTrack): string {
  return track.file.sourcePath;
}

export function getTrackStoragePath(track: LibraryTrack): string | null {
  return track.file.storagePath;
}

function isBrowserFallbackPath(path: string | null): boolean {
  return typeof path === "string" && path.startsWith("browser-fallback://");
}

export function describeTrackStorage(track: LibraryTrack): string {
  const storagePath = getTrackStoragePath(track);
  const sourcePath = getTrackSourcePath(track);

  if (!storagePath) {
    return "Original/demo path";
  }

  if (isBrowserFallbackPath(storagePath)) {
    return "Simulated snapshot";
  }

  if (storagePath === sourcePath) {
    return "Legacy/original path";
  }

  return "Managed snapshot";
}

export function describeTrackPlaybackSource(track: LibraryTrack): string {
  const storagePath = getTrackStoragePath(track);
  const sourcePath = getTrackSourcePath(track);

  if (!storagePath && !sourcePath) {
    return "Unavailable";
  }

  if (isBrowserFallbackPath(storagePath) || isBrowserFallbackPath(sourcePath)) {
    return "Browser fallback";
  }

  if (track.file.playbackSource === "managed_snapshot") {
    return "Managed snapshot";
  }

  if (track.file.playbackSource === "source_file") {
    return "Original file";
  }

  return "Unavailable";
}

export function resolvePlayableTrackPath(track: LibraryTrack): string | null {
  const storagePath = getTrackStoragePath(track);
  const sourcePath = getTrackSourcePath(track);

  if (storagePath && !isBrowserFallbackPath(storagePath)) {
    return storagePath;
  }

  if (sourcePath && !isBrowserFallbackPath(sourcePath)) {
    return sourcePath;
  }

  return null;
}

export function getTrackAvailabilityLabel(track: LibraryTrack): string {
  return track.file.availabilityState === "missing" ? "Missing" : "Available";
}

export function formatTrackTime(seconds: number | null): string {
  if (typeof seconds !== "number" || Number.isNaN(seconds) || seconds < 0) {
    return "Pending";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds - minutes * 60;
  return `${minutes}:${remainingSeconds.toFixed(2).padStart(5, "0")}`;
}

export function snapTrackSecond(
  second: number,
  durationSeconds: number | null,
): number {
  const clamped =
    typeof durationSeconds === "number" && durationSeconds > 0
      ? Math.min(Math.max(0, second), durationSeconds)
      : Math.max(0, second);

  return Number(clamped.toFixed(3));
}

export function hasUsableBeatGrid(
  beatGrid: readonly BeatGridPoint[],
): boolean {
  return beatGrid.length > 1;
}

export function findNearestBeatGridSecond(
  second: number,
  beatGrid: readonly BeatGridPoint[],
): number | null {
  if (!hasUsableBeatGrid(beatGrid)) {
    return null;
  }

  let nearestSecond = beatGrid[0]?.second ?? null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const point of beatGrid) {
    const distance = Math.abs(point.second - second);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestSecond = point.second;
    }
  }

  return nearestSecond;
}

export function resolveTrackPlacementSecond(
  second: number,
  durationSeconds: number | null,
  beatGrid: readonly BeatGridPoint[],
  quantizeEnabled: boolean,
): number {
  const normalizedSecond = snapTrackSecond(second, durationSeconds);
  if (!quantizeEnabled) {
    return normalizedSecond;
  }

  const beatGridSecond = findNearestBeatGridSecond(normalizedSecond, beatGrid);
  return beatGridSecond === null
    ? normalizedSecond
    : snapTrackSecond(beatGridSecond, durationSeconds);
}

function nextHotCueSlot(cues: readonly TrackCuePoint[]): number | null {
  for (let slot = 1; slot <= MAX_HOT_CUES; slot += 1) {
    if (!cues.some((cue) => cue.slot === slot)) {
      return slot;
    }
  }

  return null;
}

function nextSavedLoopSlot(loops: readonly TrackSavedLoop[]): number | null {
  for (let slot = 1; slot <= MAX_SAVED_LOOPS; slot += 1) {
    if (!loops.some((loop) => loop.slot === slot)) {
      return slot;
    }
  }

  return null;
}

export function canCreateHotCue(cues: readonly TrackCuePoint[]): boolean {
  return nextHotCueSlot(cues) !== null;
}

export function canCreateSavedLoop(loops: readonly TrackSavedLoop[]): boolean {
  return nextSavedLoopSlot(loops) !== null;
}

function beatDurationSeconds(bpm: number | null): number | null {
  if (typeof bpm !== "number" || Number.isNaN(bpm) || bpm <= 0) {
    return null;
  }

  return 60 / bpm;
}

function minimumLoopSpanSeconds(bpm: number | null): number {
  return beatDurationSeconds(bpm) ?? 0.05;
}

export function resolveTrackBeatDurationSeconds(
  beatGrid: readonly BeatGridPoint[],
  bpm: number | null = null,
): number | null {
  if (beatGrid.length > 1) {
    const spacing = beatGrid[1]!.second - beatGrid[0]!.second;
    if (spacing > 0 && Number.isFinite(spacing)) {
      return spacing;
    }
  }

  return beatDurationSeconds(bpm);
}

export function canCreateBeatLoop(
  bpm: number | null,
  startSecond: number,
  beatCount: number,
  durationSeconds: number | null,
): boolean {
  const secondsPerBeat = beatDurationSeconds(bpm);
  if (secondsPerBeat === null || beatCount <= 0) {
    return false;
  }

  const normalizedStart = snapTrackSecond(startSecond, durationSeconds);
  const normalizedEnd = snapTrackSecond(
    normalizedStart + secondsPerBeat * beatCount,
    durationSeconds,
  );

  return normalizedEnd > normalizedStart;
}

export function createTrackCuePoint(
  kind: TrackCuePoint["kind"],
  second: number,
  existingCues: readonly TrackCuePoint[],
  durationSeconds: number | null,
): TrackCuePoint {
  const normalizedSecond = snapTrackSecond(second, durationSeconds);
  const cueIndex =
    existingCues.filter((cue) => cue.kind === kind).length + 1;
  const slot = kind === "hot" ? nextHotCueSlot(existingCues) : null;

  if (kind === "hot" && slot === null) {
    throw new Error("No hot cue slots available");
  }

  return {
    id: `${kind}-${slot ?? cueIndex}-${Math.round(normalizedSecond * 1000)}`,
    slot,
    second: normalizedSecond,
    label:
      kind === "hot"
        ? `Hot ${slot ?? cueIndex}`
        : kind === "memory"
          ? `Memory ${cueIndex}`
          : "Main",
    kind,
    color:
      kind === "hot"
        ? HOT_CUE_COLORS[((slot ?? cueIndex) - 1) % HOT_CUE_COLORS.length] ?? null
        : null,
  };
}

export function createTrackSavedLoop(
  startSecond: number,
  beatCount: number,
  bpm: number | null,
  existingLoops: readonly TrackSavedLoop[],
  durationSeconds: number | null,
): TrackSavedLoop {
  const slot = nextSavedLoopSlot(existingLoops);
  if (slot === null) {
    throw new Error("No saved loop slots available");
  }

  const secondsPerBeat = beatDurationSeconds(bpm);
  if (secondsPerBeat === null || beatCount <= 0) {
    throw new Error("BPM is required to create beat loops");
  }

  const normalizedStart = snapTrackSecond(startSecond, durationSeconds);
  const normalizedEnd = snapTrackSecond(
    normalizedStart + secondsPerBeat * beatCount,
    durationSeconds,
  );

  if (normalizedEnd <= normalizedStart) {
    throw new Error("Loop end must be after loop start");
  }

  return {
    id: `loop-${slot}-${Math.round(normalizedStart * 1000)}-${beatCount}`,
    slot,
    startSecond: normalizedStart,
    endSecond: normalizedEnd,
    label: `Loop ${String.fromCharCode(64 + slot)}`,
    color: null,
    locked: false,
  };
}

export function createTrackSavedLoopFromRange(
  startSecond: number,
  endSecond: number,
  existingLoops: readonly TrackSavedLoop[],
  durationSeconds: number | null,
  label?: string,
): TrackSavedLoop {
  const slot = nextSavedLoopSlot(existingLoops);
  if (slot === null) {
    throw new Error("No saved loop slots available");
  }

  const normalizedStart = snapTrackSecond(
    Math.min(startSecond, endSecond),
    durationSeconds,
  );
  const normalizedEnd = snapTrackSecond(
    Math.max(startSecond, endSecond),
    durationSeconds,
  );

  if (normalizedEnd <= normalizedStart) {
    throw new Error("Loop end must be after loop start");
  }

  const nextLabel = label?.trim() || `Loop ${String.fromCharCode(64 + slot)}`;

  return {
    id: `loop-${slot}-${Math.round(normalizedStart * 1000)}-${Math.round(normalizedEnd * 1000)}`,
    slot,
    startSecond: normalizedStart,
    endSecond: normalizedEnd,
    label: nextLabel,
    color: null,
    locked: false,
  };
}

export function removeTrackCuePoint(
  cues: readonly TrackCuePoint[],
  cueId: string,
): TrackCuePoint[] {
  return cues.filter((cue) => cue.id !== cueId);
}

export function updateTrackCuePoint(
  cues: readonly TrackCuePoint[],
  cueId: string,
  patch: Partial<Pick<TrackCuePoint, "label" | "color">>,
): TrackCuePoint[] {
  return [...cues]
    .map((cue) => {
      if (cue.id !== cueId) {
        return cue;
      }

      const nextLabel =
        typeof patch.label === "string" ? patch.label.trim() || cue.label : cue.label;

      return {
        ...cue,
        ...patch,
        label: nextLabel,
      };
    })
    .sort((left, right) => left.second - right.second);
}

export function setTrackCuePointSecond(
  cues: readonly TrackCuePoint[],
  cueId: string,
  second: number,
  options: {
    durationSeconds: number | null;
    beatGrid: readonly BeatGridPoint[];
    quantizeEnabled: boolean;
  },
): TrackCuePoint[] {
  const nextSecond = resolveTrackPlacementSecond(
    second,
    options.durationSeconds,
    options.beatGrid,
    options.quantizeEnabled,
  );

  return [...cues]
    .map((cue) =>
      cue.id === cueId
        ? {
            ...cue,
            second: nextSecond,
          }
        : cue,
    )
    .sort((left, right) => left.second - right.second);
}

export function removeTrackSavedLoop(
  loops: readonly TrackSavedLoop[],
  loopId: string,
): TrackSavedLoop[] {
  return loops.filter((loop) => loop.id !== loopId);
}

export function updateTrackSavedLoop(
  loops: readonly TrackSavedLoop[],
  loopId: string,
  patch: Partial<Pick<TrackSavedLoop, "label" | "color" | "locked">>,
): TrackSavedLoop[] {
  return [...loops]
    .map((loop) => {
      if (loop.id !== loopId) {
        return loop;
      }

      const nextLabel =
        typeof patch.label === "string" ? patch.label.trim() || loop.label : loop.label;

      return {
        ...loop,
        ...patch,
        label: nextLabel,
      };
    })
    .sort((left, right) => left.startSecond - right.startSecond);
}

export function setTrackSavedLoopBoundary(
  loops: readonly TrackSavedLoop[],
  loopId: string,
  boundary: "start" | "end",
  second: number,
  options: {
    bpm: number | null;
    durationSeconds: number | null;
    beatGrid: readonly BeatGridPoint[];
    quantizeEnabled: boolean;
  },
): TrackSavedLoop[] {
  const targetSecond = resolveTrackPlacementSecond(
    second,
    options.durationSeconds,
    options.beatGrid,
    options.quantizeEnabled,
  );
  const minSpanSeconds = minimumLoopSpanSeconds(options.bpm);

  return [...loops]
    .map((loop) => {
      if (loop.id !== loopId) {
        return loop;
      }

      if (boundary === "start") {
        const nextStart = snapTrackSecond(
          Math.min(targetSecond, loop.endSecond - minSpanSeconds),
          options.durationSeconds,
        );

        return {
          ...loop,
          startSecond: nextStart,
        };
      }

      const nextEnd = snapTrackSecond(
        Math.max(targetSecond, loop.startSecond + minSpanSeconds),
        options.durationSeconds,
      );

      return {
        ...loop,
        endSecond: nextEnd,
      };
    })
    .sort((left, right) => left.startSecond - right.startSecond);
}

export function moveTrackSavedLoop(
  loops: readonly TrackSavedLoop[],
  loopId: string,
  startSecond: number,
  options: {
    durationSeconds: number | null;
    beatGrid: readonly BeatGridPoint[];
    quantizeEnabled: boolean;
  },
): TrackSavedLoop[] {
  return [...loops]
    .map((loop) => {
      if (loop.id !== loopId) {
        return loop;
      }

      const spanSeconds = Math.max(0, loop.endSecond - loop.startSecond);
      const maxDuration =
        typeof options.durationSeconds === "number" && options.durationSeconds > 0
          ? options.durationSeconds
          : null;

      let nextStart = resolveTrackPlacementSecond(
        startSecond,
        options.durationSeconds,
        options.beatGrid,
        options.quantizeEnabled,
      );

      if (maxDuration !== null) {
        nextStart = Math.min(nextStart, Math.max(0, maxDuration - spanSeconds));
      }

      const normalizedStart = snapTrackSecond(nextStart, options.durationSeconds);
      const normalizedEnd = snapTrackSecond(
        normalizedStart + spanSeconds,
        options.durationSeconds,
      );

      return {
        ...loop,
        startSecond: normalizedStart,
        endSecond: normalizedEnd,
      };
    })
    .sort((left, right) => left.startSecond - right.startSecond);
}

export function nudgeTrackSecond(
  second: number,
  direction: -1 | 1,
  options: {
    durationSeconds: number | null;
    beatGrid: readonly BeatGridPoint[];
    bpm?: number | null;
    coarse?: boolean;
    freeSlip?: boolean;
  },
): number {
  const beatDuration = resolveTrackBeatDurationSeconds(options.beatGrid, options.bpm ?? null);
  const deltaSeconds = options.freeSlip
    ? 0.02
    : beatDuration !== null
      ? beatDuration * (options.coarse ? 4 : 1)
      : options.coarse
        ? 0.25
        : 0.05;

  const nextSecond = second + direction * deltaSeconds;
  if (options.freeSlip) {
    return snapTrackSecond(nextSecond, options.durationSeconds);
  }

  return resolveTrackPlacementSecond(
    nextSecond,
    options.durationSeconds,
    options.beatGrid,
    hasUsableBeatGrid(options.beatGrid),
  );
}

export function getTrackWaveformCues(track: LibraryTrack): VisualizationCuePoint[] {
  const performanceCues = [
    ...track.performance.hotCues.map((cue) => ({
      second: cue.second,
      label: cue.label,
      type: cue.kind,
      excerpt: cue.slot !== null ? `Slot ${cue.slot}` : undefined,
    })),
    ...track.performance.memoryCues.map((cue) => ({
      second: cue.second,
      label: cue.label,
      type: cue.kind,
      excerpt: cue.slot !== null ? `Slot ${cue.slot}` : undefined,
    })),
  ];

  const mainCue =
    typeof track.performance.mainCueSecond === "number" &&
    !performanceCues.some(
      (cue) => Math.abs(cue.second - track.performance.mainCueSecond!) < 0.001,
    )
      ? [
          {
            second: track.performance.mainCueSecond,
            label: "Main",
            type: "main",
            excerpt: "Main cue",
          } satisfies VisualizationCuePoint,
        ]
      : [];

  const cues =
    performanceCues.length > 0 || mainCue.length > 0
      ? [...mainCue, ...performanceCues]
      : track.visualization?.hotCues ?? [];

  return [...cues].sort((left, right) => left.second - right.second);
}

export function getTrackOriginalWaveformCues(
  track: LibraryTrack,
): VisualizationCuePoint[] {
  return [...(track.visualization?.hotCues ?? [])].sort(
    (left, right) => left.second - right.second,
  );
}

export function getTrackWaveformRegions(
  track: LibraryTrack,
): VisualizationRegionPoint[] {
  return [...track.performance.savedLoops]
    .sort((left, right) => left.startSecond - right.startSecond)
    .map((loop) => ({
      id: loop.id,
      startSecond: loop.startSecond,
      endSecond: loop.endSecond,
      label: loop.label,
      type: "loop",
      color: loop.color,
      excerpt: [
        loop.slot !== null ? `Slot ${loop.slot}` : "Loop",
        loop.locked ? "Locked" : "Editable",
      ].join(" · "),
    }));
}

export function getTrackCompareAuditionPoints(
  track: LibraryTrack,
): TrackCompareAuditionPoint[] {
  const originalCues = getTrackOriginalWaveformCues(track);
  const alteredCues = getTrackWaveformCues(track);
  const alteredRegions = getTrackWaveformRegions(track);

  const originalLead = originalCues[0];
  const alteredLead =
    typeof track.performance.mainCueSecond === "number"
      ? {
          second: track.performance.mainCueSecond,
          detail: "Main cue",
        }
      : alteredCues[0]
        ? {
            second: alteredCues[0].second,
            detail: alteredCues[0].label,
          }
        : {
            second: originalLead?.second ?? 0,
            detail: "Track start",
          };

  const points: TrackCompareAuditionPoint[] = [
    {
      id: "original",
      label: "Base cue",
      detail: originalLead?.label ?? "Track start",
      second: originalLead?.second ?? 0,
    },
    {
      id: "altered",
      label: "Mutation cue",
      detail: alteredLead.detail,
      second: alteredLead.second,
    },
  ];

  const firstLoop = alteredRegions[0];
  if (firstLoop) {
    points.push({
      id: "loop",
      label: "Loop window",
      detail: firstLoop.label,
      second: firstLoop.startSecond,
    });
  }

  return points;
}
