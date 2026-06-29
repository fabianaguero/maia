import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useT } from "../../../i18n/I18nContext";
import type {
  BeatGridPoint,
  TrackSavedLoop,
  VisualizationCuePoint,
  VisualizationRegionPoint,
} from "../../../types/library";
import { selectBeatGridPhrase, type BeatGridPhraseRange } from "../../../utils/beatGrid";
import { hasUsableBeatGrid, resolveTrackPlacementSecond } from "../../../utils/track";
import {
  buildWaveformSummaryPills,
  buildRenderedCueMarkers,
  buildRenderedRegions,
  formatDuration,
  resolveAnchorPosition,
  resolveDisplayBins,
  resolveWaveformInteractionHints,
  resolveWaveformPlayheadOverlayState,
  resolveVisibleBeats,
  resolveWaveformCursor,
  resolveWaveformSummaryFlags,
  type DragTarget,
  type WaveformEditableCuePoint,
} from "./waveformPlaceholderRuntime";
import { WaveformCueOverlay } from "./WaveformCueOverlay";
import { WaveformRegionOverlay } from "./WaveformRegionOverlay";

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
  onMoveLoopBoundary?: (loopId: string, boundary: "start" | "end", second: number) => void;
  onMoveLoop?: (loopId: string, startSecond: number) => void;
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
  const t = useT();
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

  const displayBins = resolveDisplayBins(bins);
  const visibleBeats = resolveVisibleBeats(beatGrid, durationSeconds);
  const { anchorSecond, anchorPosition } = resolveAnchorPosition({
    dragAnchorSecond,
    durationSeconds,
    visibleBeats,
  });
  const { showRegionSummary, showPhraseSummary } = resolveWaveformSummaryFlags(
    regions,
    selectedPhraseRange,
    onSelectPhraseRange,
  );
  const renderedCueMarkers = buildRenderedCueMarkers({
    editableCues,
    hotCues,
    dragTarget,
    dragEditSecond,
  });
  const renderedRegions = buildRenderedRegions({
    regions,
    editableLoops,
    dragTarget,
    dragEditSecond,
    durationSeconds,
  });
  const interactionHints = resolveWaveformInteractionHints({
    gridClickArmed,
    phraseSelectArmed,
    gridAnchorDragging,
    phraseBeatCount,
    t,
  });
  const playheadOverlay = resolveWaveformPlayheadOverlayState({
    currentTime,
    durationSeconds,
    analysisProgress,
    t,
  });
  const summaryPills = buildWaveformSummaryPills({
    visibleBeatsCount: visibleBeats.length,
    showRegionSummary,
    regionsCount: regions.length,
    selectedPhraseRange,
    displayBinsCount: displayBins.length,
    gridAnchorDragging,
    gridClickArmed,
    phraseSelectArmed,
    showPhraseSummary,
    t,
  });

  return (
    <section className={`panel waveform-panel${hero ? " waveform-panel--hero" : ""}`}>
      <div className="panel-header">
        <div>
          <h2>{t.inspect.waveformBeatGridTitle}</h2>
          <p className="support-copy">{t.inspect.waveformBeatGridCopy}</p>
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
                {gridClickArmed ? t.inspect.cancelGridClick : t.inspect.armDownbeatClick}
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
                {phraseSelectArmed ? t.inspect.cancelPhraseSelect : t.inspect.armPhraseSelectButton}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div
        ref={stageRef}
        className="waveform-stage"
        onClick={handleWaveformClick}
        aria-label={t.inspect.waveformStage}
        style={{
          cursor: resolveWaveformCursor({
            gridAnchorDragging,
            dragTarget,
            phraseSelectArmed,
            canSelectPhrase,
            gridClickArmed,
            canEditBeatGrid,
            onSeek,
          }),
        }}
      >
        {interactionHints.gridHint ? (
          <div className="waveform-grid-edit-hint">{interactionHints.gridHint}</div>
        ) : null}
        {interactionHints.phraseHint ? (
          <div className="waveform-grid-edit-hint waveform-grid-edit-hint--phrase">
            {interactionHints.phraseHint}
          </div>
        ) : null}
        {interactionHints.dragHint ? (
          <div className="waveform-grid-edit-hint waveform-grid-edit-hint--drag">
            {interactionHints.dragHint}
          </div>
        ) : null}
        <div
          className="waveform-bars"
          aria-label={t.inspect.waveformOverview}
          style={
            {
              gridTemplateColumns: `repeat(${displayBins.length}, minmax(0, 1fr))`,
            } as CSSProperties
          }
        >
          {displayBins.map((bin, index) => (
            <span
              key={`${index}-${bin}`}
              className="waveform-bar"
              style={{ "--bar-scale": String(bin) } as CSSProperties}
            />
          ))}
        </div>

        <div className="beat-grid-overlay" aria-label={t.inspect.beatGridMarkers}>
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
                title={t.inspect.beatAtSecond
                  .replace("{label}", beat.label)
                  .replace("{second}", beat.second.toFixed(2))}
              >
                {beat.emphasis !== "beat" ? (
                  <span className="beat-grid-marker-label">{beat.label}</span>
                ) : null}
              </span>
            );
          })}
        </div>

        {regions.length > 0 || selectedPhraseRange ? (
          <WaveformRegionOverlay
            renderedRegions={renderedRegions}
            selectedPhraseRange={selectedPhraseRange}
            durationSeconds={durationSeconds}
            canEditPerformance={canEditPerformance}
            beatGrid={beatGrid}
            onSeek={onSeek}
            onMoveLoop={onMoveLoop}
            onMoveLoopBoundary={onMoveLoopBoundary}
            onBeginLoopDrag={handleBeginLoopDrag}
            onBeginLoopBoundaryDrag={handleBeginLoopBoundaryDrag}
            resolveSecondFromClientX={resolveSecondFromClientX}
            dragMovedRef={dragMovedRef}
          />
        ) : null}

        {anchorPosition !== null && onSetDownbeatAtSecond ? (
          <button
            type="button"
            className={`waveform-grid-anchor${gridAnchorDragging ? " is-dragging" : ""}`}
            style={{ "--anchor-position": `${anchorPosition}%` } as CSSProperties}
            aria-label={t.inspect.dragBeatGridAnchor}
            disabled={!canEditBeatGrid}
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setGridClickArmed(false);
              setGridAnchorDragging(true);
              dragAnchorSecondRef.current = anchorSecond;
              setDragAnchorSecond(anchorSecond);
            }}
          >
            <span className="waveform-grid-anchor-label">{t.inspect.beatOne}</span>
          </button>
        ) : null}

        <WaveformCueOverlay
          renderedCueMarkers={renderedCueMarkers}
          dragTarget={dragTarget}
          durationSeconds={durationSeconds}
          canEditPerformance={canEditPerformance}
          beatGrid={beatGrid}
          onSeek={onSeek}
          onNudgeCue={onNudgeCue}
          onBeginCueDrag={handleBeginCueDrag}
          consumeDraggedClick={consumeDraggedClick}
        />

        <div className="waveform-playhead-overlay" aria-hidden="true">
          {playheadOverlay.progressPercent !== null ? (
            <div
              className="waveform-progress-mask"
              style={
                {
                  width: `${playheadOverlay.progressPercent}%`,
                } as CSSProperties
              }
            />
          ) : null}
          {playheadOverlay.progressPercent !== null ? (
            <div
              className="waveform-playhead"
              style={
                {
                  left: `${playheadOverlay.progressPercent}%`,
                } as CSSProperties
              }
            />
          ) : null}
          {playheadOverlay.analysisEndPercent !== null ? (
            <div
              className="waveform-analysis-end"
              style={
                {
                  left: `${playheadOverlay.analysisEndPercent}%`,
                } as CSSProperties
              }
              title={playheadOverlay.analysisEndTitle ?? undefined}
            />
          ) : null}
        </div>
      </div>

      <div className="waveform-summary">
        {summaryPills.map((pill) => (
          <div key={pill.key} className="waveform-meta-pill">
            <span>{pill.label}</span>
            <strong>{pill.value}</strong>
          </div>
        ))}
      </div>

      <div className="waveform-footer">
        <span>00:00</span>
        <span>{formatDuration(durationSeconds)}</span>
      </div>
    </section>
  );
}
