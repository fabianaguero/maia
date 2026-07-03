import { Eye, FolderOpen, RefreshCw, ScrollText, Trash2 } from "lucide-react";

import type { AppTranslations } from "../../i18n/en";
import type { RepositoryAnalysis } from "../../types/library";
import { formatShortDate } from "../../utils/date";
import { formatBpmLabel } from "../../utils/monitorLabels";
import { buildProLibraryStatusBadge } from "./proLibraryScreenRuntime";

interface ProLibrarySourcesSectionProps {
  repositories: RepositoryAnalysis[];
  selectedSource: string | null;
  t: AppTranslations;
  onSelectSource: (sourceId: string) => void;
}

export function ProLibrarySourcesSection({
  repositories,
  selectedSource,
  t,
  onSelectSource,
}: ProLibrarySourcesSectionProps) {
  return (
    <div className="sources-section">
      <div className="section-header">
        <div>
          <h2 className="section-title">{t.library.logSources}</h2>
          <p className="section-subtitle">{t.library.toolbarSourcesNote}</p>
        </div>
        <div className="action-buttons">
          <button className="btn-primary">
            <FolderOpen size={16} />
            {t.library.importRepository}
          </button>
        </div>
      </div>

      <div className="sources-list">
        {repositories.map((source) => (
          <div
            key={source.id}
            className={`source-item ${selectedSource === source.id ? "selected" : ""}`}
            onClick={() => onSelectSource(source.id)}
          >
            <div className="source-icon">
              {source.sourceKind === "file" ? (
                <ScrollText size={16} className="text-cyan-400" />
              ) : (
                <FolderOpen size={16} className="text-cyan-400" />
              )}
            </div>

            <div className="source-info">
              <div className="source-header">
                <span className="source-name">{source.title}</span>
                {buildProLibraryStatusBadge(source.suggestedBpm ? "ready" : "pending", t)}
              </div>
              <code className="source-path">{source.sourcePath}</code>
              <span className="source-date">
                {formatShortDate(source.importedAt)}
                {source.suggestedBpm ? ` · ${formatBpmLabel(source.suggestedBpm)}` : ""}
              </span>
            </div>

            <div className="source-actions">
              <button className="btn-ghost" title={t.simpleMode.common.inspect}>
                <Eye size={14} />
              </button>
              <button className="btn-ghost" title={t.library.analyze}>
                <RefreshCw size={14} />
              </button>
              <button className="btn-ghost btn-danger" title={t.library.deleteRepository}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
