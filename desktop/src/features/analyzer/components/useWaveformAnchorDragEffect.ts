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
  const {
    gridAnchorDragging,
    onSetDownbeatAtSecond,
    resolveSecondFromClientX,
    dragAnchorSecondRef,
    setDragAnchorSecond,
    setGridAnchorDragging,
  } = input;

  useEffect(() => {
    if (!gridAnchorDragging || !onSetDownbeatAtSecond) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const nextSecond = resolveWaveformAnchorDragSecond({
        clientX: event.clientX,
        resolveSecondFromClientX,
      });
      if (nextSecond === null) {
        return;
      }

      dragAnchorSecondRef.current = nextSecond;
      setDragAnchorSecond(nextSecond);
    };

    const handleMouseUp = () => {
      const commit = buildWaveformAnchorDragCommit({
        dragAnchorSecond: dragAnchorSecondRef.current,
      });
      if (commit.shouldCommit && commit.second !== null) {
        onSetDownbeatAtSecond?.(commit.second);
      }
      dragAnchorSecondRef.current = null;
      setDragAnchorSecond(null);
      setGridAnchorDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp, { once: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    dragAnchorSecondRef,
    gridAnchorDragging,
    onSetDownbeatAtSecond,
    resolveSecondFromClientX,
    setDragAnchorSecond,
    setGridAnchorDragging,
  ]);
}
