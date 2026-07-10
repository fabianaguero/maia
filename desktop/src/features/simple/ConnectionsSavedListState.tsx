import { Cable } from "lucide-react";

import { RuntimeStatusCard } from "../../components/RuntimeStatusCard";
import { ConnectionsSavedRow } from "./ConnectionsSavedRow";
import type { ConnectionsSavedListViewModel } from "./connectionsSavedListViewModel";

interface ConnectionsSavedListStateProps {
  loading: boolean;
  loadingLabel: string;
  emptyTitle: string;
  emptyHelp: string;
  rows: ConnectionsSavedListViewModel["rows"];
  onSelectConnection: (
    connection: ConnectionsSavedListViewModel["rows"][number]["connection"],
  ) => void;
  onStartTail: (
    connection: ConnectionsSavedListViewModel["rows"][number]["connection"],
  ) => void | Promise<void>;
  onStopTail: () => void | Promise<void>;
  onEditConnection: (
    connection: ConnectionsSavedListViewModel["rows"][number]["connection"],
  ) => void;
  onTestConnection: (
    connection: ConnectionsSavedListViewModel["rows"][number]["connection"],
  ) => void | Promise<void>;
  onDeleteConnection: (connectionId: string) => void | Promise<void>;
}

export function ConnectionsSavedListState({
  loading,
  loadingLabel,
  emptyTitle,
  emptyHelp,
  rows,
  onSelectConnection,
  onStartTail,
  onStopTail,
  onEditConnection,
  onTestConnection,
  onDeleteConnection,
}: ConnectionsSavedListStateProps) {
  if (loading) {
    return (
      <RuntimeStatusCard
        title={loadingLabel}
        badge={loadingLabel}
        tone="pending"
        activity="spinner"
        compact
        className="placeholder-loading placeholder-loading--runtime"
      />
    );
  }

  if (rows.length === 0) {
    return (
      <div className="empty-state compact-empty">
        <Cable size={28} />
        <strong>{emptyTitle}</strong>
        <p>{emptyHelp}</p>
      </div>
    );
  }

  return (
    <ul className="connections-saved-list">
      {rows.map((row) => (
        <ConnectionsSavedRow
          key={row.id}
          row={row}
          onSelectConnection={onSelectConnection}
          onStartTail={onStartTail}
          onStopTail={onStopTail}
          onEditConnection={onEditConnection}
          onTestConnection={onTestConnection}
          onDeleteConnection={onDeleteConnection}
        />
      ))}
    </ul>
  );
}
