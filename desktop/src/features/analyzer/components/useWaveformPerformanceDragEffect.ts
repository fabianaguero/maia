import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from "react";

import type { BeatGridPoint } from "../../../types/library";
import type { DragTarget, WaveformEditableCuePoint } from "./waveformPlaceholderRuntime";
import {
  buildWaveformPerformanceDragCommit,
  buildWaveformPerformanceDragMoveState,
} from "./waveformPerformanceDragRuntime";

interface UseWaveformPerformanceDragEffectInput {
  beatGrid: BeatGridPoint[];
  durationSeconds: number | null;
  dragTarget: DragTarget | null;
  resolveSecondFromClientX: (clientX: number) => number | null;
  dragEditSecondRef: MutableRefObject<number | null>;
  dragMovedRef: MutableRefObject<boolean>;
  dragStartClientXRef: MutableRefObject<number | null>;
  setDragEditSecond: Dispatch<SetStateAction<number | null>>;
  setDragTarget: Dispatch<SetStateAction<DragTarget | null>>;
  onMoveCue?: (cue: WaveformEditableCuePoint, second: number) => void;
  onMoveLoopBoundary?: (loopId: string, boundary: "start" | "end", second: number) => void;
  onMoveLoop?: (loopId: string, startSecond: number) => void;
}

export function useWaveformPerformanceDragEffect(input: UseWaveformPerformanceDragEffectInput) {
  useEffect(() => {
    if (!input.dragTarget) {
      return;
    }
    const activeDragTarget = input.dragTarget;

    const handleMouseMove = (event: MouseEvent) => {
      const moveState = buildWaveformPerformanceDragMoveState({
        clientX: event.clientX,
        dragStartClientX: input.dragStartClientXRef.current,
        resolveSecondFromClientX: input.resolveSecondFromClientX,
        dragTarget: activeDragTarget,
        durationSeconds: input.durationSeconds,
        beatGrid: input.beatGrid,
      });
      if (moveState.nextSecond === null) {
        return;
      }

      if (moveState.moved) {
        input.dragMovedRef.current = true;
      }

      input.dragEditSecondRef.current = moveState.nextSecond;
      input.setDragEditSecond(moveState.nextSecond);
    };

    const handleMouseUp = () => {
      const commit = buildWaveformPerformanceDragCommit({
        dragTarget: activeDragTarget,
        nextSecond: input.dragEditSecondRef.current,
        dragMoved: input.dragMovedRef.current,
      });

      if (commit.kind === "cue") {
        input.onMoveCue?.(commit.cue, commit.second);
      }

      if (commit.kind === "loop-boundary") {
        input.onMoveLoopBoundary?.(commit.loopId, commit.boundary, commit.second);
      }

      if (commit.kind === "loop") {
        input.onMoveLoop?.(commit.loopId, commit.second);
      }

      input.dragEditSecondRef.current = null;
      input.setDragEditSecond(null);
      input.setDragTarget(null);
      input.dragStartClientXRef.current = null;

      window.setTimeout(() => {
        input.dragMovedRef.current = false;
      }, 0);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp, { once: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    input.beatGrid,
    input.dragEditSecondRef,
    input.dragMovedRef,
    input.dragStartClientXRef,
    input.dragTarget,
    input.durationSeconds,
    input.onMoveCue,
    input.onMoveLoop,
    input.onMoveLoopBoundary,
    input.resolveSecondFromClientX,
    input.setDragEditSecond,
    input.setDragTarget,
  ]);
}
