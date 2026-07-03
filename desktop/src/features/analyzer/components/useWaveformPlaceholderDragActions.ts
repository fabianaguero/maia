import { useCallback } from "react";

import {
  beginWaveformCueDragState,
  beginWaveformLoopBoundaryDragState,
  beginWaveformLoopDragState,
} from "./waveformPlaceholderInteractionActionRuntime";
import type {
  UseWaveformPlaceholderInteractionActionsInput,
  WaveformCueDragInput,
  WaveformLoopBoundaryDragInput,
  WaveformLoopDragInput,
} from "./useWaveformPlaceholderInteractionActionsTypes";

export function useWaveformPlaceholderDragActions(
  input: UseWaveformPlaceholderInteractionActionsInput,
) {
  const handleBeginCueDrag = useCallback(
    (dragInput: WaveformCueDragInput) => {
      beginWaveformCueDragState({
        clientX: dragInput.eventClientX,
        cue: dragInput.cue,
        second: dragInput.second,
        dragMovedRef: input.dragMovedRef,
        dragStartClientXRef: input.dragStartClientXRef,
        dragEditSecondRef: input.dragEditSecondRef,
        setGridClickArmed: input.setGridClickArmed,
        setPhraseSelectArmed: input.setPhraseSelectArmed,
        setDragEditSecond: input.setDragEditSecond,
        setDragTarget: input.setDragTarget,
      });
    },
    [
      input.dragEditSecondRef,
      input.dragMovedRef,
      input.dragStartClientXRef,
      input.setDragEditSecond,
      input.setDragTarget,
      input.setGridClickArmed,
      input.setPhraseSelectArmed,
    ],
  );

  const handleBeginLoopDrag = useCallback(
    (dragInput: WaveformLoopDragInput) => {
      beginWaveformLoopDragState({
        clientX: dragInput.eventClientX,
        loopId: dragInput.loopId,
        startSecond: dragInput.startSecond,
        endSecond: dragInput.endSecond,
        pointerOffsetSecond: dragInput.pointerOffsetSecond,
        dragMovedRef: input.dragMovedRef,
        dragStartClientXRef: input.dragStartClientXRef,
        dragEditSecondRef: input.dragEditSecondRef,
        setGridClickArmed: input.setGridClickArmed,
        setPhraseSelectArmed: input.setPhraseSelectArmed,
        setDragEditSecond: input.setDragEditSecond,
        setDragTarget: input.setDragTarget,
      });
    },
    [
      input.dragEditSecondRef,
      input.dragMovedRef,
      input.dragStartClientXRef,
      input.setDragEditSecond,
      input.setDragTarget,
      input.setGridClickArmed,
      input.setPhraseSelectArmed,
    ],
  );

  const handleBeginLoopBoundaryDrag = useCallback(
    (dragInput: WaveformLoopBoundaryDragInput) => {
      beginWaveformLoopBoundaryDragState({
        clientX: dragInput.eventClientX,
        loopId: dragInput.loopId,
        boundary: dragInput.boundary,
        second: dragInput.second,
        dragMovedRef: input.dragMovedRef,
        dragStartClientXRef: input.dragStartClientXRef,
        dragEditSecondRef: input.dragEditSecondRef,
        setGridClickArmed: input.setGridClickArmed,
        setPhraseSelectArmed: input.setPhraseSelectArmed,
        setDragEditSecond: input.setDragEditSecond,
        setDragTarget: input.setDragTarget,
      });
    },
    [
      input.dragEditSecondRef,
      input.dragMovedRef,
      input.dragStartClientXRef,
      input.setDragEditSecond,
      input.setDragTarget,
      input.setGridClickArmed,
      input.setPhraseSelectArmed,
    ],
  );

  return {
    handleBeginCueDrag,
    handleBeginLoopDrag,
    handleBeginLoopBoundaryDrag,
  };
}
