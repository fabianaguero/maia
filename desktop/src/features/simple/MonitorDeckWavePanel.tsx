import React from "react";
import { useT } from "../../i18n/I18nContext";
import { MonitorDeckOverviewPanel } from "./MonitorDeckOverviewPanel";
import { MonitorDeckWaveStage } from "./MonitorDeckWaveStage";
import { buildMonitorDeckWavePanelViewModel } from "./monitorDeckWavePanelViewModel";
import type { MonitorDeckWavePanelProps } from "./monitorDeckWavePanelTypes";

export function MonitorDeckWavePanel({
  overviewCanvasRef,
  waveformCanvasRef,
  waveformStageRef,
  anomalyBurstRegions,
  selectedBurstRegionId,
  overviewAnomalyMarkers,
  selectedAnomalyId,
  trackWaveProgress,
  overviewWindowLeftPercent,
  overviewWindowWidthPercent,
  overviewPlayheadLeftPercent,
  onOverviewPointerDown,
  onOverviewClick,
  onOverviewAnomalyClick,
  onOverviewAnomalyPointerDown,
  deckTimelineMarkers,
  deckBeatMarkers,
  onStagePointerDown,
  onStageClick,
  stageHeightPx,
}: MonitorDeckWavePanelProps) {
  const t = useT();
  const viewModel = buildMonitorDeckWavePanelViewModel({ t });

  return (
    <>
      <div
        className="waveform-dual-channel"
        style={{ minHeight: `${stageHeightPx}px` }}
        title="Arrastra el borde inferior para cambiar la altura de las waves"
      >
        <MonitorDeckOverviewPanel
          overviewCanvasRef={overviewCanvasRef}
          anomalyBurstRegions={anomalyBurstRegions}
          selectedBurstRegionId={selectedBurstRegionId}
          overviewAnomalyMarkers={overviewAnomalyMarkers}
          selectedAnomalyId={selectedAnomalyId}
          overviewWindowLeftPercent={overviewWindowLeftPercent}
          overviewWindowWidthPercent={overviewWindowWidthPercent}
          overviewPlayheadLeftPercent={overviewPlayheadLeftPercent}
          onOverviewPointerDown={onOverviewPointerDown}
          onOverviewClick={onOverviewClick}
          onOverviewAnomalyClick={onOverviewAnomalyClick}
          onOverviewAnomalyPointerDown={onOverviewAnomalyPointerDown}
          label={viewModel.overview.label}
          sublabel={viewModel.overview.sublabel}
        />
        <MonitorDeckWaveStage
          waveformCanvasRef={waveformCanvasRef}
          waveformStageRef={waveformStageRef}
          deckTimelineMarkers={deckTimelineMarkers}
          deckBeatMarkers={deckBeatMarkers}
          anomalyMarkers={overviewAnomalyMarkers}
          selectedAnomalyId={selectedAnomalyId}
          trackWaveProgress={trackWaveProgress}
          onAnomalyClick={onOverviewAnomalyClick}
          onAnomalyPointerDown={onOverviewAnomalyPointerDown}
          onStagePointerDown={onStagePointerDown}
          onStageClick={onStageClick}
          laneLabels={viewModel.laneLabels}
        />
      </div>
    </>
  );
}
