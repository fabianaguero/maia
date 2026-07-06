import { RefreshCw } from "lucide-react";

interface LiveTailPanelEmptyStateProps {
  isConnectingMonitor: boolean;
  emptyStateLabel: string;
  emptyStateHint: string;
  statusBadgeLabel: string;
}

export function LiveTailPanelEmptyState({
  isConnectingMonitor,
  emptyStateLabel,
  emptyStateHint,
  statusBadgeLabel,
}: LiveTailPanelEmptyStateProps) {
  return (
    <div className="terminal-empty">
      {isConnectingMonitor ? (
        <RefreshCw size={16} className="spin-ring terminal-connecting-spinner" />
      ) : (
        <div className="pulsing-dot teal" />
      )}
      <span>{emptyStateLabel}</span>
      <p className="terminal-hint">{emptyStateHint}</p>
      <div className="terminal-status-badge">{statusBadgeLabel}</div>
    </div>
  );
}
