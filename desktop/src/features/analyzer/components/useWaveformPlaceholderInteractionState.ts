import { useRef, useState } from "react";

import type { DragTarget } from "./waveformPlaceholderRuntime";

export function useWaveformPlaceholderInteractionState() {
  const [gridClickArmed, setGridClickArmed] = useState(false);
  const [phraseSelectArmed, setPhraseSelectArmed] = useState(false);
  const [gridAnchorDragging, setGridAnchorDragging] = useState(false);
  const [dragAnchorSecond, setDragAnchorSecond] = useState<number | null>(null);
  const [dragTarget, setDragTarget] = useState<DragTarget | null>(null);
  const [dragEditSecond, setDragEditSecond] = useState<number | null>(null);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragAnchorSecondRef = useRef<number | null>(null);
  const dragEditSecondRef = useRef<number | null>(null);
  const dragMovedRef = useRef(false);
  const dragStartClientXRef = useRef<number | null>(null);

  return {
    gridClickArmed,
    setGridClickArmed,
    phraseSelectArmed,
    setPhraseSelectArmed,
    gridAnchorDragging,
    setGridAnchorDragging,
    dragAnchorSecond,
    setDragAnchorSecond,
    dragTarget,
    setDragTarget,
    dragEditSecond,
    setDragEditSecond,
    stageRef,
    dragAnchorSecondRef,
    dragEditSecondRef,
    dragMovedRef,
    dragStartClientXRef,
  };
}
