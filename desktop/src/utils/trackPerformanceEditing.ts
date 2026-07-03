import type { BeatGridPoint, TrackCuePoint, TrackSavedLoop } from "../types/library";
import {
  minimumTrackLoopSpanSeconds,
  resolveTrackPlacementSecond,
  snapTrackSecond,
} from "./trackTiming";

export const MAX_HOT_CUES = 8;
export const MAX_SAVED_LOOPS = 8;

const HOT_CUE_COLORS = ["#f59e0b", "#22d3ee", "#ef4444", "#8b5cf6"];

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

export function createTrackCuePoint(
  kind: TrackCuePoint["kind"],
  second: number,
  existingCues: readonly TrackCuePoint[],
  durationSeconds: number | null,
): TrackCuePoint {
  const normalizedSecond = snapTrackSecond(second, durationSeconds);
  const cueIndex = existingCues.filter((cue) => cue.kind === kind).length + 1;
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
        ? (HOT_CUE_COLORS[((slot ?? cueIndex) - 1) % HOT_CUE_COLORS.length] ?? null)
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

  const secondsPerBeat = bpm && Number.isFinite(bpm) && bpm > 0 ? 60 / bpm : null;
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

  const normalizedStart = snapTrackSecond(Math.min(startSecond, endSecond), durationSeconds);
  const normalizedEnd = snapTrackSecond(Math.max(startSecond, endSecond), durationSeconds);

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
  const minSpanSeconds = minimumTrackLoopSpanSeconds(options.bpm);

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
      const normalizedEnd = snapTrackSecond(normalizedStart + spanSeconds, options.durationSeconds);

      return {
        ...loop,
        startSecond: normalizedStart,
        endSecond: normalizedEnd,
      };
    })
    .sort((left, right) => left.startSecond - right.startSecond);
}
