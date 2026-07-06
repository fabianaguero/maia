import { useWaveformPlaceholderInteractionResets } from "./useWaveformPlaceholderInteractionResets";
import { useWaveformPlaceholderInteractionActions } from "./useWaveformPlaceholderInteractionActions";
import { useWaveformAnchorDragEffect } from "./useWaveformAnchorDragEffect";
import { useWaveformPerformanceDragEffect } from "./useWaveformPerformanceDragEffect";
import { useWaveformPlaceholderInteractionState } from "./useWaveformPlaceholderInteractionState";
import type {
  UseWaveformPlaceholderInteractionsInput,
  UseWaveformPlaceholderInteractionsResult,
} from "./useWaveformPlaceholderInteractionsTypes";

export function useWaveformPlaceholderInteractions({
  beatGrid,
  durationSeconds,
  canEditBeatGrid,
  canSelectPhrase,
  canEditPerformance,
  phraseBeatCount,
  onSeek,
  onSetDownbeatAtSecond,
  onSelectPhraseRange,
  onMoveCue,
  onMoveLoopBoundary,
  onMoveLoop,
}: UseWaveformPlaceholderInteractionsInput): UseWaveformPlaceholderInteractionsResult {
  const interactionState = useWaveformPlaceholderInteractionState();

  useWaveformPlaceholderInteractionResets({
    canEditBeatGrid,
    canSelectPhrase,
    canEditPerformance,
    setGridClickArmed: interactionState.setGridClickArmed,
    setGridAnchorDragging: interactionState.setGridAnchorDragging,
    setDragAnchorSecond: interactionState.setDragAnchorSecond,
    dragAnchorSecondRef: interactionState.dragAnchorSecondRef,
    setPhraseSelectArmed: interactionState.setPhraseSelectArmed,
    setDragTarget: (value) => interactionState.setDragTarget(value),
    setDragEditSecond: interactionState.setDragEditSecond,
    dragEditSecondRef: interactionState.dragEditSecondRef,
    dragMovedRef: interactionState.dragMovedRef,
    dragStartClientXRef: interactionState.dragStartClientXRef,
  });

  const {
    resolveSecondFromClientX,
    handleWaveformClick,
    handleBeginCueDrag,
    handleBeginLoopDrag,
    handleBeginLoopBoundaryDrag,
    consumeDraggedClick,
    toggleGridClickArmed,
    togglePhraseSelectArmed,
    beginAnchorDrag,
  } = useWaveformPlaceholderInteractionActions({
    stageRef: interactionState.stageRef,
    beatGrid,
    durationSeconds,
    phraseBeatCount,
    gridClickArmed: interactionState.gridClickArmed,
    phraseSelectArmed: interactionState.phraseSelectArmed,
    onSeek,
    onSetDownbeatAtSecond,
    onSelectPhraseRange,
    dragMovedRef: interactionState.dragMovedRef,
    dragStartClientXRef: interactionState.dragStartClientXRef,
    dragAnchorSecondRef: interactionState.dragAnchorSecondRef,
    dragEditSecondRef: interactionState.dragEditSecondRef,
    setGridClickArmed: interactionState.setGridClickArmed,
    setPhraseSelectArmed: interactionState.setPhraseSelectArmed,
    setGridAnchorDragging: interactionState.setGridAnchorDragging,
    setDragAnchorSecond: interactionState.setDragAnchorSecond,
    setDragTarget: interactionState.setDragTarget,
    setDragEditSecond: interactionState.setDragEditSecond,
  });

  useWaveformAnchorDragEffect({
    gridAnchorDragging: interactionState.gridAnchorDragging,
    onSetDownbeatAtSecond,
    resolveSecondFromClientX,
    dragAnchorSecondRef: interactionState.dragAnchorSecondRef,
    setDragAnchorSecond: interactionState.setDragAnchorSecond,
    setGridAnchorDragging: interactionState.setGridAnchorDragging,
  });

  useWaveformPerformanceDragEffect({
    beatGrid,
    durationSeconds,
    dragTarget: interactionState.dragTarget,
    resolveSecondFromClientX,
    dragEditSecondRef: interactionState.dragEditSecondRef,
    dragMovedRef: interactionState.dragMovedRef,
    dragStartClientXRef: interactionState.dragStartClientXRef,
    setDragEditSecond: interactionState.setDragEditSecond,
    setDragTarget: interactionState.setDragTarget,
    onMoveCue,
    onMoveLoopBoundary,
    onMoveLoop,
  });

  return {
    stageRef: interactionState.stageRef,
    gridClickArmed: interactionState.gridClickArmed,
    phraseSelectArmed: interactionState.phraseSelectArmed,
    gridAnchorDragging: interactionState.gridAnchorDragging,
    dragAnchorSecond: interactionState.dragAnchorSecond,
    dragTarget: interactionState.dragTarget,
    dragEditSecond: interactionState.dragEditSecond,
    dragMovedRef: interactionState.dragMovedRef,
    resolveSecondFromClientX,
    handleWaveformClick,
    handleBeginCueDrag,
    handleBeginLoopDrag,
    handleBeginLoopBoundaryDrag,
    consumeDraggedClick,
    toggleGridClickArmed,
    togglePhraseSelectArmed,
    beginAnchorDrag,
  };
}
