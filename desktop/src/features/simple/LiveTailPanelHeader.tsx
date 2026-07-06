import type { MouseEvent } from "react";

import type { LiveTailPanelViewModel } from "./liveTailPanelViewModel";

interface LiveTailPanelHeaderProps {
  title: string;
  subtitle: string;
  actionHint: string;
  isConsoleExpanded: boolean;
  summaryChips: LiveTailPanelViewModel["summaryChips"];
  statusBadgeLabel: string;
  visibleLinesLabel: string | null;
  showClearFilter: boolean;
  refreshLabel: string;
  simulateLabel: string;
  showAllLabel: string;
  onToggleConsole?: () => void;
  onRefresh: () => void;
  onSimulateLog: () => void;
  onClearAnomalyFilter: () => void;
}

export function LiveTailPanelHeader({
  title,
  subtitle,
  actionHint,
  isConsoleExpanded,
  summaryChips,
  statusBadgeLabel,
  visibleLinesLabel,
  showClearFilter,
  refreshLabel,
  simulateLabel,
  showAllLabel,
  onToggleConsole,
  onRefresh,
  onSimulateLog,
  onClearAnomalyFilter,
}: LiveTailPanelHeaderProps) {
  const stopHeaderPropagation = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  };

  return (
    <div
      className="terminal-header"
      onClick={() => onToggleConsole?.()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggleConsole?.();
        }
      }}
      role="button"
      tabIndex={0}
      aria-expanded={isConsoleExpanded}
      aria-label={`${title} — ${actionHint}`}
      title={actionHint}
    >
      <div className="terminal-header-main">
        <div className="terminal-dots">
          <span className="terminal-dot red" />
          <span className="terminal-dot yellow" />
          <span className="terminal-dot green" />
        </div>
        <div className="terminal-heading">
          <span className="terminal-title">{title}</span>
          <span className="terminal-subtitle">{subtitle}</span>
        </div>
      </div>
      <div className="terminal-controls">
        <div className="terminal-summary-chips" aria-hidden="true">
          {summaryChips.map((chip) => (
            <span
              key={chip.key}
              className={`terminal-summary-chip terminal-summary-chip--${chip.tone}`}
            >
              <strong>{chip.value}</strong>
              <span>{chip.label}</span>
            </span>
          ))}
        </div>
        <span className="terminal-status-badge">{statusBadgeLabel}</span>
        <button
          className="btn-refresh-hd"
          onClick={(event) => {
            stopHeaderPropagation(event);
            onRefresh();
          }}
        >
          {refreshLabel}
        </button>
        <button
          className="btn-simulate-hd"
          onClick={(event) => {
            stopHeaderPropagation(event);
            onSimulateLog();
          }}
        >
          {simulateLabel}
        </button>
        {visibleLinesLabel && visibleLinesLabel !== statusBadgeLabel ? (
          <span className="terminal-control-pill">{visibleLinesLabel}</span>
        ) : null}
        {showClearFilter ? (
          <button
            className="btn-filter-clear"
            onClick={(event) => {
              stopHeaderPropagation(event);
              onClearAnomalyFilter();
            }}
          >
            {showAllLabel}
          </button>
        ) : null}
        <span className="terminal-action-hint">{actionHint}</span>
      </div>
    </div>
  );
}
