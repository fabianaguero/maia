import { useT } from "../../i18n/I18nContext";
import type { LibraryTrack, RepositoryAnalysis, BaseAssetRecord, ImportRepositoryInput, ImportBaseAssetInput } from "../../types/library";
import { useUnifiedLibraryState } from "./useUnifiedLibraryState";
import { FolderOpen, Zap, Play } from "lucide-react";

interface SimpleModeLibraryViewProps {
  tracks: LibraryTrack[];
  repositories: RepositoryAnalysis[];
  baseAssets: BaseAssetRecord[];
  selectedRepositoryId: string | null;
  onSelectRepository: (repositoryId: string) => void;
  onImportRepository: (input: ImportRepositoryInput) => Promise<boolean>;
  onImportBaseAsset: (input: ImportBaseAssetInput) => Promise<boolean>;
  onStartMonitoring?: (repoId: string) => void;
}

export function SimpleModeLibraryView({
  tracks,
  repositories,
  baseAssets,
  selectedRepositoryId,
  onSelectRepository,
  onImportRepository,
  onImportBaseAsset,
  onStartMonitoring,
}: SimpleModeLibraryViewProps) {
  const t = useT();

  // Use unified state management (behavior-agnostic)
  const adapter = useUnifiedLibraryState({
    tracks,
    repositories,
    baseAssets,
    selectedRepositoryId,
    onSelectRepository,
    onImportRepository,
    onImportBaseAsset,
    onStartMonitoring,
  });

  return (
    <div className="simple-library-view">
      <div className="simple-library-header">
        <h2>{t.simpleMode.nav.files}</h2>
        <p>Select a log source and start monitoring</p>
      </div>

      <section className="simple-library-section">
        <h3 className="simple-section-title">
          <FolderOpen size={18} />
          Your logs ({adapter.repositories.length})
        </h3>
        {adapter.repositories.length === 0 ? (
          <div className="simple-empty-state">
            <p>No logs imported yet. Use the import button to add your first log file or folder.</p>
          </div>
        ) : (
          <div className="simple-repo-list">
            {adapter.repositories.map((repo) => {
              const isSelected = repo.id === adapter.selectedRepositoryId;
              return (
                <div
                  key={repo.id}
                  className={`simple-repo-item ${isSelected ? "selected" : ""}`}
                >
                  <button
                    className="simple-repo-button"
                    onClick={() => adapter.onSelectRepository(repo.id)}
                  >
                    <div className="simple-repo-header">
                      <span className="simple-repo-title">{repo.title}</span>
                      <span className="simple-repo-type">
                        {repo.sourceKind === "file" ? "Log file" : "Folder"}
                      </span>
                    </div>
                    <p className="simple-repo-path">{repo.sourcePath}</p>
                  </button>
                  {isSelected && adapter.baseAssets.length > 0 && (
                    <button
                      className="simple-start-btn"
                      onClick={() => adapter.onStartMonitoring?.(repo.id)}
                    >
                      <Play size={16} />
                      Start monitoring
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {adapter.baseAssets.length > 0 && (
        <section className="simple-library-section">
          <h3 className="simple-section-title">
            <Zap size={18} />
            Sound presets ({adapter.baseAssets.length})
          </h3>
          <div className="simple-assets-grid">
            {adapter.baseAssets.map((asset) => (
              <div key={asset.id} className="simple-asset-card">
                <span className="simple-asset-name">{asset.title}</span>
                <p className="simple-asset-desc">{asset.categoryId || "Preset"}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
