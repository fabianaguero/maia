import type React from "react";

import type {
  DeckBeatMarkerViewModel,
  DeckTimelineMarkerViewModel,
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
  onStagePointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onStageClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  laneLabels: LaneLabelViewModel[];
}

export function MonitorDeckWaveStage({
  waveformCanvasRef,
  waveformStageRef,
  deckTimelineMarkers,
  deckBeatMarkers,
  onStagePointerDown,
  onStageClick,
  laneLabels,
}: MonitorDeckWaveStageProps) {
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
