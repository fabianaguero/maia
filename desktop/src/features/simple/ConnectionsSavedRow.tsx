import { Cable } from "lucide-react";

import { ConnectionsSavedRowActions } from "./ConnectionsSavedRowActions";
import { ConnectionsSavedRowBody } from "./ConnectionsSavedRowBody";
import { useT } from "../../i18n/I18nContext";
import type { ConnectionsSavedListRowViewModel } from "./connectionsSavedListViewModel";

interface ConnectionsSavedRowProps {
  row: ConnectionsSavedListRowViewModel;
  onSelectConnection: (connection: ConnectionsSavedListRowViewModel["connection"]) => void;
  onStartTail: (connection: ConnectionsSavedListRowViewModel["connection"]) => void | Promise<void>;
  onStopTail: () => void | Promise<void>;
  onEditConnection: (connection: ConnectionsSavedListRowViewModel["connection"]) => void;
  onTestConnection: (
    connection: ConnectionsSavedListRowViewModel["connection"],
  ) => void | Promise<void>;
  onDeleteConnection: (connectionId: string) => void | Promise<void>;
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

      <ConnectionsSavedRowBody row={row} />
      <ConnectionsSavedRowActions
        row={row}
        t={t}
        onStartTail={onStartTail}
        onStopTail={onStopTail}
        onEditConnection={onEditConnection}
        onTestConnection={onTestConnection}
        onDeleteConnection={onDeleteConnection}
      />
    </li>
  );
}
