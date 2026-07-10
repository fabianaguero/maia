import { RuntimeStatusCard } from "../../components/RuntimeStatusCard";

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
      <RuntimeStatusCard
        title={emptyStateLabel}
        detail={emptyStateHint}
        badge={statusBadgeLabel}
        tone={isConnectingMonitor ? "pending" : "live"}
        activity={isConnectingMonitor ? "spinner" : "pulse"}
        className="terminal-runtime-status"
      />
    </div>
  );
}
