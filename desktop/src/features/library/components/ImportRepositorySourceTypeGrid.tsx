import { FolderOpen, GitBranch, Globe, ScrollText } from "lucide-react";

import type { RepositorySourceKind } from "../../../types/library";

interface ImportRepositorySourceModeOption {
  id: RepositorySourceKind;
  label: string;
  help: string;
  icon: typeof FolderOpen;
}

interface ImportRepositorySourceTypeGridProps {
  importTypeAria: string;
  importModes: ImportRepositorySourceModeOption[];
  sourceKind: RepositorySourceKind;
  isGcpCloudRun: boolean;
  gcpCloudRunLabel: string;
  gcpCloudRunHelp: string;
  onSelectSourceKind: (kind: RepositorySourceKind) => void;
  onSelectGcpCloudRun: () => void;
}

export function ImportRepositorySourceTypeGrid({
  importTypeAria,
  importModes,
  sourceKind,
  isGcpCloudRun,
  gcpCloudRunLabel,
  gcpCloudRunHelp,
  onSelectSourceKind,
  onSelectGcpCloudRun,
}: ImportRepositorySourceTypeGridProps) {
  return (
    <div className="source-card-grid" role="tablist" aria-label={importTypeAria}>
      {importModes.map((mode) => {
        const Icon = mode.icon;
        const active = mode.id === sourceKind;
        return (
          <button
            key={mode.id}
            type="button"
            className={`source-card ${active ? "active" : ""}`}
            onClick={() => onSelectSourceKind(mode.id)}
          >
            <div className="source-card-icon">
              <Icon size={24} />
            </div>
            <div className="source-card-content">
              <strong>{mode.label}</strong>
              <p>{mode.help}</p>
            </div>
          </button>
        );
      })}
      <button
        type="button"
        className={`source-card ${isGcpCloudRun ? "active" : ""}`}
        onClick={onSelectGcpCloudRun}
      >
        <div className="source-card-icon">
          <Globe size={24} />
        </div>
        <div className="source-card-content">
          <strong>{gcpCloudRunLabel}</strong>
          <p>{gcpCloudRunHelp}</p>
        </div>
      </button>
    </div>
  );
}
