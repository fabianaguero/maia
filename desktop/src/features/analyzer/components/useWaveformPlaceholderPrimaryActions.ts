import { useCallback } from "react";

import {
  beginWaveformAnchorDragState,
  consumeWaveformDraggedClick,
  toggleWaveformGridClickArmedState,
  toggleWaveformPhraseSelectArmedState,
} from "./waveformPlaceholderInteractionActionRuntime";
import {
  resolveWaveformClickAction,
  resolveWaveformSecondFromClientX,
} from "./waveformPlaceholderInteractionRuntime";
import type { UseWaveformPlaceholderInteractionActionsInput } from "./useWaveformPlaceholderInteractionActionsTypes";

export function useWaveformPlaceholderPrimaryActions(
  input: UseWaveformPlaceholderInteractionActionsInput,
) {
  const {
    stageRef,
    durationSeconds,
    gridClickArmed,
    phraseSelectArmed,
    beatGrid,
    phraseBeatCount,
    onSetDownbeatAtSecond,
    onSelectPhraseRange,
    onSeek,
    setGridClickArmed,
    setPhraseSelectArmed,
    dragMovedRef,
    dragAnchorSecondRef,
    setGridAnchorDragging,
    setDragAnchorSecond,
  } = input;

  const resolveSecondFromClientX = useCallback(
    (clientX: number): number | null => {
      return resolveWaveformSecondFromClientX({
        clientX,
        stageRect: stageRef.current?.getBoundingClientRect() ?? null,
        durationSeconds,
      });
    },
    [durationSeconds, stageRef],
  );

  const handleWaveformClick = useCallback(
    (clientX: number) => {
      const action = resolveWaveformClickAction({
        clientX,
        stageRect: stageRef.current?.getBoundingClientRect() ?? null,
        durationSeconds,
        gridClickArmed,
        phraseSelectArmed,
        beatGrid,
        phraseBeatCount,
      });

      if (action.action === "noop") {
        return;
      }

      if (action.action === "downbeat" && onSetDownbeatAtSecond) {
        onSetDownbeatAtSecond(action.second);
        setGridClickArmed(false);
        return;
      }

      if (action.action === "phrase" && onSelectPhraseRange) {
        if (action.range) {
          onSelectPhraseRange(action.range);
        }
        setPhraseSelectArmed(false);
        return;
      }

      if (action.action === "seek") {
        onSeek?.(action.second);
      }
    },
    [
      beatGrid,
      durationSeconds,
      gridClickArmed,
      onSeek,
      onSelectPhraseRange,
      onSetDownbeatAtSecond,
      phraseBeatCount,
      phraseSelectArmed,
      setGridClickArmed,
      setPhraseSelectArmed,
      stageRef,
    ],
  );

  const consumeDraggedClick = useCallback(() => {
    return consumeWaveformDraggedClick({ dragMovedRef });
  }, [dragMovedRef]);

  const toggleGridClickArmed = useCallback(() => {
    toggleWaveformGridClickArmedState({
      setGridClickArmed,
      setPhraseSelectArmed,
    });
  }, [setGridClickArmed, setPhraseSelectArmed]);

  const togglePhraseSelectArmed = useCallback(() => {
    toggleWaveformPhraseSelectArmedState({
      setGridClickArmed,
      setPhraseSelectArmed,
    });
  }, [setGridClickArmed, setPhraseSelectArmed]);

  const beginAnchorDrag = useCallback(
    (anchorSecond: number | null) => {
      beginWaveformAnchorDragState({
        anchorSecond,
        dragAnchorSecondRef,
        setGridClickArmed,
        setGridAnchorDragging,
        setDragAnchorSecond,
      });
    },
    [dragAnchorSecondRef, setDragAnchorSecond, setGridAnchorDragging, setGridClickArmed],
  );

  return {
    resolveSecondFromClientX,
    handleWaveformClick,
    consumeDraggedClick,
    toggleGridClickArmed,
    togglePhraseSelectArmed,
    beginAnchorDrag,
  };
}
