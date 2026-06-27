import type { CSSProperties, ReactNode, RefObject } from "react";

import type { LiveLogMarker } from "../../../types/library";
import type { RoutedLiveCue } from "./liveSonificationScene";
import type {
  AnomalySourceRow,
  SyncTailRow,
} from "./liveLogMonitorPanelRuntime";

type WaveBarStyle = CSSProperties & {
  "--bar-height": string;
  "--bar-opacity": number;
};

type TailCellStyle = CSSProperties & {
  "--cell-opacity": number;
};

interface LiveLogMonitorActivityLabels {
  liveSystemRhythm: string;
  liveSystemRhythmCopy: string;
  awaitingSystemPulse: string;
  idleUpper: string;
  waveAnomalyMarkers: string;
  noAnomalyMarkersLatestWindows: string;
  waveSourceStream: string;
  streamTailSync: string;
  syncTailAria: string;
  waitingSynchronizedLines: string;
  anomalySourceLines: string;
  anomalySourceAria: string;
  noAnomalyProducingLine: string;
}

interface LiveLogMonitorActivityPanelProps {
  waveform: ReactNode;
  recentCues: RoutedLiveCue[];
  waveAnomalyMarkers: LiveLogMarker[];
  liveSourceLabel: string;
  recentSyncTailRows: SyncTailRow[];
  anomalySourceRows: AnomalySourceRow[];
  activeTailWindowId: string | null;
  syncTailListRef: RefObject<HTMLDivElement | null>;
  isTropicalTheme: boolean;
  maxRecentCues: number;
  maxSyncTailLines: number;
  maxAnomalySourceLines: number;
  labels: LiveLogMonitorActivityLabels;
}

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
      <div className={`live-scrolling-wave ${isTropicalTheme ? "tropical-theme" : ""}`}>
        {recentCues.map((cue, idx) => (
          <div
            key={`${cue.id}-${idx}`}
            className={`live-wave-bar ${cue.routeKey}${cue.accent === "anomaly" ? " is-anomaly" : ""}`}
            title={`${cue.component} · ${cue.excerpt}`}
            style={
              {
                "--bar-height": `${cue.accent === "anomaly" ? Math.max(60, cue.gain * 400) : Math.max(10, cue.gain * 220)}px`,
                "--bar-opacity": Math.max(0.3, 1 - idx / maxRecentCues),
              } as WaveBarStyle
            }
          />
        ))}
        {recentCues.length === 0 ? (
          <div className="live-wave-placeholder">{labels.awaitingSystemPulse}</div>
        ) : null}
      </div>
      <div className="monitor-recent-horizontal-tail">
        {recentCues.map((cue, idx) => (
          <div
            key={`tail-${cue.id}-${idx}`}
            className={`monitor-horizontal-tail-cell is-${cue.routeKey}`}
            style={
              {
                "--cell-opacity": Math.max(0.3, 1 - idx / maxRecentCues),
              } as TailCellStyle
            }
          >
            {cue.logLine ? (
              <div className="monitor-horizontal-tail-text">
                <span className="tail-component">[{cue.component}]</span> {cue.logLine}
              </div>
            ) : (
              <div className="monitor-horizontal-tail-empty">{labels.idleUpper}</div>
            )}
          </div>
        ))}
      </div>
      <div className="live-wave-anomaly-strip">
        <div className="monitor-parsed-lines-head">
          <span>{labels.waveAnomalyMarkers}</span>
          <strong>{waveAnomalyMarkers.length}/4</strong>
        </div>
        {waveAnomalyMarkers.length > 0 ? (
          <div className="live-wave-anomaly-chip-list">
            {waveAnomalyMarkers.map((marker, index) => (
              <div key={`${marker.eventIndex}-${index}`} className="live-wave-anomaly-chip">
                <span className="live-wave-anomaly-chip-level">{marker.level.toUpperCase()}</span>
                <span className="live-wave-anomaly-chip-component">{marker.component}</span>
                <code className="live-wave-anomaly-chip-excerpt">{marker.excerpt}</code>
              </div>
            ))}
          </div>
        ) : (
          <p className="monitor-empty-hint">{labels.noAnomalyMarkersLatestWindows}</p>
        )}
      </div>
      <div className="audio-path-card">
        <span>{labels.waveSourceStream}</span>
        <strong>{liveSourceLabel}</strong>
      </div>
      <div className="monitor-lines-under-wave">
        <div className="monitor-parsed-lines">
          <div className="monitor-parsed-lines-head">
            <span>{labels.streamTailSync}</span>
            <strong>
              {recentSyncTailRows.length}/{maxSyncTailLines} lines
            </strong>
          </div>
          <div
            ref={syncTailListRef}
            className="monitor-parsed-lines-list monitor-sync-tail-list"
            role="list"
            aria-label={labels.syncTailAria}
          >
            {recentSyncTailRows.length > 0 ? (
              recentSyncTailRows.map((row, index) => (
                <div
                  key={row.id}
                  className={`monitor-parsed-line is-${row.tone}${row.windowId === activeTailWindowId ? " is-current-window" : ""}`}
                  role="listitem"
                >
                  <span className="monitor-parsed-line-index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="monitor-parsed-line-tone">{row.level.toUpperCase()}</span>
                  <code className="monitor-parsed-line-code">
                    [{row.component}] {row.line}
                    {"\n"}
                    <span className="monitor-anomaly-source-path">{row.sourcePath}</span>
                  </code>
                </div>
              ))
            ) : (
              <div className="monitor-parsed-line is-empty" role="listitem">
                <span className="monitor-parsed-line-index">--</span>
                <span className="monitor-parsed-line-tone">{labels.idleUpper}</span>
                <code className="monitor-parsed-line-code">
                  {labels.waitingSynchronizedLines}
                </code>
              </div>
            )}
          </div>
        </div>
        <div className="monitor-anomaly-source-lines">
          <div className="monitor-parsed-lines-head">
            <span>{labels.anomalySourceLines}</span>
            <strong>
              {anomalySourceRows.length}/{maxAnomalySourceLines}
            </strong>
          </div>
          {anomalySourceRows.length > 0 ? (
            <div className="monitor-parsed-lines-list" role="list" aria-label={labels.anomalySourceAria}>
              {anomalySourceRows.map((row, index) => (
                <div
                  key={`${row.sourcePath}-${index}-${row.level}`}
                  className={`monitor-parsed-line is-${row.tone}`}
                  role="listitem"
                >
                  <span className="monitor-parsed-line-index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="monitor-parsed-line-tone">{row.level.toUpperCase()}</span>
                  <code className="monitor-parsed-line-code">
                    [{row.component}] {row.line}
                    {"\n"}
                    <span className="monitor-anomaly-source-path">{row.sourcePath}</span>
                  </code>
                </div>
              ))}
            </div>
          ) : (
            <div className="monitor-parsed-line is-empty">
              <span className="monitor-parsed-line-index">--</span>
              <span className="monitor-parsed-line-tone">{labels.idleUpper}</span>
              <code className="monitor-parsed-line-code">{labels.noAnomalyProducingLine}</code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
