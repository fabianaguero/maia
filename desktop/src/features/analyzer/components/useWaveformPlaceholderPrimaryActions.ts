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
  const resolveSecondFromClientX = useCallback(
    (clientX: number): number | null => {
      return resolveWaveformSecondFromClientX({
        clientX,
        stageRect: input.stageRef.current?.getBoundingClientRect() ?? null,
        durationSeconds: input.durationSeconds,
      });
    },
    [input.durationSeconds, input.stageRef],
  );

  const handleWaveformClick = useCallback(
    (clientX: number) => {
      const action = resolveWaveformClickAction({
        clientX,
        stageRect: input.stageRef.current?.getBoundingClientRect() ?? null,
        durationSeconds: input.durationSeconds,
        gridClickArmed: input.gridClickArmed,
        phraseSelectArmed: input.phraseSelectArmed,
        beatGrid: input.beatGrid,
        phraseBeatCount: input.phraseBeatCount,
      });

      if (action.action === "noop") {
        return;
      }

      if (action.action === "downbeat" && input.onSetDownbeatAtSecond) {
        input.onSetDownbeatAtSecond(action.second);
        input.setGridClickArmed(false);
        return;
      }

      if (action.action === "phrase" && input.onSelectPhraseRange) {
        if (action.range) {
          input.onSelectPhraseRange(action.range);
        }
        input.setPhraseSelectArmed(false);
        return;
      }

      if (action.action === "seek") {
        input.onSeek?.(action.second);
      }
    },
    [
      input.beatGrid,
      input.durationSeconds,
      input.gridClickArmed,
      input.onSeek,
      input.onSelectPhraseRange,
      input.onSetDownbeatAtSecond,
      input.phraseBeatCount,
      input.phraseSelectArmed,
      input.setGridClickArmed,
      input.setPhraseSelectArmed,
      input.stageRef,
    ],
  );

  const consumeDraggedClick = useCallback(() => {
    return consumeWaveformDraggedClick({ dragMovedRef: input.dragMovedRef });
  }, [input.dragMovedRef]);

  const toggleGridClickArmed = useCallback(() => {
    toggleWaveformGridClickArmedState({
      setGridClickArmed: input.setGridClickArmed,
      setPhraseSelectArmed: input.setPhraseSelectArmed,
    });
  }, [input.setGridClickArmed, input.setPhraseSelectArmed]);

  const togglePhraseSelectArmed = useCallback(() => {
    toggleWaveformPhraseSelectArmedState({
      setGridClickArmed: input.setGridClickArmed,
      setPhraseSelectArmed: input.setPhraseSelectArmed,
    });
  }, [input.setGridClickArmed, input.setPhraseSelectArmed]);

  const beginAnchorDrag = useCallback(
    (anchorSecond: number | null) => {
      beginWaveformAnchorDragState({
        anchorSecond,
        dragAnchorSecondRef: input.dragAnchorSecondRef,
        setGridClickArmed: input.setGridClickArmed,
        setGridAnchorDragging: input.setGridAnchorDragging,
        setDragAnchorSecond: input.setDragAnchorSecond,
      });
    },
    [
      input.dragAnchorSecondRef,
      input.setDragAnchorSecond,
      input.setGridAnchorDragging,
      input.setGridClickArmed,
    ],
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
