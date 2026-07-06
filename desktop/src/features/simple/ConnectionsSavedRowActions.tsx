import { Pencil, Play, Square, Trash2 } from "lucide-react";

import type { AppTranslations } from "../../i18n/types";
import type { ConnectionsSavedListRowViewModel } from "./connectionsSavedListViewModel";

interface ConnectionsSavedRowActionsProps {
  row: ConnectionsSavedListRowViewModel;
  t: AppTranslations;
  onStartTail: (connection: ConnectionsSavedListRowViewModel["connection"]) => void | Promise<void>;
  onStopTail: () => void | Promise<void>;
  onEditConnection: (connection: ConnectionsSavedListRowViewModel["connection"]) => void;
  onTestConnection: (
    connection: ConnectionsSavedListRowViewModel["connection"],
  ) => void | Promise<void>;
  onDeleteConnection: (connectionId: string) => void | Promise<void>;
}

export function ConnectionsSavedRowActions({
  row,
  t,
  onStartTail,
  onStopTail,
  onEditConnection,
  onTestConnection,
  onDeleteConnection,
}: ConnectionsSavedRowActionsProps) {
  return (
    <div className="connections-saved-row__actions">
      {row.isActive ? (
        <button
          type="button"
          className="connections-saved-row__action connections-saved-row__action--icon danger"
          aria-label={row.stopActionTitle}
          title={row.stopActionTitle}
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
          className="connections-saved-row__action connections-saved-row__action--icon"
          aria-label={row.startActionTitle}
          title={row.startActionTitle}
          onClick={(event) => {
            event.stopPropagation();
            void onStartTail(row.connection);
          }}
          disabled={row.disableStartAction}
        >
          <Play size={14} />
        </button>
      )}
      <button
        type="button"
        className="connections-saved-row__action"
        aria-label={row.editActionTitle}
        title={row.editActionTitle}
        onClick={(event) => {
          event.stopPropagation();
          onEditConnection(row.connection);
        }}
        disabled={row.disableEditAction}
      >
        <Pencil size={14} />
        {t.simpleMode.connections.editConnection}
      </button>
      <button
        type="button"
        className="connections-saved-row__action"
        aria-label={row.testActionTitle}
        title={row.testActionTitle}
        onClick={(event) => {
          event.stopPropagation();
          void onTestConnection(row.connection);
        }}
        disabled={row.disableTestAction}
      >
        {t.simpleMode.connections.testConnection}
      </button>
      <button
        type="button"
        className="connections-saved-row__action connections-saved-row__action--icon danger"
        aria-label={row.deleteActionTitle}
        title={row.deleteActionTitle}
        onClick={(event) => {
          event.stopPropagation();
          void onDeleteConnection(row.connection.id);
        }}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
