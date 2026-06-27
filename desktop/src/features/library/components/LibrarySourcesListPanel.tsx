import { FolderOpen, Trash2 } from "lucide-react";

import { useT } from "../../../i18n/I18nContext";
import type { RepositoryAnalysis } from "../../../types/library";
import { buildLibrarySourcesViewModel } from "../librarySourcesViewModel";

interface LibrarySourcesListPanelProps {
  newlyImportedId?: string | null;
  repositories: RepositoryAnalysis[];
  selectedRepositoryId: string | null;
  onDeleteRepository: (repositoryId: string) => Promise<boolean>;
  onInspectRepository: (repositoryId: string) => void;
  onReanalyzeRepository: (repositoryId: string) => Promise<boolean>;
  onSelectRepository: (repositoryId: string) => void;
}

export function LibrarySourcesListPanel({
  newlyImportedId,
  repositories,
  selectedRepositoryId,
  onDeleteRepository,
  onInspectRepository,
  onReanalyzeRepository,
  onSelectRepository,
}: LibrarySourcesListPanelProps) {
  const t = useT();
  const viewModel = buildLibrarySourcesViewModel({
    newlyImportedId,
    repositories,
    selectedRepositoryId,
    t,
  });

  return (
    <ul className="asset-card-list">
      {viewModel.map((repository) => (
        <li
          key={repository.id}
          className={`asset-card${repository.isSelected ? " selected" : ""}${repository.isNewlyImported ? " just-imported" : ""}`}
          onClick={() => onSelectRepository(repository.id)}
        >
          <div className="asset-card-icon source-icon">
            <FolderOpen size={18} />
          </div>
          <div className="asset-card-body">
            <strong className="asset-card-title">{repository.title}</strong>
            <div className="asset-card-meta">{repository.meta}</div>
            <span className="asset-card-date">{repository.importedAtLabel}</span>
          </div>
          <div className="asset-card-actions">
            <button
              type="button"
              className="card-action-btn"
              onClick={(event) => {
                event.stopPropagation();
                repository.shouldAnalyze
                  ? void onReanalyzeRepository(repository.id)
                  : onInspectRepository(repository.id);
              }}
            >
              {repository.actionLabel}
            </button>
            <button
              type="button"
              className="card-action-delete"
              title={t.library.deleteRepository}
              onClick={(event) => {
                event.stopPropagation();
                void onDeleteRepository(repository.id);
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
