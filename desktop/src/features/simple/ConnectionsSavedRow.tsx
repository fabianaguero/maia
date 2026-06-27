import { Cable, Pencil, Play, Square, Trash2 } from "lucide-react";

import { useT } from "../../i18n/I18nContext";
import type { ConnectionsSavedListRowViewModel } from "./connectionsSavedListViewModel";

interface ConnectionsSavedRowProps {
  row: ConnectionsSavedListRowViewModel;
  onSelectConnection: (connection: ConnectionsSavedListRowViewModel["connection"]) => void;
  onStartTail: (connection: ConnectionsSavedListRowViewModel["connection"]) => void | Promise<void>;
  onStopTail: () => void | Promise<void>;
  onEditConnection: (connection: ConnectionsSavedListRowViewModel["connection"]) => void;
  onTestConnection: (connection: ConnectionsSavedListRowViewModel["connection"]) => void | Promise<void>;
  onDeleteConnection: (connectionId: string) => void | Promise<void>;
}

function resolveStatusChipClass(row: ConnectionsSavedListRowViewModel): string {
  if (row.testTone === "success") {
    return "connections-saved-row__chip connections-saved-row__chip--success";
  }
  if (row.testTone === "error") {
    return "connections-saved-row__chip connections-saved-row__chip--error";
  }
  return "connections-saved-row__chip connections-saved-row__chip--testing";
}

export function ConnectionsSavedRow({
  row,
  onSelectConnection,
  onStartTail,
  onStopTail,
  onEditConnection,
  onTestConnection,
  onDeleteConnection,
}: ConnectionsSavedRowProps) {
  const t = useT();

  return (
    <li
      className={`connections-saved-row ${row.isSelected ? "selected" : ""}`}
      onClick={() => onSelectConnection(row.connection)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelectConnection(row.connection);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={row.rowActionTitle}
    >
      <div className="connections-saved-row__glyph">
        <Cable size={18} />
      </div>

      <div className="connections-saved-row__body">
        <div className="connections-saved-row__top">
          <strong className="connections-saved-row__title">{row.label}</strong>
          <div className="connections-saved-row__chips">
            <span className="connections-saved-row__chip connections-saved-row__chip--kind">
              {row.kindLabel}
            </span>
            <span
              className={`connections-saved-row__chip ${row.enabledTone === "enabled" ? "connections-saved-row__chip--enabled" : "connections-saved-row__chip--disabled"}`}
            >
              {row.enabledLabel}
            </span>
          </div>
        </div>

        <div className="connections-saved-row__meta">
          {row.metaChips.map((chip) => (
            <span
              key={chip.key}
              className={`connections-saved-row__meta-chip${
                chip.tone === "live" ? " connections-saved-row__meta-chip--live" : ""
              }`}
            >
              {chip.label}
            </span>
          ))}
        </div>

        {row.testLabel ? (
          <div className="connections-saved-row__probe">
            <span className={resolveStatusChipClass(row)}>{row.testLabel}</span>
            {row.testMessage ? (
              <span className="connections-saved-row__probe-text">{row.testMessage}</span>
            ) : null}
          </div>
        ) : null}

        <span className="connections-saved-row__uri" title={row.sourceUri}>
          {row.sourceUri}
        </span>
      </div>

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
    </li>
  );
}
