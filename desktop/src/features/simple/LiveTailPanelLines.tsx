import type { AppTranslations } from "../../i18n/types";

import { formatAnomalyCueCode } from "./monitorDisplay";
import type { MonitorLogLine } from "./monitorLogParsing";
import { getMonitorLevelBadgeLabel } from "./liveTailPanelViewModel";

interface LiveTailPanelLinesProps {
  lines: MonitorLogLine[];
  selectedAnomalyId: string | null;
  onSelectAnomalyLine: (anomalyId: string) => void;
  onShowLineDetails?: (line: MonitorLogLine) => void;
  registerLineRef: (lineId: string, node: HTMLDivElement | null) => void;
  t: AppTranslations;
}

export function LiveTailPanelLines({
  lines,
  selectedAnomalyId,
  onSelectAnomalyLine,
  onShowLineDetails,
  registerLineRef,
  t,
}: LiveTailPanelLinesProps) {
  return (
    <>
      {lines.map((line, index) => (
        <div
          key={line.id}
          ref={(node) => registerLineRef(line.id, node)}
          className={`terminal-line ${line.level}${line.isAnomaly ? " anomaly-line" : ""}${selectedAnomalyId && line.anomalyId === selectedAnomalyId ? " linked-anomaly" : ""}`}
          onClick={() => {
            if (line.anomalyId) {
              onSelectAnomalyLine(line.anomalyId);
            }
          }}
        >
          <span className="line-row-index">{String(index + 1).padStart(3, "0")}</span>
          <span className="line-ts">[{line.timestamp}]</span>
          <span className={`line-level line-level--${line.level}`}>
            {getMonitorLevelBadgeLabel(line.level, t)}
          </span>
          {line.isAnomaly ? (
            <span
              className={`line-anomaly-link ${selectedAnomalyId === line.anomalyId ? "is-linked" : ""}`}
              title={
                selectedAnomalyId === line.anomalyId
                  ? `${formatAnomalyCueCode(line.anomalyId)} · ${t.simpleMode.monitor.linked}`
                  : `${formatAnomalyCueCode(line.anomalyId)} · ${t.simpleMode.monitor.anomaly}`
              }
            >
              {formatAnomalyCueCode(line.anomalyId)}
            </span>
          ) : (
            <span className="line-anomaly-slot" aria-hidden="true" />
          )}
          <span className="line-msg">{line.message}</span>
          {line.sonarQubeMeta && (
            <span
              className="line-source-badge"
              title={`${line.sonarQubeMeta.rule} in ${line.sonarQubeMeta.component}${line.sonarQubeMeta.line ? `:${line.sonarQubeMeta.line}` : ""}`}
            >
              <span className="badge-rule">{line.sonarQubeMeta.rule}</span>
              <span className="badge-component">
                {line.sonarQubeMeta.component}
                {line.sonarQubeMeta.line && `:${line.sonarQubeMeta.line}`}
              </span>
            </span>
          )}
          <button
            className="line-details-btn"
            onClick={(e) => {
              e.stopPropagation();
              onShowLineDetails?.(line);
            }}
            title="Ver detalles"
          >
            ℹ
          </button>
        </div>
      ))}
    </>
  );
}
