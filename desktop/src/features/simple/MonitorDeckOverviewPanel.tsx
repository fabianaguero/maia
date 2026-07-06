import type React from "react";

import { formatAnomalyCueCode } from "./monitorDisplay";
import type {
  AnomalyBurstRegionViewModel,
  OverviewAnomalyMarkerViewModel,
} from "./monitorDeckWavePanelTypes";

interface MonitorDeckOverviewPanelProps {
  overviewCanvasRef: React.RefObject<HTMLCanvasElement | null>;
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
  label: string;
  sublabel: string;
}

export function MonitorDeckOverviewPanel({
  overviewCanvasRef,
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
  label,
  sublabel,
}: MonitorDeckOverviewPanelProps) {
  return (
    <div className="monitor-overview-shell">
      <div
        className="monitor-overview-wave"
        aria-hidden="true"
        onPointerDown={onOverviewPointerDown}
        onClick={onOverviewClick}
      >
        <canvas ref={overviewCanvasRef} className="monitor-overview-wave__canvas" />
        <span className="monitor-overview-wave__label">{label}</span>
        <span className="monitor-overview-wave__sublabel">{sublabel}</span>
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
  );
}
