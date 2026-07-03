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
  const {
    beatGrid,
    durationSeconds,
    dragTarget,
    resolveSecondFromClientX,
    dragEditSecondRef,
    dragMovedRef,
    dragStartClientXRef,
    setDragEditSecond,
    setDragTarget,
    onMoveCue,
    onMoveLoopBoundary,
    onMoveLoop,
  } = input;

  useEffect(() => {
    if (!dragTarget) {
      return;
    }
    const activeDragTarget = dragTarget;

    const handleMouseMove = (event: MouseEvent) => {
      const moveState = buildWaveformPerformanceDragMoveState({
        clientX: event.clientX,
        dragStartClientX: dragStartClientXRef.current,
        resolveSecondFromClientX,
        dragTarget: activeDragTarget,
        durationSeconds,
        beatGrid,
      });
      if (moveState.nextSecond === null) {
        return;
      }

      if (moveState.moved) {
        dragMovedRef.current = true;
      }

      dragEditSecondRef.current = moveState.nextSecond;
      setDragEditSecond(moveState.nextSecond);
    };

    const handleMouseUp = () => {
      const commit = buildWaveformPerformanceDragCommit({
        dragTarget: activeDragTarget,
        nextSecond: dragEditSecondRef.current,
        dragMoved: dragMovedRef.current,
      });

      if (commit.kind === "cue") {
        onMoveCue?.(commit.cue, commit.second);
      }

      if (commit.kind === "loop-boundary") {
        onMoveLoopBoundary?.(commit.loopId, commit.boundary, commit.second);
      }

      if (commit.kind === "loop") {
        onMoveLoop?.(commit.loopId, commit.second);
      }

      dragEditSecondRef.current = null;
      setDragEditSecond(null);
      setDragTarget(null);
      dragStartClientXRef.current = null;

      window.setTimeout(() => {
        dragMovedRef.current = false;
      }, 0);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp, { once: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    beatGrid,
    dragEditSecondRef,
    dragMovedRef,
    dragStartClientXRef,
    dragTarget,
    durationSeconds,
    onMoveCue,
    onMoveLoop,
    onMoveLoopBoundary,
    resolveSecondFromClientX,
    setDragEditSecond,
    setDragTarget,
  ]);
}
