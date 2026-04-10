import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type {
  BeatGridPoint,
  TrackSavedLoop,
  VisualizationCuePoint,
  VisualizationRegionPoint,
} from "../../../types/library";
import {
  deriveBeatGridGuideMarkers,
  selectBeatGridPhrase,
  type BeatGridPhraseRange,
} from "../../../utils/beatGrid";
import {
  hasUsableBeatGrid,
  nudgeTrackSecond,
  resolveTrackPlacementSecond,
} from "../../../utils/track";

interface WaveformEditableCuePoint {
  id: string;
  second: number;
  label: string;
  kind: "main" | "hot" | "memory";
  color?: string | null;
}

type DragTarget =
  | {
      type: "cue";
      cue: WaveformEditableCuePoint;
    }
  | {
      type: "loop";
      loopId: string;
      startSecond: number;
      endSecond: number;
      pointerOffsetSecond: number;
    }
  | {
      type: "loop-boundary";
      loopId: string;
      boundary: "start" | "end";
    };

interface WaveformPlaceholderProps {
  bins: number[];
  beatGrid: BeatGridPoint[];
  durationSeconds: number | null;
  hotCues?: VisualizationCuePoint[];
  regions?: VisualizationRegionPoint[];
  editableCues?: WaveformEditableCuePoint[];
  editableLoops?: TrackSavedLoop[];
  currentTime?: number;
  hero?: boolean;
  onSeek?: (second: number) => void;
  analysisProgress?: number | null; // 0-1, null if not applicable
  canEditBeatGrid?: boolean;
  onSetDownbeatAtSecond?: (second: number) => void;
  canSelectPhrase?: boolean;
  selectedPhraseRange?: BeatGridPhraseRange | null;
  onSelectPhraseRange?: (range: BeatGridPhraseRange) => void;
  phraseBeatCount?: number;
  canEditPerformance?: boolean;
  onMoveCue?: (cue: WaveformEditableCuePoint, second: number) => void;
  onNudgeCue?: (cue: WaveformEditableCuePoint, second: number) => void;
  onMoveLoopBoundary?: (
    loopId: string,
    boundary: "start" | "end",
    second: number,
  ) => void;
  onMoveLoop?: (loopId: string, startSecond: number) => void;
}

