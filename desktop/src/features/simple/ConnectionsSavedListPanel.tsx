import { Cable, Pencil, Play, RefreshCw, Square, Trash2 } from "lucide-react";

import { useT } from "../../i18n/I18nContext";
import type { LogSourceConnection } from "../../types/library";
import {
  deriveCloudBackfillLabel,
  type ConnectionKind,
  type ConnectionTestStatus,
} from "./connectionsViewModel";

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

  return (
    <section className="panel connections-panel">
      <div className="panel-header compact">
        <div>
          <h3>{t.simpleMode.connections.savedConnections}</h3>
          <p className="support-copy">{t.simpleMode.connections.savedConnectionsHelp}</p>
        </div>
      </div>

      {loading ? (
        <div className="placeholder-loading">
          <span className="spin-ring" aria-hidden="true" />
          {t.simpleMode.connections.loading}
        </div>
      ) : connections.length === 0 ? (
        <div className="empty-state compact-empty">
          <Cable size={28} />
          <strong>{t.simpleMode.connections.noConnections}</strong>
          <p>{t.simpleMode.connections.noConnectionsHelp}</p>
        </div>
      ) : (
        <ul className="asset-card-list">
          {connections.map((connection) => (
            <li
              key={connection.id}
              className={`asset-card ${editingConnectionId === connection.id ? "selected" : ""}`}
              onClick={() => onSelectConnection(connection)}
            >
              <div className="asset-card-icon source-icon">
                <Cable size={18} />
              </div>
              <div className="asset-card-body">
                <strong className="asset-card-title">{connection.label}</strong>
                <div className="asset-card-meta">
                  <span className="type-badge">
                    {connectionKindLabel[connection.kind as ConnectionKind] ?? connection.kind}
                  </span>
                  <span className={connection.enabled ? "bpm-badge" : "bpm-badge pending"}>
                    {connection.enabled
                      ? t.simpleMode.connections.enabled
                      : t.simpleMode.connections.disabled}
                  </span>
                  {" · "}
                  {connection.adapterKind}
                  {activeConnectionId === connection.id
                    ? ` · ${t.simpleMode.connections.tailingNow}`
                    : ""}
                </div>
                {testStatusById[connection.id] && testStatusById[connection.id] !== "idle" ? (
                  <div className="asset-card-meta">
                    <span
                      className={
                        testStatusById[connection.id] === "success"
                          ? "bpm-badge"
                          : testStatusById[connection.id] === "error"
                            ? "bpm-badge pending"
                            : "type-badge"
                      }
                    >
                      {testStatusById[connection.id] === "testing"
                        ? t.simpleMode.connections.testing
                        : testStatusById[connection.id] === "success"
                          ? t.simpleMode.connections.connectionOk
                          : t.simpleMode.connections.testFailed}
                    </span>
                    <span>{testMessageById[connection.id]}</span>
                  </div>
                ) : null}
                <span className="asset-card-date" title={connection.sourceUri}>
                  {connection.sourceUri}
                </span>
                {deriveCloudBackfillLabel(connection) ? (
                  <span className="asset-card-date">
                    {`${t.simpleMode.connections.streamLookback}: ${deriveCloudBackfillLabel(connection)}`}
                  </span>
                ) : null}
              </div>
              <div className="asset-card-actions">
                {activeConnectionId === connection.id ? (
                  <button
                    type="button"
                    className="card-action-delete"
                    title={t.simpleMode.connections.stopLiveTail}
                    onClick={(event) => {
                      event.stopPropagation();
                      void onStopTail();
                    }}
                  >
                    <Square size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="card-action-delete"
                    title={t.simpleMode.connections.startLiveTail}
                    onClick={(event) => {
                      event.stopPropagation();
                      void onStartTail(connection);
                    }}
                    disabled={activeSessionId !== null}
                  >
                    <Play size={14} />
                  </button>
                )}
                <button
                  type="button"
                  className="card-action-btn"
                  title={t.simpleMode.connections.editConnectionAction}
                  onClick={(event) => {
                    event.stopPropagation();
                    onEditConnection(connection);
                  }}
                  disabled={saving}
                >
                  <Pencil size={14} />
                  {t.simpleMode.connections.editConnection}
                </button>
                <button
                  type="button"
                  className="card-action-btn"
                  title={t.simpleMode.connections.testPersistentConnection}
                  onClick={(event) => {
                    event.stopPropagation();
                    void onTestConnection(connection);
                  }}
                  disabled={activeSessionId !== null || testStatusById[connection.id] === "testing"}
                >
                  {t.simpleMode.connections.testConnection}
                </button>
                <button
                  type="button"
                  className="card-action-delete"
                  title={t.simpleMode.connections.deleteConnection}
                  onClick={(event) => {
                    event.stopPropagation();
                    void onDeleteConnection(connection.id);
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {activeSessionId ? (
        <div className="form-notice">
          <strong>{t.simpleMode.connections.liveTail}</strong>
          <span>{tailStatus ?? t.simpleMode.connections.connected}</span>
          {tailPreview.length > 0 ? <pre>{tailPreview.join("\n")}</pre> : null}
        </div>
      ) : null}

      <button
        type="button"
        className="control-button"
        onClick={() => void onRefreshConnections()}
        disabled={loading || saving}
        title={t.simpleMode.connections.refreshConnections}
      >
        <RefreshCw size={16} />
      </button>
    </section>
  );
}
