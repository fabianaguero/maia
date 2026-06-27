import React from "react";
import { RefreshCw } from "lucide-react";
import { useT } from "../../i18n/I18nContext";

import type { MonitorLogLine } from "./monitorLogParsing";
import {
  buildLiveTailPanelViewModel,
  getMonitorLevelBadgeLabel,
} from "./liveTailPanelViewModel";
import { formatAnomalyCueCode } from "./monitorDisplay";

export interface LiveTailPanelProps {
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
  const viewModel = buildLiveTailPanelViewModel({
    t,
    liveLines,
    isAnomalyFilterActive,
    isConsoleExpanded,
    isConnectingMonitor,
    monitorSourcePath,
    streamAdapterLabel,
  });

  return (
    <div className={`terminal-tail-container ${isConsoleExpanded ? "expanded" : ""}`}>
      <div className="terminal-header" onClick={() => onToggleConsole?.()}>
        <div className="terminal-header-main">
          <div className="terminal-dots">
            <span className="terminal-dot red" />
            <span className="terminal-dot yellow" />
            <span className="terminal-dot green" />
          </div>
          <div className="terminal-heading">
            <span className="terminal-title">{viewModel.title}</span>
            <span className="terminal-subtitle">{viewModel.subtitle}</span>
          </div>
        </div>
        <div className="terminal-controls">
          <div className="terminal-summary-chips" aria-hidden="true">
            {viewModel.summaryChips.map((chip) => (
              <span
                key={chip.key}
                className={`terminal-summary-chip terminal-summary-chip--${chip.tone}`}
              >
                <strong>{chip.value}</strong>
                <span>{chip.label}</span>
              </span>
            ))}
          </div>
          <span className="terminal-status-badge">{viewModel.statusBadgeLabel}</span>
          <button
            className="btn-refresh-hd"
            onClick={(event) => {
              event.stopPropagation();
              onRefresh();
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
          {viewModel.visibleLinesLabel &&
          viewModel.visibleLinesLabel !== viewModel.statusBadgeLabel ? (
            <span className="terminal-control-pill">{viewModel.visibleLinesLabel}</span>
          ) : null}
          {viewModel.showClearFilter ? (
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
          <span className="terminal-action-hint">{viewModel.actionHint}</span>
        </div>
      </div>
      <div className="terminal-lines" ref={terminalLinesRef} onScroll={onTerminalScroll}>
        {viewModel.filteredLines.length === 0 ? (
          <div className="terminal-empty">
            {isConnectingMonitor ? (
              <RefreshCw size={16} className="spin-ring terminal-connecting-spinner" />
            ) : (
              <div className="pulsing-dot teal" />
            )}
            <span>{viewModel.emptyStateLabel}</span>
            <p className="terminal-hint">{viewModel.emptyStateHint}</p>
            <div className="terminal-status-badge">{viewModel.statusBadgeLabel}</div>
          </div>
        ) : (
          viewModel.filteredLines.map((line, index) => (
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
                  className={`line-anomaly-link ${
                    selectedAnomalyId === line.anomalyId ? "is-linked" : ""
                  }`}
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
            </div>
          ))
        )}
      </div>
    </div>
  );
}
