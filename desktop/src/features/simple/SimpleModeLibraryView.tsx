import { useT } from "../../i18n/I18nContext";
import type { LibraryTrack, RepositoryAnalysis, BaseAssetRecord, ImportRepositoryInput, ImportBaseAssetInput } from "../../types/library";
import { useUnifiedLibraryState } from "./useUnifiedLibraryState";
import { FolderOpen, Zap, Play, FileText, Activity, Folder } from "lucide-react";

interface SimpleModeLibraryViewProps {
  tracks: LibraryTrack[];
  repositories: RepositoryAnalysis[];
  baseAssets: BaseAssetRecord[];
  selectedRepositoryId: string | null;
  onSelectRepository: (repositoryId: string) => void;
  onImportRepository: (input: ImportRepositoryInput) => Promise<boolean>;
  onImportBaseAsset: (input: ImportBaseAssetInput) => Promise<boolean>;
  selectedTrackId: string | null;
  onSelectTrack: (trackId: string) => void;
  onStartMonitoring?: (repoId: string, trackId?: string) => void;
}

export function SimpleModeLibraryView({
  tracks,
  repositories,
  baseAssets,
  selectedRepositoryId,
  onSelectRepository,
  onImportRepository,
  onImportBaseAsset,
  selectedTrackId,
  onSelectTrack,
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
      <div className="library-header">
        <h2 className="library-title">{t.simpleMode.nav.files}</h2>
        <p className="library-subtitle">Select a log source and start monitoring</p>
      </div>

      <section className="simple-library-section">
        <h3 className="simple-section-title">
          <FolderOpen size={18} />
          Your logs ({adapter.repositories.length})
        </h3>
        {adapter.repositories.length === 0 ? (
          <div className="simple-empty-state">
            <p>No logs imported yet. Use the import button to add your first log file or folder.</p>
            <button
              className="simple-import-btn"
              onClick={() => {
                const path = prompt("Enter log file or folder path:");
                if (path) {
                  onImportRepository({
                    title: path.split("/").pop() || "Log Source",
                    sourcePath: path,
                    sourceKind: path.includes(".") ? "file" : "directory"
                  });
                }
              }}
            >
              <FolderOpen size={16} />
              Import your first log
            </button>
          </div>
        ) : (
          <div className="simple-repo-list">
            {adapter.repositories.map((repo) => {
              const isSelected = repo.id === adapter.selectedRepositoryId;
              
              // Determine the right icon based on sourceKind
              const SourceIcon = repo.sourceKind === "directory" 
                ? Folder 
                : repo.sourceKind === "file" 
                  ? FileText 
                  : Activity;
                  
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
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <SourceIcon size={18} style={{ color: isSelected ? "var(--color-accent)" : "#94a3b8" }} />
                        <span className="simple-repo-title">{repo.title}</span>
                      </div>
                      <span className="simple-repo-type">
                        {repo.sourceKind === "file" ? "Log file" : repo.sourceKind === "directory" ? "Folder" : "Live stream"}
                      </span>
                    </div>
                    <p className="simple-repo-path">{repo.sourcePath}</p>
                  </button>
                  {isSelected && adapter.baseAssets.length > 0 && (
                    <button
                      className="simple-start-btn"
                      onClick={() => adapter.onStartMonitoring?.(repo.id, selectedTrackId ?? undefined)}
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
            {tracks.map((track) => (
              <div
                key={track.id}
                className={`simple-asset-card ${selectedTrackId === track.id ? "selected" : ""}`}
                onClick={() => onSelectTrack(track.id)}
              >
                <div className="simple-asset-info">
                  <span className="simple-asset-name">{track.tags.title}</span>
                  <p className="simple-asset-desc">{track.tags.musicStyleLabel || "Preset"}</p>
                </div>
                <div className="simple-asset-wave-preview">
                  <div className="visual-wave-mini">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div 
                        key={i} 
                        className="wave-bar-mini" 
                        style={{ 
                          height: `${[20, 50, 80, 40, 60, 30, 70, 40][i]}%`,
                          animationDelay: `${i * 0.1}s`,
                          backgroundColor: selectedTrackId === track.id ? "var(--color-accent)" : "var(--text-muted)"
                        }} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
