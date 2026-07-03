import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import {
  buildWaveformAnchorDragCommit,
  resolveWaveformAnchorDragSecond,
} from "./waveformAnchorDragRuntime";

interface UseWaveformAnchorDragEffectInput {
  gridAnchorDragging: boolean;
  onSetDownbeatAtSecond?: (second: number) => void;
  resolveSecondFromClientX: (clientX: number) => number | null;
  dragAnchorSecondRef: MutableRefObject<number | null>;
  setDragAnchorSecond: Dispatch<SetStateAction<number | null>>;
  setGridAnchorDragging: Dispatch<SetStateAction<boolean>>;
}

export function useWaveformAnchorDragEffect(input: UseWaveformAnchorDragEffectInput) {
  useEffect(() => {
    if (!input.gridAnchorDragging || !input.onSetDownbeatAtSecond) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const nextSecond = resolveWaveformAnchorDragSecond({
        clientX: event.clientX,
        resolveSecondFromClientX: input.resolveSecondFromClientX,
      });
      if (nextSecond === null) {
        return;
      }

      input.dragAnchorSecondRef.current = nextSecond;
      input.setDragAnchorSecond(nextSecond);
    };

    const handleMouseUp = () => {
      const commit = buildWaveformAnchorDragCommit({
        dragAnchorSecond: input.dragAnchorSecondRef.current,
      });
      if (commit.shouldCommit && commit.second !== null) {
        input.onSetDownbeatAtSecond?.(commit.second);
      }
      input.dragAnchorSecondRef.current = null;
      input.setDragAnchorSecond(null);
      input.setGridAnchorDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp, { once: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    input.dragAnchorSecondRef,
    input.gridAnchorDragging,
    input.onSetDownbeatAtSecond,
    input.resolveSecondFromClientX,
    input.setDragAnchorSecond,
    input.setGridAnchorDragging,
  ]);
}