function formatDuration(durationSeconds: number | null): string {
  if (!durationSeconds) {
    return "--:--";
  }

  const totalSeconds = Math.round(durationSeconds);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function WaveformPlaceholder({
  bins,
  beatGrid,
  durationSeconds,
  hotCues = [],
  regions = [],
  editableCues = [],
  editableLoops = [],
  currentTime = 0,
  hero = false,
  onSeek,
  analysisProgress = null,
  canEditBeatGrid = false,
  onSetDownbeatAtSecond,
  canSelectPhrase = false,
  selectedPhraseRange = null,
  onSelectPhraseRange,
  phraseBeatCount = 16,
  canEditPerformance = false,
  onMoveCue,
  onNudgeCue,
  onMoveLoopBoundary,
  onMoveLoop,
}: WaveformPlaceholderProps) {
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

      if (
        dragTarget.type === "loop-boundary" &&
        nextSecond !== null &&
        dragMovedRef.current
      ) {
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
  }, [beatGrid, dragTarget, durationSeconds, onMoveCue, onMoveLoop, onMoveLoopBoundary, resolveSecondFromClientX]);

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const seekTime = resolveSecondFromClientX(e.clientX);
    if (seekTime === null) return;

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
  };
  // Use bins as-is; if empty, create a fallback with more detail
  const normalizedBins =
    bins.length > 0
      ? bins
      : Array.from({ length: 128 }, (_, index) => {
          const cycle = (index % 16) / 16;
          return Number((0.3 + Math.sin(cycle * Math.PI) * 0.6).toFixed(3));
        });

  // Ensure we have enough bins for hi-res display (at least 128, up to 512)
  const displayBins = normalizedBins.length < 128
    ? Array.from({ length: 128 }, (_, i) =>
        normalizedBins[Math.floor((i / 128) * normalizedBins.length)] || 0.3
      )
    : normalizedBins;

  const visibleBeats =
    durationSeconds && durationSeconds > 0
      ? deriveBeatGridGuideMarkers(beatGrid, durationSeconds)
      : [];
  const anchorSecond = dragAnchorSecond ?? visibleBeats[0]?.second ?? null;
  const anchorPosition =
    anchorSecond !== null && durationSeconds && durationSeconds > 0
      ? Math.min(100, (anchorSecond / durationSeconds) * 100)
      : null;
  const showRegionSummary = regions.length > 0 || selectedPhraseRange !== null;
  const showPhraseSummary = Boolean(onSelectPhraseRange || selectedPhraseRange);
  const renderedCueMarkers =
    editableCues.length > 0
      ? editableCues.map((cue) => ({
          key: cue.id,
          second:
            dragTarget?.type === "cue" && dragTarget.cue.id === cue.id && dragEditSecond !== null
              ? dragEditSecond
              : cue.second,
          label: cue.label,
          type: cue.kind,
          excerpt: cue.kind === "main" ? "Main cue" : undefined,
          interactiveCue: cue,
        }))
      : hotCues.map((cue, index) => ({
          key: `${index}-${cue.second}`,
          second: cue.second,
          label: cue.label,
          type: cue.type,
          excerpt: cue.excerpt,
          interactiveCue: null,
        }));
  const renderedRegions = regions.map((region) => {
    const editableLoop = editableLoops.find((loop) => loop.id === region.id);
    const loopSpan =
      editableLoop ? editableLoop.endSecond - editableLoop.startSecond : region.endSecond - region.startSecond;
    const previewLoopStart =
      dragTarget?.type === "loop" &&
      dragTarget.loopId === region.id &&
      dragEditSecond !== null
        ? durationSeconds && durationSeconds > 0
          ? Math.min(dragEditSecond, Math.max(0, durationSeconds - loopSpan))
          : dragEditSecond
        : null;
    const startSecond =
      previewLoopStart !== null
        ? previewLoopStart
      : dragTarget?.type === "loop-boundary" &&
      dragTarget.loopId === region.id &&
      dragTarget.boundary === "start" &&
      dragEditSecond !== null
        ? Math.min(dragEditSecond, region.endSecond)
        : region.startSecond;
    const endSecond =
      previewLoopStart !== null
        ? durationSeconds && durationSeconds > 0
          ? Math.min(durationSeconds, previewLoopStart + loopSpan)
          : previewLoopStart + loopSpan
      : dragTarget?.type === "loop-boundary" &&
      dragTarget.loopId === region.id &&
      dragTarget.boundary === "end" &&
      dragEditSecond !== null
        ? Math.max(dragEditSecond, region.startSecond)
        : region.endSecond;

    return {
      ...region,
      startSecond,
      endSecond,
      editableLoop,
    };
  });

  return (
    <section className={`panel waveform-panel${hero ? " waveform-panel--hero" : ""}`}>
      <div className="panel-header">
        <div>
          <h2>Waveform + beat grid</h2>
          <p className="support-copy">
            The analyzer currently persists coarse waveform bins for immediate
            review, plus beat markers positioned over the local timeline.
          </p>
        </div>
        {onSetDownbeatAtSecond || onSelectPhraseRange ? (
          <div className="waveform-panel-actions">
            {onSetDownbeatAtSecond ? (
              <button
                type="button"
                className={`compact-action${gridClickArmed ? " waveform-grid-arm-active" : ""}`}
                disabled={!canEditBeatGrid || !durationSeconds || durationSeconds <= 0}
                onClick={() => {
                  setPhraseSelectArmed(false);
                  setGridClickArmed((current) => !current);
                }}
              >
                {gridClickArmed ? "Cancel grid click" : "Arm downbeat click"}
              </button>
            ) : null}
            {onSelectPhraseRange ? (
              <button
                type="button"
                className={`compact-action${phraseSelectArmed ? " waveform-grid-arm-active" : ""}`}
                disabled={!canSelectPhrase || !durationSeconds || durationSeconds <= 0}
                onClick={() => {
                  setGridClickArmed(false);
                  setPhraseSelectArmed((current) => !current);
                }}
              >
                {phraseSelectArmed ? "Cancel phrase select" : "Arm phrase select"}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div
        ref={stageRef}
        className="waveform-stage"
        onClick={handleWaveformClick}
        aria-label="Waveform stage"
        style={{
          cursor: gridAnchorDragging
            ? "grabbing"
            : dragTarget
            ? "grabbing"
            : phraseSelectArmed && canSelectPhrase
              ? "cell"
            : gridClickArmed && canEditBeatGrid
              ? "crosshair"
              : onSeek
                ? "pointer"
                : "default",
        }}
      >
        {gridClickArmed ? (
          <div className="waveform-grid-edit-hint">
            Click the waveform to place beat 1 / downbeat.
          </div>
        ) : null}
        {phraseSelectArmed ? (
          <div className="waveform-grid-edit-hint waveform-grid-edit-hint--phrase">
            Click the waveform to capture a {phraseBeatCount}-beat phrase.
          </div>
        ) : null}
        {gridAnchorDragging ? (
          <div className="waveform-grid-edit-hint waveform-grid-edit-hint--drag">
            Dragging beat 1 / downbeat.
          </div>
        ) : null}
        <div
          className="waveform-bars"
          aria-label="Waveform overview"
          style={{
            gridTemplateColumns: `repeat(${displayBins.length}, minmax(0, 1fr))`,
          } as CSSProperties}
        >
          {displayBins.map((bin, index) => (
            <span
              key={`${index}-${bin}`}
              className="waveform-bar"
              style={{ "--bar-scale": String(bin) } as CSSProperties}
            />
          ))}
        </div>

        <div className="beat-grid-overlay" aria-label="Beat grid markers">
          {visibleBeats.map((beat) => {
            const position =
              durationSeconds && durationSeconds > 0
                ? Math.min(100, (beat.second / durationSeconds) * 100)
                : 0;

            return (
              <span
                key={`${beat.index}-${beat.second}`}
                className={`beat-grid-marker is-${beat.emphasis}`}
                style={{ "--beat-position": `${position}%` } as CSSProperties}
                title={`${beat.label} at ${beat.second.toFixed(2)}s`}
              >
                {beat.emphasis !== "beat" ? (
                  <span className="beat-grid-marker-label">{beat.label}</span>
                ) : null}
              </span>
            );
          })}
        </div>

        {regions.length > 0 || selectedPhraseRange ? (
          <div className="waveform-region-overlay" aria-label="Loop and phrase regions">
            {renderedRegions.map((region) => {
              const startPosition =
                durationSeconds && durationSeconds > 0
                  ? Math.min(100, (region.startSecond / durationSeconds) * 100)
                  : 0;
              const endPosition =
                durationSeconds && durationSeconds > 0
                  ? Math.min(100, (region.endSecond / durationSeconds) * 100)
                  : startPosition;

              return (
                <div
                  key={region.id}
                  className={`waveform-region waveform-region--${region.type}`}
                  style={
                    {
                      "--region-start": `${startPosition}%`,
                      "--region-width": `${Math.max(0.8, endPosition - startPosition)}%`,
                      "--region-color": region.color ?? "rgba(72, 215, 255, 0.28)",
                    } as CSSProperties
                  }
                  title={region.excerpt ? `${region.label} · ${region.excerpt}` : region.label}
                  role="button"
                  tabIndex={onSeek || (canEditPerformance && region.editableLoop) ? 0 : -1}
                  aria-label={`Seek to ${region.label}`}
                  aria-disabled={!onSeek}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (dragMovedRef.current) {
                      dragMovedRef.current = false;
                      return;
                    }
                    onSeek?.(region.startSecond);
                  }}
                  onKeyDown={(event) => {
                    if (
                      canEditPerformance &&
                      region.editableLoop &&
                      (event.key === "ArrowLeft" || event.key === "ArrowRight")
                    ) {
                      event.preventDefault();
                      event.stopPropagation();

                      const direction = event.key === "ArrowLeft" ? -1 : 1;
                      const nextSecond = nudgeTrackSecond(region.startSecond, direction, {
                        durationSeconds,
                        beatGrid,
                        coarse: event.shiftKey,
                        freeSlip: event.altKey,
                      });

                      onMoveLoop?.(region.id, nextSecond);
                      return;
                    }

                    if (!onSeek) {
                      return;
                    }
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      event.stopPropagation();
                      onSeek(region.startSecond);
                    }
                  }}
                  onMouseDown={(event) => {
                    if (!canEditPerformance || !region.editableLoop) {
                      return;
                    }
                    const clickedSecond = resolveSecondFromClientX(event.clientX);
                    const pointerOffsetSecond =
                      clickedSecond === null ? 0 : clickedSecond - region.startSecond;
                    event.preventDefault();
                    event.stopPropagation();
                    dragMovedRef.current = false;
                    dragStartClientXRef.current = event.clientX;
                    setGridClickArmed(false);
                    setPhraseSelectArmed(false);
                    setDragTarget({
                      type: "loop",
                      loopId: region.id,
                      startSecond: region.startSecond,
                      endSecond: region.endSecond,
                      pointerOffsetSecond,
                    });
                    dragEditSecondRef.current = region.startSecond;
                    setDragEditSecond(region.startSecond);
                  }}
                >
                  <span className="waveform-region-label">{region.label}</span>
                  {canEditPerformance && region.editableLoop ? (
                    <>
                      <button
                        type="button"
                        className="waveform-region-handle waveform-region-handle--start"
                        aria-label={`Drag start of ${region.label}`}
                        onKeyDown={(event) => {
                          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
                            return;
                          }

                          event.preventDefault();
                          event.stopPropagation();

                          const direction = event.key === "ArrowLeft" ? -1 : 1;
                          const nextSecond = nudgeTrackSecond(region.startSecond, direction, {
                            durationSeconds,
                            beatGrid,
                            coarse: event.shiftKey,
                            freeSlip: event.altKey,
                          });

                          onMoveLoopBoundary?.(region.id, "start", nextSecond);
                        }}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          dragMovedRef.current = false;
                          dragStartClientXRef.current = event.clientX;
                          setGridClickArmed(false);
                          setPhraseSelectArmed(false);
                          setDragTarget({
                            type: "loop-boundary",
                            loopId: region.id,
                            boundary: "start",
                          });
                          dragEditSecondRef.current = region.startSecond;
                          setDragEditSecond(region.startSecond);
                        }}
                      />
                      <button
                        type="button"
                        className="waveform-region-handle waveform-region-handle--end"
                        aria-label={`Drag end of ${region.label}`}
                        onKeyDown={(event) => {
                          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
                            return;
                          }

                          event.preventDefault();
                          event.stopPropagation();

                          const direction = event.key === "ArrowLeft" ? -1 : 1;
                          const nextSecond = nudgeTrackSecond(region.endSecond, direction, {
                            durationSeconds,
                            beatGrid,
                            coarse: event.shiftKey,
                            freeSlip: event.altKey,
                          });

                          onMoveLoopBoundary?.(region.id, "end", nextSecond);
                        }}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          dragMovedRef.current = false;
                          dragStartClientXRef.current = event.clientX;
                          setGridClickArmed(false);
                          setPhraseSelectArmed(false);
                          setDragTarget({
                            type: "loop-boundary",
                            loopId: region.id,
                            boundary: "end",
                          });
                          dragEditSecondRef.current = region.endSecond;
                          setDragEditSecond(region.endSecond);
                        }}
                      />
                    </>
                  ) : null}
                </div>
              );
            })}
            {selectedPhraseRange && durationSeconds && durationSeconds > 0 ? (
              <div
                className="waveform-region waveform-region--phrase waveform-region--selected"
                style={
                  {
                    "--region-start": `${Math.min(100, (selectedPhraseRange.startSecond / durationSeconds) * 100)}%`,
                    "--region-width": `${Math.max(
                      0.8,
                      ((selectedPhraseRange.endSecond - selectedPhraseRange.startSecond) /
                        durationSeconds) *
                        100,
                    )}%`,
                    "--region-color": "rgba(244, 184, 94, 0.28)",
                  } as CSSProperties
                }
                title={`${selectedPhraseRange.label} · ${selectedPhraseRange.beatCount} beats`}
                role="button"
                tabIndex={onSeek ? 0 : -1}
                aria-label={`Seek to ${selectedPhraseRange.label}`}
                aria-disabled={!onSeek}
                onClick={(event) => {
                  event.stopPropagation();
                  onSeek?.(selectedPhraseRange.startSecond);
                }}
                onKeyDown={(event) => {
                  if (!onSeek) {
                    return;
                  }
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    event.stopPropagation();
                    onSeek(selectedPhraseRange.startSecond);
                  }
                }}
              >
                <span className="waveform-region-label">
                  {selectedPhraseRange.label}
                </span>
              </div>
            ) : null}
          </div>
        ) : null}

        {anchorPosition !== null && onSetDownbeatAtSecond ? (
          <button
            type="button"
            className={`waveform-grid-anchor${gridAnchorDragging ? " is-dragging" : ""}`}
            style={{ "--anchor-position": `${anchorPosition}%` } as CSSProperties}
            aria-label="Drag beat grid anchor"
            disabled={!canEditBeatGrid}
            onMouseDown={(event) => {
              if (!canEditBeatGrid) {
                return;
              }
              event.preventDefault();
              event.stopPropagation();
              setGridClickArmed(false);
              setGridAnchorDragging(true);
              dragAnchorSecondRef.current = anchorSecond;
              setDragAnchorSecond(anchorSecond);
            }}
          >
            <span className="waveform-grid-anchor-label">Beat 1</span>
          </button>
        ) : null}

        <div className="hot-cue-overlay" aria-label="Anomaly markers">
          {renderedCueMarkers.map((cue) => {
            const position =
              durationSeconds && durationSeconds > 0
                ? Math.min(100, (cue.second / durationSeconds) * 100)
                : 0;

            return (
              <button
                key={cue.key}
                type="button"
                className={`hot-cue-marker ${cue.type.toLowerCase()}${dragTarget?.type === "cue" && dragTarget.cue.id === cue.key ? " is-dragging" : ""}`}
                style={{ "--cue-position": `${position}%` } as CSSProperties}
                title={cue.excerpt ? `${cue.label}: ${cue.excerpt}` : cue.label}
                aria-label={`Seek to cue ${cue.label}`}
                disabled={!onSeek}
                onMouseDown={(event) => {
                  if (!canEditPerformance || !cue.interactiveCue) {
                    return;
                  }
                  event.preventDefault();
                  event.stopPropagation();
                  dragMovedRef.current = false;
                  dragStartClientXRef.current = event.clientX;
                  setGridClickArmed(false);
                  setPhraseSelectArmed(false);
                  setDragTarget({
                    type: "cue",
                    cue: cue.interactiveCue,
                  });
                  dragEditSecondRef.current = cue.second;
                  setDragEditSecond(cue.second);
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  if (dragMovedRef.current) {
                    dragMovedRef.current = false;
                    return;
                  }
                  onSeek?.(cue.second);
                }}
                onKeyDown={(event) => {
                  if (!canEditPerformance || !cue.interactiveCue) {
                    return;
                  }

                  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
                    return;
                  }

                  event.preventDefault();
                  event.stopPropagation();

                  const direction = event.key === "ArrowLeft" ? -1 : 1;
                  const nextSecond = nudgeTrackSecond(cue.second, direction, {
                    durationSeconds,
                    beatGrid,
                    coarse: event.shiftKey,
                    freeSlip: event.altKey,
                  });

                  onNudgeCue?.(cue.interactiveCue, nextSecond);
                }}
              >
                <span className="hot-cue-label">{cue.label}</span>
              </button>
            );
          })}
        </div>

        <div className="waveform-playhead-overlay" aria-hidden="true">
          {durationSeconds && durationSeconds > 0 ? (
            <div
              className="waveform-progress-mask"
              style={{
                width: `${Math.min(100, (currentTime / durationSeconds) * 100)}%`,
              } as CSSProperties}
            />
          ) : null}
          {durationSeconds && durationSeconds > 0 ? (
            <div
              className="waveform-playhead"
              style={{
                left: `${Math.min(100, (currentTime / durationSeconds) * 100)}%`,
              } as CSSProperties}
            />
          ) : null}
          {analysisProgress !== null && analysisProgress < 1 && durationSeconds && durationSeconds > 0 ? (
            <div
              className="waveform-analysis-end"
              style={{
                left: `${Math.min(100, analysisProgress * 100)}%`,
              } as CSSProperties}
              title={`Analysis complete up to this point (${Math.round(analysisProgress * 100)}%)`}
            />
          ) : null}
        </div>
      </div>

      <div className="waveform-summary">
        <div className="waveform-meta-pill">
          <span>Visible beats</span>
          <strong>{visibleBeats.length}</strong>
        </div>
        <div className="waveform-meta-pill">
          <span>{showRegionSummary ? "Regions" : "Resolution"}</span>
          <strong>
            {showRegionSummary
              ? regions.length + (selectedPhraseRange ? 1 : 0)
              : `${displayBins.length} bins`}
          </strong>
        </div>
        <div className="waveform-meta-pill">
          <span>Grid state</span>
          <strong>
            {gridAnchorDragging
              ? "Dragging"
              : gridClickArmed
              ? "Armed"
              : visibleBeats.length > 0
                ? "Aligned"
                : "Pending"}
          </strong>
        </div>
        {showPhraseSummary ? (
          <div className="waveform-meta-pill">
            <span>Phrase</span>
            <strong>
              {selectedPhraseRange
                ? `${selectedPhraseRange.label} · ${selectedPhraseRange.beatCount} beats`
                : phraseSelectArmed
                  ? "Armed"
                  : "None"}
            </strong>
          </div>
        ) : null}
      </div>

      <div className="waveform-footer">
        <span>00:00</span>
        <span>{formatDuration(durationSeconds)}</span>
      </div>
    </section>
  );
}
