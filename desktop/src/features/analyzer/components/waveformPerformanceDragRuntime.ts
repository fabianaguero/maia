import type { BeatGridPoint } from "../../../types/library";
import type { DragTarget, WaveformEditableCuePoint } from "./waveformPlaceholderRuntime";
import {
  resolveWaveformDragEditSecond,
  shouldFlagWaveformDragMoved,
} from "./waveformPlaceholderInteractionRuntime";

export function buildWaveformPerformanceDragMoveState(input: {
  clientX: number;
  dragStartClientX: number | null;
  resolveSecondFromClientX: (clientX: number) => number | null;
  dragTarget: DragTarget;
  durationSeconds: number | null;
  beatGrid: BeatGridPoint[];
}): {
  nextSecond: number | null;
  moved: boolean;
} {
  const rawSecond = input.resolveSecondFromClientX(input.clientX);
  if (rawSecond === null) {
    return {
      nextSecond: null,
      moved: false,
    };
  }

  return {
    nextSecond: resolveWaveformDragEditSecond({
      rawSecond,
      dragTarget: input.dragTarget,
      durationSeconds: input.durationSeconds,
      beatGrid: input.beatGrid,
    }),
    moved: shouldFlagWaveformDragMoved(input.dragStartClientX, input.clientX),
  };
}

export type WaveformPerformanceDragCommit =
  | {
      kind: "cue";
      cue: WaveformEditableCuePoint;
      second: number;
    }
  | {
      kind: "loop-boundary";
      loopId: string;
      boundary: "start" | "end";
      second: number;
    }
  | {
      kind: "loop";
      loopId: string;
      second: number;
    }
  | {
      kind: "noop";
    };

export function buildWaveformPerformanceDragCommit(input: {
  dragTarget: DragTarget;
  nextSecond: number | null;
  dragMoved: boolean;
}): WaveformPerformanceDragCommit {
  if (input.nextSecond === null || !input.dragMoved) {
    return { kind: "noop" };
  }

  if (input.dragTarget.type === "cue") {
    return {
      kind: "cue",
      cue: input.dragTarget.cue,
      second: input.nextSecond,
    };
  }

  if (input.dragTarget.type === "loop-boundary") {
    return {
      kind: "loop-boundary",
      loopId: input.dragTarget.loopId,
      boundary: input.dragTarget.boundary,
      second: input.nextSecond,
    };
  }

  return {
    kind: "loop",
    loopId: input.dragTarget.loopId,
    second: input.nextSecond,
  };
}
