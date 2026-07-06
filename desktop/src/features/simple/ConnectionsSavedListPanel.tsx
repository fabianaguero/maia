import type { LogSourceConnection } from "../../types/monitor";
import { type ConnectionKind, type ConnectionTestStatus } from "./connectionsViewModel";
import { ConnectionsRefreshButton } from "./ConnectionsRefreshButton";
import { ConnectionsSavedListState } from "./ConnectionsSavedListState";
import { buildConnectionsSavedListViewModel } from "./connectionsSavedListViewModel";
import { ConnectionsTailConsole } from "./ConnectionsTailConsole";
import { useT } from "../../i18n/I18nContext";

interface ConnectionsSavedListPanelProps {
  loading: boolean;
  connections: LogSourceConnection[];
  editingConnectionId: string | null;
  connectionKindLabel: Record<ConnectionKind, string>;
  activeConnectionId: string | null;
  activeSessionId: string | null;
  saving: boolean;
  testStatusById: Record<string, ConnectionTestStatus>;
  testMessageById: Record<string, string>;
  tailStatus: string | null;
  tailPreview: string[];
  onRefreshConnections: () => void | Promise<void>;
  onSelectConnection: (connection: LogSourceConnection) => void;
  onStartTail: (connection: LogSourceConnection) => void | Promise<void>;
  onStopTail: () => void | Promise<void>;
  onEditConnection: (connection: LogSourceConnection) => void;
  onTestConnection: (connection: LogSourceConnection) => void | Promise<void>;
  onDeleteConnection: (connectionId: string) => void | Promise<void>;
}

export function ConnectionsSavedListPanel({
  loading,
  connections,
  editingConnectionId,
  connectionKindLabel,
  activeConnectionId,
  activeSessionId,
  saving,
  testStatusById,
  testMessageById,
  tailStatus,
  tailPreview,
  onRefreshConnections,
  onSelectConnection,
  onStartTail,
  onStopTail,
  onEditConnection,
  onTestConnection,
  onDeleteConnection,
}: ConnectionsSavedListPanelProps) {
  const t = useT();
  const viewModel = buildConnectionsSavedListViewModel({
    t,
    connections,
    connectionKindLabel,
    activeConnectionId,
    activeSessionId,
    editingConnectionId,
    saving,
    testStatusById,
    testMessageById,
    tailStatus,
  });

  return (
    <section className="panel connections-panel">
      <div className="panel-header compact">
        <div>
          <h3>{viewModel.title}</h3>
          <p className="support-copy">{viewModel.help}</p>
        </div>
      </div>

      <ConnectionsSavedListState
        loading={loading}
        loadingLabel={viewModel.loadingLabel}
        emptyTitle={viewModel.emptyTitle}
        emptyHelp={viewModel.emptyHelp}
        rows={viewModel.rows}
        onSelectConnection={onSelectConnection}
        onStartTail={onStartTail}
        onStopTail={onStopTail}
        onEditConnection={onEditConnection}
        onTestConnection={onTestConnection}
        onDeleteConnection={onDeleteConnection}
      />

      {activeSessionId ? (
        <ConnectionsTailConsole
          title={viewModel.tailTitle}
          statusLabel={viewModel.tailStatusLabel}
          preview={tailPreview}
        />
      ) : null}

      <ConnectionsRefreshButton
        title={viewModel.refreshTitle}
        disabled={loading || saving}
        onRefreshConnections={onRefreshConnections}
      />
    </section>
  );
}
