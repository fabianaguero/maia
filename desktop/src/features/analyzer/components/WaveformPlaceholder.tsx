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
import { WaveformPanelHeader } from "./WaveformPanelHeader";
import { WaveformRegionOverlay } from "./WaveformRegionOverlay";
import { WaveformStageBase } from "./WaveformStageBase";
import { WaveformSummaryFooter } from "./WaveformSummaryFooter";
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
      <WaveformPanelHeader
        title={t.inspect.waveformBeatGridTitle}
        copy={t.inspect.waveformBeatGridCopy}
        showActions={Boolean(onSetDownbeatAtSecond || onSelectPhraseRange)}
        showGridButton={Boolean(onSetDownbeatAtSecond)}
        gridClickArmed={gridClickArmed}
        disableGridButton={!canEditBeatGrid || !durationSeconds || durationSeconds <= 0}
        armDownbeatLabel={t.inspect.armDownbeatClick}
        cancelGridClickLabel={t.inspect.cancelGridClick}
        onToggleGridClickArmed={toggleGridClickArmed}
        showPhraseButton={Boolean(onSelectPhraseRange)}
        phraseSelectArmed={phraseSelectArmed}
        disablePhraseButton={!canSelectPhrase || !durationSeconds || durationSeconds <= 0}
        armPhraseSelectLabel={t.inspect.armPhraseSelectButton}
        cancelPhraseSelectLabel={t.inspect.cancelPhraseSelect}
        onTogglePhraseSelectArmed={togglePhraseSelectArmed}
      />

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
        <WaveformStageBase
          displayBins={displayBins}
          visibleBeats={visibleBeats}
          durationSeconds={durationSeconds}
          waveformOverviewLabel={t.inspect.waveformOverview}
          beatGridMarkersLabel={t.inspect.beatGridMarkers}
          beatAtSecondTitle={t.inspect.beatAtSecond}
        />

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

      <WaveformSummaryFooter summaryPills={summaryPills} durationSeconds={durationSeconds} />
    </section>
  );
}
