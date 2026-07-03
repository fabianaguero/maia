import { useEffect } from "react";
import { buildWaveformPlaceholderInteractionResetState } from "./waveformPlaceholderInteractionResetRuntime";

export function useWaveformPlaceholderInteractionResets(input: {
  canEditBeatGrid: boolean;
  canSelectPhrase: boolean;
  canEditPerformance: boolean;
  setGridClickArmed: (value: boolean) => void;
  setGridAnchorDragging: (value: boolean) => void;
  setDragAnchorSecond: (value: number | null) => void;
  dragAnchorSecondRef: { current: number | null };
  setPhraseSelectArmed: (value: boolean) => void;
  setDragTarget: (value: null) => void;
  setDragEditSecond: (value: number | null) => void;
  dragEditSecondRef: { current: number | null };
  dragMovedRef: { current: boolean };
  dragStartClientXRef: { current: number | null };
}) {
  const {
    canEditBeatGrid,
    canSelectPhrase,
    canEditPerformance,
    setGridClickArmed,
    setGridAnchorDragging,
    setDragAnchorSecond,
    dragAnchorSecondRef,
    setPhraseSelectArmed,
    setDragTarget,
    setDragEditSecond,
    dragEditSecondRef,
    dragMovedRef,
    dragStartClientXRef,
  } = input;
  const resetState = buildWaveformPlaceholderInteractionResetState({
    canEditBeatGrid,
    canSelectPhrase,
    canEditPerformance,
  });

  useEffect(() => {
    if (resetState.resetBeatGridEditing) {
      setGridClickArmed(false);
      setGridAnchorDragging(false);
      setDragAnchorSecond(null);
      dragAnchorSecondRef.current = null;
    }
  }, [
    dragAnchorSecondRef,
    resetState.resetBeatGridEditing,
    setDragAnchorSecond,
    setGridAnchorDragging,
    setGridClickArmed,
  ]);

  useEffect(() => {
    if (resetState.resetPhraseSelection) {
      setPhraseSelectArmed(false);
    }
  }, [resetState.resetPhraseSelection, setPhraseSelectArmed]);

  useEffect(() => {
    if (resetState.resetPerformanceDragging) {
      setDragTarget(null);
      setDragEditSecond(null);
      dragEditSecondRef.current = null;
      dragMovedRef.current = false;
      dragStartClientXRef.current = null;
    }
  }, [
    dragEditSecondRef,
    dragMovedRef,
    dragStartClientXRef,
    resetState.resetPerformanceDragging,
    setDragEditSecond,
    setDragTarget,
  ]);
}
