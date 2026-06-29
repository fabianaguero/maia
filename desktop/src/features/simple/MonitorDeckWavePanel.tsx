import React from "react";
import { useT } from "../../i18n/I18nContext";
import { buildMonitorDeckWavePanelViewModel } from "./monitorDeckWavePanelViewModel";
import { formatAnomalyCueCode } from "./monitorDisplay";

interface AnomalyBurstRegionViewModel {
  id: string;
  startProgress: number;
  endProgress: number;
  severity: number;
  count: number;
}

interface OverviewAnomalyMarkerViewModel {
  id: string;
  progress: number;
  severity: number;
  timestamp: string;
  message: string;
  leftPercent: number;
}

interface DeckTimelineMarkerViewModel {
  id: string;
  leftPercent: number;
  label: string;
  emphasis: "major" | "minor" | "playhead";
}

interface DeckBeatMarkerViewModel {
  id: string;
  leftPercent: number;
  major: boolean;
}

interface MonitorDeckWavePanelProps {
  overviewCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  waveformCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  waveformStageRef: React.RefObject<HTMLDivElement | null>;
  anomalyBurstRegions: AnomalyBurstRegionViewModel[];
  selectedBurstRegionId?: string | null;
  overviewAnomalyMarkers: OverviewAnomalyMarkerViewModel[];
  selectedAnomalyId: string | null;
  overviewWindowLeftPercent: number;
  overviewWindowWidthPercent: number;
  overviewPlayheadLeftPercent: number;
  onOverviewPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onOverviewClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  onOverviewAnomalyClick: (
    marker: OverviewAnomalyMarkerViewModel,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => void;
  onOverviewAnomalyPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
  deckTimelineMarkers: DeckTimelineMarkerViewModel[];
  deckBeatMarkers: DeckBeatMarkerViewModel[];
  onStagePointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onStageClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  stageHeightPx: number;
}

export function MonitorDeckWavePanel({
  overviewCanvasRef,
  waveformCanvasRef,
  waveformStageRef,
  anomalyBurstRegions,
  selectedBurstRegionId,
  overviewAnomalyMarkers,
  selectedAnomalyId,
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
      <div className="waveform-dual-channel" style={{ height: `${stageHeightPx}px` }}>
        <div className="monitor-overview-shell">
          <div
            className="monitor-overview-wave"
            aria-hidden="true"
            onPointerDown={onOverviewPointerDown}
            onClick={onOverviewClick}
          >
            <canvas ref={overviewCanvasRef} className="monitor-overview-wave__canvas" />
            <span className="monitor-overview-wave__label">{viewModel.overview.label}</span>
            <span className="monitor-overview-wave__sublabel">{viewModel.overview.sublabel}</span>
            <div className="monitor-overview-wave__anomalies">
              {anomalyBurstRegions.map((region) => (
                <span
                  key={`overview-region-${region.id}`}
                  className={`monitor-overview-wave__region${region.severity >= 0.9 ? " critical" : " warning"}${selectedBurstRegionId === region.id ? " active" : ""}`}
                  style={{
                    left: `${region.startProgress * 100}%`,
                    width: `${Math.max(0.4, (region.endProgress - region.startProgress) * 100)}%`,
                  }}
                />
              ))}
              {overviewAnomalyMarkers.map((marker) => (
                <button
                  key={`overview-${marker.id}`}
                  type="button"
                  className={`monitor-overview-wave__anomaly${selectedAnomalyId === marker.id ? " active" : ""}${marker.severity >= 0.9 ? " critical" : " warning"}`}
                  style={{ left: `${marker.leftPercent}%` }}
                  title={`${formatAnomalyCueCode(marker.id)} · ${marker.timestamp} · ${marker.message}`}
                  onClick={(event) => onOverviewAnomalyClick(marker, event)}
                  onPointerDown={onOverviewAnomalyPointerDown}
                />
              ))}
            </div>
            <div
              className="monitor-overview-wave__window"
              style={{
                left: `${overviewWindowLeftPercent}%`,
                width: `${overviewWindowWidthPercent}%`,
              }}
            />
            <span
              className="monitor-overview-wave__playhead"
              style={{ left: `${overviewPlayheadLeftPercent}%` }}
            />
          </div>
        </div>

        <div className="waveform-channel-hd monitor-deck-body monitor-deck-main monitor-deck-main--wave">
          <div className="monitor-deck-timeline" aria-hidden="true">
            {deckTimelineMarkers.map((marker) => (
              <div
                key={marker.id}
                className={`monitor-deck-timeline__marker ${marker.emphasis}`}
                style={{ left: `${marker.leftPercent}%` }}
              >
                <span className="monitor-deck-timeline__tick" />
                <span className="monitor-deck-timeline__label">{marker.label}</span>
              </div>
            ))}
          </div>

          <div
            ref={waveformStageRef}
            className="waveform-container-hd monitor-deck-stage"
            onPointerDown={onStagePointerDown}
            onClick={onStageClick}
          >
            <canvas ref={waveformCanvasRef} className="monitor-wave-canvas" />
            <div className="monitor-deck-lane-labels" aria-hidden="true">
              {viewModel.laneLabels.map((lane) => (
                <span
                  key={lane.key}
                  className={`monitor-deck-lane-label ${lane.tone}`}
                  title={lane.title}
                >
                  {lane.label}
                </span>
              ))}
            </div>
            <div className="monitor-deck-beat-grid" aria-hidden="true">
              {deckBeatMarkers.map((marker) => (
                <span
                  key={marker.id}
                  className={`monitor-deck-beat-grid__line${marker.major ? " major" : ""}`}
                  style={{ left: `${marker.leftPercent}%` }}
                />
              ))}
            </div>
            <div className="monitor-wave-guides" aria-hidden="true">
              <span className="monitor-wave-guides__line separator" />
              <span className="monitor-wave-guides__line base" />
              <span className="monitor-wave-guides__line mid" />
              <span className="monitor-wave-guides__line top" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
