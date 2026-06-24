import { useT } from "../../i18n/I18nContext";
import type { LibraryTrack, RepositoryAnalysis, BaseAssetRecord, ImportRepositoryInput, ImportBaseAssetInput } from "../../types/library";
import { useUnifiedLibraryState } from "./useUnifiedLibraryState";
import { useEffect, useRef, useState } from "react";
import { FolderOpen, Zap, Play, Pause, FileText, Activity, Folder } from "lucide-react";
import { resolvePlayableTrackPath } from "../../utils/track";
import { resolvePreviewAudioUrl, revokePreviewAudioUrl } from "../../utils/audioPreview";
import { TrackWaveformMini } from "../../components/TrackWaveformMini";

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
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [previewTrackId, setPreviewTrackId] = useState<string | null>(null);

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

  const toggleTrackPreview = async (track: LibraryTrack) => {
    const playablePath = resolvePlayableTrackPath(track);
    if (!playablePath) {
      return;
    }

    if (previewTrackId === track.id && previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
      previewAudioRef.current = null;
      revokePreviewAudioUrl(previewUrlRef.current);
      previewUrlRef.current = null;
      setPreviewTrackId(null);
      return;
    }

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
      previewAudioRef.current = null;
      revokePreviewAudioUrl(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    const previewUrl = await resolvePreviewAudioUrl(playablePath);
    previewUrlRef.current = previewUrl;
    const audio = new Audio(previewUrl);
    audio.volume = 0.92;
    audio.preload = "auto";
    previewAudioRef.current = audio;
    setPreviewTrackId(track.id);
    audio.addEventListener(
      "ended",
      () => {
        if (previewAudioRef.current === audio) {
          previewAudioRef.current = null;
          revokePreviewAudioUrl(previewUrlRef.current);
          previewUrlRef.current = null;
          setPreviewTrackId(null);
        }
      },
      { once: true },
    );

    try {
      await audio.play();
    } catch (error) {
      console.warn("Library track preview failed", error);
      if (previewAudioRef.current === audio) {
        previewAudioRef.current = null;
      }
      revokePreviewAudioUrl(previewUrlRef.current);
      previewUrlRef.current = null;
      setPreviewTrackId(null);
    }
  };

  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      revokePreviewAudioUrl(previewUrlRef.current);
      previewUrlRef.current = null;
    };
  }, []);

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
                <button
                  type="button"
                  className="track-preview-button"
                  title={previewTrackId === track.id ? "Pause preview" : "Preview track"}
                  onClick={(event) => {
                    event.stopPropagation();
                    void toggleTrackPreview(track);
                  }}
                >
                  {previewTrackId === track.id ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <div className="simple-asset-wave-preview">
                  <TrackWaveformMini
                    bins={track.analysis?.waveformBins ?? null}
                    active={selectedTrackId === track.id}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
