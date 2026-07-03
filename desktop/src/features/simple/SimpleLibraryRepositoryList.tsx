import { Activity, FileText, Folder, Play } from "lucide-react";

import type { AppTranslations } from "../../i18n/en";
import type { RepositoryAnalysis } from "../../types/library";
import { shouldShowSimpleModeStartButton } from "./simpleModeLibraryRuntime";

interface SimpleLibraryRepositoryListProps {
  repositories: RepositoryAnalysis[];
  selectedRepositoryId: string | null;
  baseAssetCount: number;
  selectedTrackId: string | null;
  t: AppTranslations;
  onSelectRepository: (repositoryId: string) => void;
  onStartMonitoring?: (repoId: string, trackId?: string) => void;
}

export function SimpleLibraryRepositoryList({
  repositories,
  selectedRepositoryId,
  baseAssetCount,
  selectedTrackId,
  t,
  onSelectRepository,
  onStartMonitoring,
}: SimpleLibraryRepositoryListProps) {
  return (
    <div className="simple-repo-list">
      {repositories.map((repo) => {
        const isSelected = repo.id === selectedRepositoryId;
        const SourceIcon =
          repo.sourceKind === "directory"
            ? Folder
            : repo.sourceKind === "file"
              ? FileText
              : Activity;

        return (
          <div key={repo.id} className={`simple-repo-item ${isSelected ? "selected" : ""}`}>
            <button className="simple-repo-button" onClick={() => onSelectRepository(repo.id)}>
              <div className="simple-repo-header">
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <SourceIcon
                    size={18}
                    style={{ color: isSelected ? "var(--color-accent)" : "#94a3b8" }}
                  />
                  <span className="simple-repo-title">{repo.title}</span>
                </div>
                <span className="simple-repo-type">
                  {repo.sourceKind === "file"
                    ? t.simpleMode.library.sourceLogFile
                    : repo.sourceKind === "directory"
                      ? t.simpleMode.library.sourceFolder
                      : t.simpleMode.library.sourceLiveStream}
                </span>
              </div>
              <p className="simple-repo-path">{repo.sourcePath}</p>
            </button>
            {shouldShowSimpleModeStartButton(repo.id, selectedRepositoryId, baseAssetCount) ? (
              <button
                className="simple-start-btn"
                onClick={() => onStartMonitoring?.(repo.id, selectedTrackId ?? undefined)}
              >
                <Play size={16} />
                {t.simpleMode.library.startMonitoring}
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
