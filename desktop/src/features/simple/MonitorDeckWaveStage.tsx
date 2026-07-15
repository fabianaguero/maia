import type React from "react";

import { formatAnomalyCueCode } from "./monitorDisplay";
import { clusterVisibleStreamAnomalyMarkers } from "./monitorDeckAnomalyMarkerClusterRuntime";
import {
  isMonitorDeckRelativePositionVisible,
  resolveMonitorDeckRelativePosition,
} from "./monitorDeckCanvasRuntime";
import type {
  DeckBeatMarkerViewModel,
  DeckTimelineMarkerViewModel,
  OverviewAnomalyMarkerViewModel,
} from "./monitorDeckWavePanelTypes";

interface LaneLabelViewModel {
  key: string;
  label: string;
  title: string;
  tone: string;
}

interface MonitorDeckWaveStageProps {
  waveformCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  waveformStageRef: React.RefObject<HTMLDivElement | null>;
  deckTimelineMarkers: DeckTimelineMarkerViewModel[];
  deckBeatMarkers: DeckBeatMarkerViewModel[];
  anomalyMarkers: OverviewAnomalyMarkerViewModel[];
  selectedAnomalyId: string | null;
  trackWaveProgress: number;
  onAnomalyClick: (
    marker: OverviewAnomalyMarkerViewModel,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => void;
  onAnomalyPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onStagePointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onStageClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  laneLabels: LaneLabelViewModel[];
}

export function MonitorDeckWaveStage({
  waveformCanvasRef,
  waveformStageRef,
  deckTimelineMarkers,
  deckBeatMarkers,
  anomalyMarkers,
  selectedAnomalyId,
  trackWaveProgress,
  onAnomalyClick,
  onAnomalyPointerDown,
  onStagePointerDown,
  onStageClick,
  laneLabels,
}: MonitorDeckWaveStageProps) {
  const anomalyWaveProgress = anomalyMarkers.some(
    (marker) => typeof marker.observedAtMs === "number",
  )
    ? 1
    : trackWaveProgress;
  const anomalyMarkerClusters = clusterVisibleStreamAnomalyMarkers({
    markers: anomalyMarkers,
    currentProgress: anomalyWaveProgress,
    selectedAnomalyId,
    resolveRelativePosition: resolveMonitorDeckRelativePosition,
    isVisible: (relative) => isMonitorDeckRelativePositionVisible(relative, 0),
  });

  return (
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
        <div className="monitor-stream-anomaly-markers" aria-label="Anomalías del stream">
          {anomalyMarkerClusters.map(({ id, marker, left, count, containsSelected }) => (
            <button
              key={`stream-anomaly-${id}`}
              type="button"
              className={`monitor-stream-anomaly-marker${marker.severity >= 0.9 ? " critical" : " warning"}${containsSelected ? " active" : ""}`}
              style={{ left: `${left}%` }}
              title={`${formatAnomalyCueCode(marker.id)} · ${marker.timestamp} · ${marker.message}`}
              aria-label={`Ir a ${formatAnomalyCueCode(marker.id)} en el tail`}
              onClick={(event) => onAnomalyClick(marker, event)}
              onPointerDown={onAnomalyPointerDown}
            >
              <span className="monitor-stream-anomaly-marker__peak" aria-hidden="true" />
              <span className="monitor-stream-anomaly-marker__count" aria-hidden="true">
                {count}
              </span>
              <span className="monitor-stream-anomaly-marker__label">
                {count > 1 ? `${count} anomalías` : formatAnomalyCueCode(marker.id)}
              </span>
            </button>
          ))}
        </div>
        <div className="monitor-stream-time-direction" aria-hidden="true">
          <span>HISTORIAL ←</span>
          <span>AHORA</span>
          <span>PRÓXIMOS DATOS →</span>
        </div>
        <div className="monitor-deck-lane-labels" aria-hidden="true">
          {laneLabels.map((lane) => (
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
  );
}
