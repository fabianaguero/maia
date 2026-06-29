import { useCallback, useEffect, useRef, useState } from "react";

import type { BeatGridPoint } from "../../../types/library";
import type { BeatGridPhraseRange } from "../../../utils/beatGrid";
import { selectBeatGridPhrase } from "../../../utils/beatGrid";
import { hasUsableBeatGrid, resolveTrackPlacementSecond } from "../../../utils/track";
import type { DragTarget, WaveformEditableCuePoint } from "./waveformPlaceholderRuntime";

interface UseWaveformPlaceholderInteractionsInput {
  beatGrid: BeatGridPoint[];
  durationSeconds: number | null;
  canEditBeatGrid: boolean;
  canSelectPhrase: boolean;
  canEditPerformance: boolean;
  phraseBeatCount: number;
  onSeek?: (second: number) => void;
  onSetDownbeatAtSecond?: (second: number) => void;
  onSelectPhraseRange?: (range: BeatGridPhraseRange) => void;
  onMoveCue?: (cue: WaveformEditableCuePoint, second: number) => void;
  onMoveLoopBoundary?: (loopId: string, boundary: "start" | "end", second: number) => void;
  onMoveLoop?: (loopId: string, startSecond: number) => void;
}

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
}: UseWaveformPlaceholderInteractionsInput) {
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

  useEffect(() => {
    if (!canEditBeatGrid) {
      setGridClickArmed(false);
      setGridAnchorDragging(false);
      setDragAnchorSecond(null);
      dragAnchorSecondRef.current = null;
    }
  }, [canEditBeatGrid]);

  useEffect(() => {
    if (!canSelectPhrase) {
      setPhraseSelectArmed(false);
    }
  }, [canSelectPhrase]);

  useEffect(() => {
    if (!canEditPerformance) {
      setDragTarget(null);
      setDragEditSecond(null);
      dragEditSecondRef.current = null;
      dragMovedRef.current = false;
      dragStartClientXRef.current = null;
    }
  }, [canEditPerformance]);

  const resolveSecondFromClientX = useCallback(
    (clientX: number): number | null => {
      if (!durationSeconds || durationSeconds <= 0 || !stageRef.current) {
        return null;
      }

      const rect = stageRef.current.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, clickX / rect.width));
      return percentage * durationSeconds;
    },
    [durationSeconds],
  );

  useEffect(() => {
    if (!gridAnchorDragging || !onSetDownbeatAtSecond) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const nextSecond = resolveSecondFromClientX(event.clientX);
      if (nextSecond === null) {
        return;
      }

      dragAnchorSecondRef.current = nextSecond;
      setDragAnchorSecond(nextSecond);
    };

    const handleMouseUp = () => {
      const nextSecond = dragAnchorSecondRef.current;
      if (nextSecond !== null) {
        onSetDownbeatAtSecond(nextSecond);
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
  }, [gridAnchorDragging, onSetDownbeatAtSecond, resolveSecondFromClientX]);

  useEffect(() => {
    if (!dragTarget) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const rawSecond = resolveSecondFromClientX(event.clientX);
      if (rawSecond === null) {
        return;
      }

      if (
        dragStartClientXRef.current !== null &&
        Math.abs(event.clientX - dragStartClientXRef.current) > 3
      ) {
        dragMovedRef.current = true;
      }

      let nextSecond = resolveTrackPlacementSecond(
        rawSecond,
        durationSeconds,
        beatGrid,
        hasUsableBeatGrid(beatGrid),
      );

      if (dragTarget.type === "loop") {
        nextSecond = resolveTrackPlacementSecond(
          rawSecond - dragTarget.pointerOffsetSecond,
          durationSeconds,
          beatGrid,
          hasUsableBeatGrid(beatGrid),
        );
      }

      dragEditSecondRef.current = nextSecond;
      setDragEditSecond(nextSecond);
    };

    const handleMouseUp = () => {
      const nextSecond = dragEditSecondRef.current;
      if (dragTarget.type === "cue" && nextSecond !== null && dragMovedRef.current) {
        onMoveCue?.(dragTarget.cue, nextSecond);
      }

      if (dragTarget.type === "loop-boundary" && nextSecond !== null && dragMovedRef.current) {
        onMoveLoopBoundary?.(dragTarget.loopId, dragTarget.boundary, nextSecond);
      }

      if (dragTarget.type === "loop" && nextSecond !== null && dragMovedRef.current) {
        onMoveLoop?.(dragTarget.loopId, nextSecond);
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
    dragTarget,
    durationSeconds,
    onMoveCue,
    onMoveLoop,
    onMoveLoopBoundary,
    resolveSecondFromClientX,
  ]);

  const handleWaveformClick = useCallback(
    (clientX: number) => {
      const seekTime = resolveSecondFromClientX(clientX);
      if (seekTime === null) {
        return;
      }

      if (gridClickArmed && onSetDownbeatAtSecond) {
        onSetDownbeatAtSecond(seekTime);
        setGridClickArmed(false);
        return;
      }

      if (phraseSelectArmed && onSelectPhraseRange) {
        const nextPhraseRange = selectBeatGridPhrase(
          seekTime,
          beatGrid,
          durationSeconds,
          phraseBeatCount,
        );
        if (nextPhraseRange) {
          onSelectPhraseRange(nextPhraseRange);
        }
        setPhraseSelectArmed(false);
        return;
      }

      onSeek?.(seekTime);
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
      resolveSecondFromClientX,
    ],
  );

  const beginPerformanceDrag = useCallback((clientX: number) => {
    dragMovedRef.current = false;
    dragStartClientXRef.current = clientX;
    setGridClickArmed(false);
    setPhraseSelectArmed(false);
  }, []);

  const handleBeginCueDrag = useCallback(
    (input: { eventClientX: number; cue: WaveformEditableCuePoint; second: number }) => {
      beginPerformanceDrag(input.eventClientX);
      setDragTarget({
        type: "cue",
        cue: input.cue,
      });
      dragEditSecondRef.current = input.second;
      setDragEditSecond(input.second);
    },
    [beginPerformanceDrag],
  );

  const handleBeginLoopDrag = useCallback(
    (input: {
      eventClientX: number;
      loopId: string;
      startSecond: number;
      endSecond: number;
      pointerOffsetSecond: number;
    }) => {
      beginPerformanceDrag(input.eventClientX);
      setDragTarget({
        type: "loop",
        loopId: input.loopId,
        startSecond: input.startSecond,
        endSecond: input.endSecond,
        pointerOffsetSecond: input.pointerOffsetSecond,
      });
      dragEditSecondRef.current = input.startSecond;
      setDragEditSecond(input.startSecond);
    },
    [beginPerformanceDrag],
  );

  const handleBeginLoopBoundaryDrag = useCallback(
    (input: {
      eventClientX: number;
      loopId: string;
      boundary: "start" | "end";
      second: number;
    }) => {
      beginPerformanceDrag(input.eventClientX);
      setDragTarget({
        type: "loop-boundary",
        loopId: input.loopId,
        boundary: input.boundary,
      });
      dragEditSecondRef.current = input.second;
      setDragEditSecond(input.second);
    },
    [beginPerformanceDrag],
  );

  const consumeDraggedClick = useCallback(() => {
    if (!dragMovedRef.current) {
      return false;
    }
    dragMovedRef.current = false;
    return true;
  }, []);

  const toggleGridClickArmed = useCallback(() => {
    setPhraseSelectArmed(false);
    setGridClickArmed((current) => !current);
  }, []);

  const togglePhraseSelectArmed = useCallback(() => {
    setGridClickArmed(false);
    setPhraseSelectArmed((current) => !current);
  }, []);

  const beginAnchorDrag = useCallback((anchorSecond: number | null) => {
    setGridClickArmed(false);
    setGridAnchorDragging(true);
    dragAnchorSecondRef.current = anchorSecond;
    setDragAnchorSecond(anchorSecond);
  }, []);

  return {
    stageRef,
    gridClickArmed,
    phraseSelectArmed,
    gridAnchorDragging,
    dragAnchorSecond,
    dragTarget,
    dragEditSecond,
    dragMovedRef,
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
