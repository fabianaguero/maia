import { useT } from "../../i18n/I18nContext";
import type { LibraryTrack, RepositoryAnalysis, BaseAssetRecord } from "../../types/library";
import { Music, FolderOpen, Zap, Play } from "lucide-react";

interface SimpleModeLibraryViewProps {
  tracks: LibraryTrack[];
  repositories: RepositoryAnalysis[];
  baseAssets: BaseAssetRecord[];
  selectedRepositoryId: string | null;
  onSelectRepository: (repositoryId: string) => void;
  onStartMonitoring: (repoId: string) => void;
}

export function SimpleModeLibraryView({
  tracks,
  repositories,
  baseAssets,
  selectedRepositoryId,
  onSelectRepository,
  onStartMonitoring,
}: SimpleModeLibraryViewProps) {
  const t = useT();

  return (
    <div className="simple-library-view">
      <div className="simple-library-header">
        <h2>{t.simpleMode.nav.files}</h2>
        <p>Select a log source and start monitoring</p>
      </div>

      <section className="simple-library-section">
        <h3 className="simple-section-title">
          <FolderOpen size={18} />
          Your logs ({repositories.length})
        </h3>
        {repositories.length === 0 ? (
          <div className="simple-empty-state">
            <p>No logs imported yet. Use the import button to add your first log file or folder.</p>
          </div>
        ) : (
          <div className="simple-repo-list">
            {repositories.map((repo) => {
              const isSelected = repo.id === selectedRepositoryId;
              return (
                <div
                  key={repo.id}
                  className={`simple-repo-item ${isSelected ? "selected" : ""}`}
                >
                  <button
                    className="simple-repo-button"
                    onClick={() => onSelectRepository(repo.id)}
                  >
                    <div className="simple-repo-header">
                      <span className="simple-repo-title">{repo.title}</span>
                      <span className="simple-repo-type">
                        {repo.sourceKind === "file" ? "Log file" : "Folder"}
                      </span>
                    </div>
                    <p className="simple-repo-path">{repo.sourcePath}</p>
                  </button>
                  {isSelected && baseAssets.length > 0 && (
                    <button
                      className="simple-start-btn"
                      onClick={() => onStartMonitoring(repo.id)}
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

      {baseAssets.length > 0 && (
        <section className="simple-library-section">
          <h3 className="simple-section-title">
            <Zap size={18} />
            Sound presets ({baseAssets.length})
          </h3>
          <div className="simple-assets-grid">
            {baseAssets.map((asset) => (
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
