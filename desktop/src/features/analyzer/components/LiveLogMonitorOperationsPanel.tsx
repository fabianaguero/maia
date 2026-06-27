import type { ReactNode } from "react";

import { LiveLogMonitorMetricGrid } from "./LiveLogMonitorMetricGrid";
import type { MetricGridItem } from "./liveLogMonitorDisplayRuntime";

interface LiveLogMonitorOperationsPanelLabels {
  masterVolume: string;
  masterVolumeAria: string;
  muteAction: string;
  unmuteAction: string;
  replaySourcePath: string;
  liveSourcePath: string;
}

interface LiveLogMonitorOperationsPanelProps {
  metricGridItems: MetricGridItem[];
  masterVolume: number;
  replayActive: boolean;
  repositorySourcePath: string;
  labels: LiveLogMonitorOperationsPanelLabels;
  onSetMasterVolume: (value: number) => void;
  onToggleMute: () => void;
  scenePanel: ReactNode;
  routingPanel: ReactNode;
}

const QUICK_VOLUME_STEPS = [0.2, 0.4, 0.6] as const;

export function LiveLogMonitorOperationsPanel({
  metricGridItems,
  masterVolume,
  replayActive,
  repositorySourcePath,
  labels,
  onSetMasterVolume,
  onToggleMute,
  scenePanel,
  routingPanel,
}: LiveLogMonitorOperationsPanelProps) {
  return (
    <>
      <LiveLogMonitorMetricGrid items={metricGridItems} />

      <div className="monitor-volume-control top-spaced">
        <label className="monitor-volume-label">
          <span>{labels.masterVolume}</span>
          <strong>{Math.round(masterVolume * 100)}%</strong>
        </label>
        <input
          type="range"
          className="volume-slider"
          min={0}
          max={1}
          step={0.01}
          value={masterVolume}
          onChange={(event) => onSetMasterVolume(Number(event.target.value))}
          aria-label={labels.masterVolumeAria}
        />
        <div className="monitor-volume-actions">
          <button type="button" className="secondary-action" onClick={onToggleMute}>
            {masterVolume <= 0.001 ? labels.unmuteAction : labels.muteAction}
          </button>
          {QUICK_VOLUME_STEPS.map((step) => (
            <button
              key={step}
              type="button"
              className="secondary-action"
              onClick={() => onSetMasterVolume(step)}
            >
              {Math.round(step * 100)}%
            </button>
          ))}
        </div>
      </div>

      <div className="audio-path-card top-spaced">
        <span>{replayActive ? labels.replaySourcePath : labels.liveSourcePath}</span>
        <strong>{repositorySourcePath}</strong>
      </div>

      {scenePanel}
      {routingPanel}
    </>
  );
}
