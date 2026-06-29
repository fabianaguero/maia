import { Cable, Trash2 } from "lucide-react";

import { useT } from "../../../i18n/I18nContext";
import type { LogSourceConnection } from "../../../types/library";
import { buildLibraryConnectionsViewModel } from "../libraryConnectionsViewModel";

interface LibraryConnectionsListPanelProps {
  connections: LogSourceConnection[];
  onDeleteConnection: (connectionId: string) => Promise<void>;
}

export function LibraryConnectionsListPanel({
  connections,
  onDeleteConnection,
}: LibraryConnectionsListPanelProps) {
  const t = useT();
  const viewModel = buildLibraryConnectionsViewModel({ connections, t });

  return (
    <ul className="asset-card-list">
      {viewModel.map((connection) => (
        <li key={connection.id} className="asset-card">
          <div className="asset-card-icon source-icon">
            <Cable size={18} />
          </div>
          <div className="asset-card-body">
            <strong className="asset-card-title">{connection.title}</strong>
            <div className="asset-card-meta">
              <span className={connection.isEnabled ? "bpm-badge" : "bpm-badge pending"}>
                {connection.meta}
              </span>
            </div>
            <span className="asset-card-date" title={connection.sourceUri}>
              {connection.sourceUri}
            </span>
            <small className="support-copy">{connection.updatedAtLabel}</small>
          </div>
          <div className="asset-card-actions">
            <button
              type="button"
              className="card-action-delete"
              title={t.library.deleteConnection}
              onClick={() => void onDeleteConnection(connection.id)}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
