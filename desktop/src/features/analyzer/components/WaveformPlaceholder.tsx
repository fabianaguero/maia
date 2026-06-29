import type { CSSProperties } from "react";

import { useT } from "../../../i18n/I18nContext";
import type {
  BeatGridPoint,
  TrackSavedLoop,
  VisualizationCuePoint,
  VisualizationRegionPoint,
} from "../../../types/library";
import type { BeatGridPhraseRange } from "../../../utils/beatGrid";
import {
  buildWaveformSummaryPills,
  buildRenderedCueMarkers,
  buildRenderedRegions,
  formatDuration,
  resolveAnchorPosition,
  resolveDisplayBins,
  resolveVisibleBeats,
  resolveWaveformCursor,
  resolveWaveformInteractionHints,
  resolveWaveformPlayheadOverlayState,
  resolveWaveformSummaryFlags,
  type WaveformEditableCuePoint,
} from "./waveformPlaceholderRuntime";
import { WaveformCueOverlay } from "./WaveformCueOverlay";
import { WaveformRegionOverlay } from "./WaveformRegionOverlay";
import { useWaveformPlaceholderInteractions } from "./useWaveformPlaceholderInteractions";

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
  analysisProgress?: number | null;
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
  const {
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
  } = useWaveformPlaceholderInteractions({
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
  });

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
                onClick={toggleGridClickArmed}
              >
                {gridClickArmed ? t.inspect.cancelGridClick : t.inspect.armDownbeatClick}
              </button>
            ) : null}
            {onSelectPhraseRange ? (
              <button
                type="button"
                className={`compact-action${phraseSelectArmed ? " waveform-grid-arm-active" : ""}`}
                disabled={!canSelectPhrase || !durationSeconds || durationSeconds <= 0}
                onClick={togglePhraseSelectArmed}
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
        onClick={(event) => handleWaveformClick(event.clientX)}
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
              beginAnchorDrag(anchorSecond);
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
