import React from "react";
import { RefreshCw } from "lucide-react";
import { useT } from "../../i18n/I18nContext";

import type { MonitorLogLine } from "./monitorLogParsing";

interface LiveTailPanelProps {
  isConsoleExpanded: boolean;
  onToggleConsole?: () => void;
  isAnomalyFilterActive: boolean;
  onClearAnomalyFilter: () => void;
  onRefresh: () => void;
  onSimulateLog: () => void;
  terminalLinesRef: React.RefObject<HTMLDivElement | null>;
  onTerminalScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  liveLines: MonitorLogLine[];
  isConnectingMonitor: boolean;
  monitorSourcePath: string;
  streamAdapterLabel: string;
  selectedAnomalyId: string | null;
  onSelectAnomalyLine: (anomalyId: string) => void;
  registerLineRef: (lineId: string, node: HTMLDivElement | null) => void;
}

export function LiveTailPanel({
  isConsoleExpanded,
  onToggleConsole,
  isAnomalyFilterActive,
  onClearAnomalyFilter,
  onRefresh,
  onSimulateLog,
  terminalLinesRef,
  onTerminalScroll,
  liveLines,
  isConnectingMonitor,
  monitorSourcePath,
  streamAdapterLabel,
  selectedAnomalyId,
  onSelectAnomalyLine,
  registerLineRef,
}: LiveTailPanelProps) {
  const t = useT();
  const formatAdapterStatus = (template: string) =>
    template.replace("{adapter}", streamAdapterLabel);

  return (
    <div className={`terminal-tail-container ${isConsoleExpanded ? "expanded" : ""}`}>
      <div className="terminal-header" onClick={() => onToggleConsole?.()}>
        <div className="terminal-dots">
          <span className="terminal-dot red" />
          <span className="terminal-dot yellow" />
          <span className="terminal-dot green" />
        </div>
        <span className="terminal-title">
          {isAnomalyFilterActive
            ? t.simpleMode.monitor.anomalyDetectionStream
            : t.simpleMode.monitor.liveSystemIngestion}
        </span>
        <div className="terminal-controls">
          <button
            className="btn-refresh-hd"
            onClick={(event) => {
              event.stopPropagation();
              onRefresh();
            }}
            style={{
              background: "none",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#94a3b8",
              padding: "2px 8px",
              borderRadius: "4px",
              fontSize: "0.6rem",
              cursor: "pointer",
              marginRight: "0.5rem",
            }}
          >
            {t.simpleMode.common.refresh}
          </button>
          <button
            className="btn-simulate-hd"
            onClick={(event) => {
              event.stopPropagation();
              onSimulateLog();
            }}
          >
            {t.simpleMode.common.simulateData}
          </button>
          {isAnomalyFilterActive ? (
            <button
              className="btn-filter-clear"
              onClick={(event) => {
                event.stopPropagation();
                onClearAnomalyFilter();
              }}
            >
              {t.simpleMode.common.showAll}
            </button>
          ) : null}
          <span className="terminal-action-hint">
            {isConsoleExpanded ? t.simpleMode.common.close : t.simpleMode.common.inspect}
          </span>
        </div>
      </div>
      <div className="terminal-lines" ref={terminalLinesRef} onScroll={onTerminalScroll}>
        {liveLines.length === 0 ? (
          <div className="terminal-empty">
            {isConnectingMonitor ? (
              <RefreshCw size={16} className="spin-ring terminal-connecting-spinner" />
            ) : (
              <div className="pulsing-dot teal" />
            )}
            <span>
              {isConnectingMonitor
                ? t.simpleMode.monitor.connectingRemoteStream
                : t.simpleMode.monitor.waitingLiveIngestion}
            </span>
            <p className="terminal-hint">
              {isConnectingMonitor
                ? `${t.simpleMode.monitor.openingSourceWaiting}: ${monitorSourcePath}`
                : `${t.simpleMode.monitor.listeningRealtime}: ${monitorSourcePath}`}
            </p>
            <div className="terminal-status-badge">
              {isConnectingMonitor
                ? formatAdapterStatus(t.simpleMode.monitor.sourceStatusConnecting)
                : formatAdapterStatus(t.simpleMode.monitor.sourceStatusActive)}
            </div>
          </div>
        ) : (
          liveLines
            .filter((line) => !isAnomalyFilterActive || line.level === "error")
            .map((line) => (
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
                <span className="line-ts">[{line.timestamp}]</span>
                <span className="line-level">{line.level.toUpperCase()}</span>
                {line.isAnomaly ? (
                  <span className="line-anomaly-link">
                    {selectedAnomalyId === line.anomalyId
                      ? t.simpleMode.monitor.linked
                      : t.simpleMode.monitor.anomaly}
                  </span>
                ) : null}
                <span className="line-msg">{line.message}</span>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
