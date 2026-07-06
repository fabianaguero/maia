import { FolderOpen } from "lucide-react";

import type { AppTranslations } from "../../i18n/types";
import type { ImportRepositoryInput, RepositoryAnalysis } from "../../types/library";
import { buildSimpleModeImportRepositoryInput } from "./simpleModeLibraryRuntime";
import { SimpleLibraryRepositoryList } from "./SimpleLibraryRepositoryList";

interface SimpleLibraryRepositoriesSectionProps {
  repositories: RepositoryAnalysis[];
  selectedRepositoryId: string | null;
  selectedTrackId: string | null;
  baseAssetCount: number;
  t: AppTranslations;
  onImportRepository: (input: ImportRepositoryInput) => Promise<boolean>;
  onSelectRepository: (repositoryId: string) => void;
  onStartMonitoring?: (repoId: string, trackId?: string) => void;
}

export function SimpleLibraryRepositoriesSection({
  repositories,
  selectedRepositoryId,
  selectedTrackId,
  baseAssetCount,
  t,
  onImportRepository,
  onSelectRepository,
  onStartMonitoring,
}: SimpleLibraryRepositoriesSectionProps) {
  return (
    <section className="simple-library-section">
      <h3 className="simple-section-title">
        <FolderOpen size={18} />
        {t.simpleMode.library.yourLogs} ({repositories.length})
      </h3>
      {repositories.length === 0 ? (
        <div className="simple-empty-state">
          <p>{t.simpleMode.library.noLogsYet}</p>
          <button
            className="simple-import-btn"
            onClick={() => {
              const path = prompt(t.simpleMode.library.enterLogPath);
              if (path) {
                void onImportRepository(
                  buildSimpleModeImportRepositoryInput(
                    path,
                    t.simpleMode.library.logSourceFallback,
                  ),
                );
              }
            }}
          >
            <FolderOpen size={16} />
            {t.simpleMode.library.importFirstLog}
          </button>
        </div>
      ) : (
        <SimpleLibraryRepositoryList
          repositories={repositories}
          selectedRepositoryId={selectedRepositoryId}
          baseAssetCount={baseAssetCount}
          selectedTrackId={selectedTrackId}
          t={t}
          onSelectRepository={onSelectRepository}
          onStartMonitoring={onStartMonitoring}
        />
      )}
    </section>
  );
}
