import type React from "react";

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
  overviewWindowLeftPercent,
  overviewWindowWidthPercent,
  overviewPlayheadLeftPercent,
  onOverviewPointerDown,
  onOverviewClick,
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
