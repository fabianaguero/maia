import type { RefObject } from "react";

import type { LiveLogMonitorActivityLabels } from "./liveLogMonitorActivityPanelTypes";
import type { AnomalySourceRow, SyncTailRow } from "./liveLogMonitorPanelRuntime";

interface LiveLogMonitorParsedLinesProps {
  recentSyncTailRows: SyncTailRow[];
  anomalySourceRows: AnomalySourceRow[];
  activeTailWindowId: string | null;
  syncTailListRef: RefObject<HTMLDivElement | null>;
  maxSyncTailLines: number;
  maxAnomalySourceLines: number;
  labels: LiveLogMonitorActivityLabels;
}

export function LiveLogMonitorParsedLines({
  recentSyncTailRows,
  anomalySourceRows,
  activeTailWindowId,
  syncTailListRef,
  maxSyncTailLines,
  maxAnomalySourceLines,
  labels,
}: LiveLogMonitorParsedLinesProps) {
  return (
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
              <code className="monitor-parsed-line-code">{labels.waitingSynchronizedLines}</code>
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
          <div
            className="monitor-parsed-lines-list"
            role="list"
            aria-label={labels.anomalySourceAria}
          >
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
  );
}
