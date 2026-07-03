import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import type { DragTarget, WaveformEditableCuePoint } from "./waveformPlaceholderRuntime";

interface BeginWaveformPerformanceDragStateInput {
  clientX: number;
  dragMovedRef: MutableRefObject<boolean>;
  dragStartClientXRef: MutableRefObject<number | null>;
  setGridClickArmed: Dispatch<SetStateAction<boolean>>;
  setPhraseSelectArmed: Dispatch<SetStateAction<boolean>>;
}

export function beginWaveformPerformanceDragState(
  input: BeginWaveformPerformanceDragStateInput,
): void {
  input.dragMovedRef.current = false;
  input.dragStartClientXRef.current = input.clientX;
  input.setGridClickArmed(false);
  input.setPhraseSelectArmed(false);
}

interface BeginWaveformCueDragStateInput extends BeginWaveformPerformanceDragStateInput {
  cue: WaveformEditableCuePoint;
  second: number;
  dragEditSecondRef: MutableRefObject<number | null>;
  setDragEditSecond: Dispatch<SetStateAction<number | null>>;
  setDragTarget: Dispatch<SetStateAction<DragTarget | null>>;
}

export function beginWaveformCueDragState(input: BeginWaveformCueDragStateInput): void {
  beginWaveformPerformanceDragState(input);
  input.setDragTarget({
    type: "cue",
    cue: input.cue,
  });
  input.dragEditSecondRef.current = input.second;
  input.setDragEditSecond(input.second);
}

interface BeginWaveformLoopDragStateInput extends BeginWaveformPerformanceDragStateInput {
  loopId: string;
  startSecond: number;
  endSecond: number;
  pointerOffsetSecond: number;
  dragEditSecondRef: MutableRefObject<number | null>;
  setDragEditSecond: Dispatch<SetStateAction<number | null>>;
  setDragTarget: Dispatch<SetStateAction<DragTarget | null>>;
}

export function beginWaveformLoopDragState(input: BeginWaveformLoopDragStateInput): void {
  beginWaveformPerformanceDragState(input);
  input.setDragTarget({
    type: "loop",
    loopId: input.loopId,
    startSecond: input.startSecond,
    endSecond: input.endSecond,
    pointerOffsetSecond: input.pointerOffsetSecond,
  });
  input.dragEditSecondRef.current = input.startSecond;
  input.setDragEditSecond(input.startSecond);
}

interface BeginWaveformLoopBoundaryDragStateInput extends BeginWaveformPerformanceDragStateInput {
  loopId: string;
  boundary: "start" | "end";
  second: number;
  dragEditSecondRef: MutableRefObject<number | null>;
  setDragEditSecond: Dispatch<SetStateAction<number | null>>;
  setDragTarget: Dispatch<SetStateAction<DragTarget | null>>;
}

export function beginWaveformLoopBoundaryDragState(
  input: BeginWaveformLoopBoundaryDragStateInput,
): void {
  beginWaveformPerformanceDragState(input);
  input.setDragTarget({
    type: "loop-boundary",
    loopId: input.loopId,
    boundary: input.boundary,
  });
  input.dragEditSecondRef.current = input.second;
  input.setDragEditSecond(input.second);
}

export function consumeWaveformDraggedClick(input: {
  dragMovedRef: MutableRefObject<boolean>;
}): boolean {
  if (!input.dragMovedRef.current) {
    return false;
  }

  input.dragMovedRef.current = false;
  return true;
}

export function toggleWaveformGridClickArmedState(input: {
  setGridClickArmed: Dispatch<SetStateAction<boolean>>;
  setPhraseSelectArmed: Dispatch<SetStateAction<boolean>>;
}): void {
  input.setPhraseSelectArmed(false);
  input.setGridClickArmed((current) => !current);
}

export function toggleWaveformPhraseSelectArmedState(input: {
  setGridClickArmed: Dispatch<SetStateAction<boolean>>;
  setPhraseSelectArmed: Dispatch<SetStateAction<boolean>>;
}): void {
  input.setGridClickArmed(false);
  input.setPhraseSelectArmed((current) => !current);
}

export function beginWaveformAnchorDragState(input: {
  anchorSecond: number | null;
  dragAnchorSecondRef: MutableRefObject<number | null>;
  setGridClickArmed: Dispatch<SetStateAction<boolean>>;
  setGridAnchorDragging: Dispatch<SetStateAction<boolean>>;
  setDragAnchorSecond: Dispatch<SetStateAction<number | null>>;
}): void {
  input.setGridClickArmed(false);
  input.setGridAnchorDragging(true);
  input.dragAnchorSecondRef.current = input.anchorSecond;
  input.setDragAnchorSecond(input.anchorSecond);
}
