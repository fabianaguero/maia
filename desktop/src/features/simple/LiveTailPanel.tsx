import React from "react";
import { useT } from "../../i18n/I18nContext";

import type { MonitorLogLine } from "./monitorLogParsing";
import { LiveTailPanelEmptyState } from "./LiveTailPanelEmptyState";
import { LiveTailPanelHeader } from "./LiveTailPanelHeader";
import { LiveTailPanelLines } from "./LiveTailPanelLines";
import { buildLiveTailPanelViewModel } from "./liveTailPanelViewModel";

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
      <LiveTailPanelHeader
        title={viewModel.title}
        subtitle={viewModel.subtitle}
        actionHint={viewModel.actionHint}
        isConsoleExpanded={isConsoleExpanded}
        summaryChips={viewModel.summaryChips}
        statusBadgeLabel={viewModel.statusBadgeLabel}
        visibleLinesLabel={viewModel.visibleLinesLabel}
        showClearFilter={viewModel.showClearFilter}
        refreshLabel={t.simpleMode.common.refresh}
        simulateLabel={t.simpleMode.common.simulateData}
        showAllLabel={t.simpleMode.common.showAll}
        onToggleConsole={onToggleConsole}
        onRefresh={onRefresh}
        onSimulateLog={onSimulateLog}
        onClearAnomalyFilter={onClearAnomalyFilter}
      />
      <div className="terminal-lines" ref={terminalLinesRef} onScroll={onTerminalScroll}>
        {viewModel.filteredLines.length === 0 ? (
          <LiveTailPanelEmptyState
            isConnectingMonitor={isConnectingMonitor}
            emptyStateLabel={viewModel.emptyStateLabel}
            emptyStateHint={viewModel.emptyStateHint}
            statusBadgeLabel={viewModel.statusBadgeLabel}
          />
        ) : (
          <LiveTailPanelLines
            lines={viewModel.filteredLines}
            selectedAnomalyId={selectedAnomalyId}
            onSelectAnomalyLine={onSelectAnomalyLine}
            registerLineRef={registerLineRef}
            t={t}
          />
        )}
      </div>
    </div>
  );
}
