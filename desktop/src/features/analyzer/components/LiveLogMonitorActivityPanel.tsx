import { LiveLogMonitorActivityWave } from "./LiveLogMonitorActivityWave";
import { LiveLogMonitorAnomalyMarkers } from "./LiveLogMonitorAnomalyMarkers";
import { LiveLogMonitorParsedLines } from "./LiveLogMonitorParsedLines";
import type { LiveLogMonitorActivityPanelProps } from "./liveLogMonitorActivityPanelTypes";

export function LiveLogMonitorActivityPanel({
  waveform,
  recentCues,
  waveAnomalyMarkers,
  liveSourceLabel,
  recentSyncTailRows,
  anomalySourceRows,
  activeTailWindowId,
  syncTailListRef,
  isTropicalTheme,
  maxRecentCues,
  maxSyncTailLines,
  maxAnomalySourceLines,
  labels,
}: LiveLogMonitorActivityPanelProps) {
  return (
    <div className="live-waveform-container top-spaced">
      <div className="panel-header compact">
        <div>
          <h2>{labels.liveSystemRhythm}</h2>
          <p className="support-copy">{labels.liveSystemRhythmCopy}</p>
        </div>
      </div>
      {waveform}
      <LiveLogMonitorActivityWave
        recentCues={recentCues}
        isTropicalTheme={isTropicalTheme}
        maxRecentCues={maxRecentCues}
        labels={labels}
      />
      <LiveLogMonitorAnomalyMarkers waveAnomalyMarkers={waveAnomalyMarkers} labels={labels} />
      <div className="audio-path-card">
        <span>{labels.waveSourceStream}</span>
        <strong>{liveSourceLabel}</strong>
      </div>
      <LiveLogMonitorParsedLines
        recentSyncTailRows={recentSyncTailRows}
        anomalySourceRows={anomalySourceRows}
        activeTailWindowId={activeTailWindowId}
        syncTailListRef={syncTailListRef}
        maxSyncTailLines={maxSyncTailLines}
        maxAnomalySourceLines={maxAnomalySourceLines}
        labels={labels}
      />
    </div>
  );
}
