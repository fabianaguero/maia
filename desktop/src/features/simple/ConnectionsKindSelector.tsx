import { Globe, ScrollText } from "lucide-react";

import type { ConnectionsFormViewModel } from "./connectionsFormViewModelRuntime";
import type { ConnectionKind } from "./connectionsViewModel";

interface ConnectionsKindSelectorProps {
  ariaLabel: string;
  options: ConnectionsFormViewModel["kindOptions"];
  onKindChange: (kind: ConnectionKind) => void;
}

export function ConnectionsKindSelector({
  ariaLabel,
  options,
  onKindChange,
}: ConnectionsKindSelectorProps) {
  return (
    <div className="source-card-grid" role="tablist" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`source-card ${option.isActive ? "active" : ""}`}
          onClick={() => onKindChange(option.id)}
        >
          <div className="source-card-icon">
            {option.id === "file_log" ? <ScrollText size={24} /> : <Globe size={24} />}
          </div>
          <div className="source-card-content">
            <strong>{option.label}</strong>
            <p>{option.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
