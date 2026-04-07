import { AudioWaveform, FolderOpen, Music, PackagePlus, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useT } from "../../i18n/I18nContext";
import type { BootstrapManifest } from "../../contracts";
import type { BaseAssetCategoryOption } from "../../types/baseAsset";
import type { MusicStyleOption } from "../../types/music";
import type {
  BaseAssetRecord,
  CompositionResultRecord,
  ImportBaseAssetInput,
  ImportCompositionInput,
  ImportRepositoryInput,
  ImportTrackInput,
  LibraryTrack,
  RepositoryAnalysis,
} from "../../types/library";
import { formatShortDate } from "../../utils/date";
import { ImportBaseAssetForm } from "./components/ImportBaseAssetForm";
import { ImportRepositoryForm } from "./components/ImportRepositoryForm";
import { ImportTrackForm } from "./components/ImportTrackForm";

type LibraryTab = "tracks" | "sources" | "bases";

interface LibraryScreenProps {
  tracks: LibraryTrack[];
  repositories: RepositoryAnalysis[];
  baseAssets: BaseAssetRecord[];
  compositions: CompositionResultRecord[];
  newlyImportedId?: string | null;
  selectedTrackId: string | null;
  selectedRepositoryId: string | null;
  selectedBaseAssetId: string | null;
  selectedCompositionId: string | null;
  manifest: BootstrapManifest | null;
  musicStyles: MusicStyleOption[];
  baseAssetCategories: BaseAssetCategoryOption[];
  defaultTrackMusicStyleId?: string;
  defaultBaseAssetCategoryId?: string;
  trackLoading: boolean;
  repositoryLoading: boolean;
  baseAssetLoading: boolean;
  compositionLoading: boolean;
  trackBusy: boolean;
  repositoryBusy: boolean;
  baseAssetBusy: boolean;
  compositionBusy: boolean;
  trackError: string | null;
  repositoryError: string | null;
  baseAssetError: string | null;
  compositionError: string | null;
  onImportTrack: (input: ImportTrackInput) => Promise<boolean>;
  onImportRepository: (input: ImportRepositoryInput) => Promise<boolean>;
  onImportBaseAsset: (input: ImportBaseAssetInput) => Promise<boolean>;
  onImportComposition: (input: ImportCompositionInput) => Promise<boolean>;
  onReanalyzeTrack: (trackId: string) => Promise<boolean>;
  onReanalyzeRepository: (repositoryId: string) => Promise<boolean>;
  onDeleteTrack: (trackId: string) => Promise<boolean>;
  onDeleteRepository: (repositoryId: string) => Promise<boolean>;
  onSeedDemo: () => Promise<void>;
  onSelectTrack: (trackId: string) => void;
  onSelectRepository: (repositoryId: string) => void;
  onSelectBaseAsset: (baseAssetId: string) => void;
  onSelectComposition: (compositionId: string) => void;
  onInspectTrack: (trackId: string) => void;
  onInspectRepository: (repositoryId: string) => void;
  onInspectBaseAsset: (baseAssetId: string) => void;
  onInspectComposition: (compositionId: string) => void;
}

const SOURCE_KIND_LABEL: Record<string, string> = {
  directory: "Directory",
  file: "Log file",
  url: "GitHub URL",
};

export function LibraryScreen({
  tracks,
  repositories,
  baseAssets,
  newlyImportedId,
  selectedTrackId,
  selectedRepositoryId,
  selectedBaseAssetId,
  manifest,
  musicStyles,
  baseAssetCategories,
  defaultTrackMusicStyleId,
  defaultBaseAssetCategoryId,
  trackLoading,
  repositoryLoading,
  baseAssetLoading,
  trackBusy,
  repositoryBusy,
  baseAssetBusy,
  trackError,
  repositoryError,
  baseAssetError,
  onImportTrack,
  onImportRepository,
  onImportBaseAsset,
  onReanalyzeTrack,
  onReanalyzeRepository,
  onDeleteTrack,
  onDeleteRepository,
  onSeedDemo,
  onSelectTrack,
  onSelectRepository,
  onSelectBaseAsset,
  onInspectTrack,
  onInspectRepository,
  onInspectBaseAsset,
}: LibraryScreenProps) {
  const t = useT();
  const [tab, setTab] = useState<LibraryTab>("tracks");
  const [showForm, setShowForm] = useState(false);

  const tabs: Array<{ id: LibraryTab; label: string; count: number; icon: React.ReactNode }> = [
    { id: "tracks", label: "Tracks", count: tracks.length, icon: <Music size={14} /> },
    { id: "sources", label: "Sources", count: repositories.length, icon: <FolderOpen size={14} /> },
    { id: "bases", label: "Bases", count: baseAssets.length, icon: <PackagePlus size={14} /> },
  ];

  function handleTabChange(next: LibraryTab) {
    setTab(next);
    setShowForm(false);
  }

  function getStatusBadgeClass(status: string | null | undefined): string {
    if (status === "pending") return "status-badge--pending";
    if (status === "analyzed") return "status-badge--analyzed";
    if (status === "ready") return "status-badge--ready";
    return "status-badge--pending";
  }

  function getStatusLabel(status: string | null | undefined): string {
    if (status === "pending") return t.library.statusPending;
    if (status === "analyzed") return t.library.statusAnalyzed;
    if (status === "ready") return t.library.statusReady;
    return t.library.statusPending;
  }

  function handleQuickImportClick(targetTab: LibraryTab) {
    setTab(targetTab);
    setShowForm(true);
  }

  async function handleImportTrack(input: ImportTrackInput) {
    const ok = await onImportTrack(input);
    if (ok) setShowForm(false);
    return ok;
  }

  async function handleImportRepository(input: ImportRepositoryInput) {
    const ok = await onImportRepository(input);
    if (ok) setShowForm(false);
    return ok;
  }

  async function handleImportBaseAsset(input: ImportBaseAssetInput) {
    const ok = await onImportBaseAsset(input);
    if (ok) setShowForm(false);
    return ok;
  }

  const loading =
    (tab === "tracks" && trackLoading) ||
    (tab === "sources" && repositoryLoading) ||
    (tab === "bases" && baseAssetLoading);

  const error =
    tab === "tracks" ? trackError :
    tab === "sources" ? repositoryError :
    baseAssetError;

  return (
    <section className="screen">
      {/* Header */}
      <header className="library-header">
        <div>
          <h2>Library</h2>
          <p className="support-copy">Everything you've added lives here. Pick an item to work with it.</p>
        </div>
        <div className="library-header-actions">
          {tab === "tracks" && tracks.length > 0 && (
            <button
              type="button"
              className="action action-secondary"
              onClick={async () => {
                const orphanTracks = tracks.filter(t => !t.bpm);
                if (orphanTracks.length === 0) {
                  alert("No unanalyzed tracks to delete");
                  return;
                }
                if (!confirm(`Delete ${orphanTracks.length} unanalyzed track(s)?`)) return;
                for (const orphan of orphanTracks) {
                  await onDeleteTrack(orphan.id);
                }
              }}
              title="Delete all unanalyzed tracks"
            >
              <Trash2 size={14} /> Clean Orphans
            </button>
          )}
          {tab === "sources" && repositories.length > 0 && (
            <button
              type="button"
              className="action action-secondary"
              onClick={async () => {
                const orphanRepos = repositories.filter(r => !r.suggestedBpm);
                if (orphanRepos.length === 0) {
                  alert("No unanalyzed repositories to delete");
                  return;
                }
                if (!confirm(`Delete ${orphanRepos.length} unanalyzed repositor(y|ies)?`)) return;
                for (const orphan of orphanRepos) {
                  await onDeleteRepository(orphan.id);
                }
              }}
              title="Delete all unanalyzed repositories"
            >
              <Trash2 size={14} /> Clean Orphans
            </button>
          )}
          <button
            type="button"
            className={showForm ? "action active" : "action"}
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Add {tab === "tracks" ? "track" : tab === "sources" ? "source" : "base"}</>}
          </button>
        </div>
      </header>

      {/* Quick Import Bar */}
      <div className="library-quick-import-bar">
        <button
          type="button"
          className="library-quick-import-btn"
          onClick={() => handleQuickImportClick("tracks")}
        >
          <Music size={16} />
          {t.library.importTrack}
        </button>
        <button
          type="button"
          className="library-quick-import-btn"
          onClick={() => handleQuickImportClick("sources")}
        >
          <FolderOpen size={16} />
          {t.library.importRepository}
        </button>
        <button
          type="button"
          className="library-quick-import-btn"
          onClick={() => handleQuickImportClick("bases")}
        >
          <PackagePlus size={16} />
          {t.library.importBaseAsset}
        </button>
      </div>

      {/* Tab strip */}
      <div className="library-tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`library-tab${tab === t.id ? " active" : ""}`}
            onClick={() => handleTabChange(t.id)}
          >
            {t.icon}
            {t.label}
            <span className="library-tab-count">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Inline form (collapsed by default) */}
      {showForm && (
        <div className="library-form-drawer">
          {tab === "tracks" && (
            <ImportTrackForm
              busy={trackBusy}
              musicStyles={musicStyles}
              defaultMusicStyleId={defaultTrackMusicStyleId}
              onImportTrack={handleImportTrack}
              onSeedDemo={async () => { await onSeedDemo(); setShowForm(false); }}
            />
          )}
          {tab === "sources" && (
            <ImportRepositoryForm
              busy={repositoryBusy}
              defaultDirectoryPath={manifest?.repoRoot}
              onImportRepository={handleImportRepository}
            />
          )}
          {tab === "bases" && (
            <ImportBaseAssetForm
              busy={baseAssetBusy}
              baseAssetCategories={baseAssetCategories}
              defaultCategoryId={defaultBaseAssetCategoryId}
              onImportBaseAsset={handleImportBaseAsset}
            />
          )}
        </div>
      )}

      {error && <p className="inline-error">{error}</p>}

      {/* Content */}
      {loading ? (
        <div className="placeholder-loading">
          <span className="spin-ring" aria-hidden="true" />
          Loading…
        </div>
      ) : (
        <>
          {/* TRACKS */}
          {tab === "tracks" && (
            tracks.length === 0 ? (
              <EmptyState
                icon={<Music size={32} />}
                title="No tracks yet"
                body="Add an audio file (WAV, MP3, FLAC…) to get started."
                action={<button type="button" className="action" onClick={() => setShowForm(true)}><Plus size={14} /> Add track</button>}
              />
            ) : (
              <ul className="asset-card-list">
                {tracks.map((track) => (
                  <li
                    key={track.id}
                    className={`asset-card${track.id === selectedTrackId ? " selected" : ""}${track.id === newlyImportedId ? " just-imported" : ""}`}
                    onClick={() => onSelectTrack(track.id)}
                  >
                    <div className="asset-card-icon track-icon">
                      <AudioWaveform size={18} />
                    </div>
                    <div className="asset-card-body">
                      <strong className="asset-card-title">{track.title}</strong>
                      <div className="asset-card-meta">
                        {track.bpm ? (
                          <span className="bpm-badge">{Math.round(track.bpm)} BPM</span>
                        ) : (
                          <span className="bpm-badge pending">-</span>
                        )}
                        {track.durationSeconds ? ` · ${Math.round(track.durationSeconds / 60)}m${Math.round(track.durationSeconds % 60)}s` : ""}
                        {" · "}{track.musicStyleLabel}
                        {" · "}{track.fileExtension}
                      </div>
                      <span className="asset-card-date">{formatShortDate(track.importedAt)}</span>
                    </div>
                    <div className="asset-card-actions">
                      <button
                        type="button"
                        className="card-action-btn"
                        onClick={(e) => { e.stopPropagation(); !track.bpm ? void onReanalyzeTrack(track.id) : onInspectTrack(track.id); }}
                      >
                        {!track.bpm ? "Analyze" : "View"}
                      </button>
                      <button
                        type="button"
                        className="card-action-delete"
                        title="Delete track"
                        onClick={(e) => { e.stopPropagation(); onDeleteTrack(track.id); }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )
          )}

          {/* SOURCES */}
          {tab === "sources" && (
            repositories.length === 0 ? (
              <EmptyState
                icon={<FolderOpen size={32} />}
                title="No sources yet"
                body="Add a log file, code directory, or GitHub URL to use as a signal source."
                action={<button type="button" className="action" onClick={() => setShowForm(true)}><Plus size={14} /> Add source</button>}
              />
            ) : (
              <ul className="asset-card-list">
                {repositories.map((repo) => (
                  <li
                    key={repo.id}
                    className={`asset-card${repo.id === selectedRepositoryId ? " selected" : ""}${repo.id === newlyImportedId ? " just-imported" : ""}`}
                    onClick={() => onSelectRepository(repo.id)}
                  >
                    <div className="asset-card-icon source-icon">
                      <FolderOpen size={18} />
                    </div>
                    <div className="asset-card-body">
                      <strong className="asset-card-title">{repo.title}</strong>
                      <div className="asset-card-meta">
                        <span className="type-badge">{SOURCE_KIND_LABEL[repo.sourceKind] ?? repo.sourceKind}</span>
                        {repo.suggestedBpm ? (
                          <span className="bpm-badge">{Math.round(repo.suggestedBpm)} BPM</span>
                        ) : (
                          <span className="bpm-badge pending">-</span>
                        )}
                        {repo.primaryLanguage ? ` · ${repo.primaryLanguage}` : ""}
                      </div>
                      <span className="asset-card-date">{formatShortDate(repo.importedAt)}</span>
                    </div>
                    <div className="asset-card-actions">
                      <button
                        type="button"
                        className="card-action-btn"
                        onClick={(e) => { e.stopPropagation(); !repo.suggestedBpm ? void onReanalyzeRepository(repo.id) : onInspectRepository(repo.id); }}
                      >
                        {!repo.suggestedBpm ? "Analyze" : "View"}
                      </button>
                      <button
                        type="button"
                        className="card-action-delete"
                        title="Delete repository"
                        onClick={(e) => { e.stopPropagation(); onDeleteRepository(repo.id); }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )
          )}

          {/* BASES */}
          {tab === "bases" && (
            baseAssets.length === 0 ? (
              <EmptyState
                icon={<PackagePlus size={32} />}
                title="No base packs yet"
                body="Add a sample pack or folder to use as raw material in compositions."
                action={<button type="button" className="action" onClick={() => setShowForm(true)}><Plus size={14} /> Add base</button>}
              />
            ) : (
              <ul className="asset-card-list">
                {baseAssets.map((asset) => (
                  <li
                    key={asset.id}
                    className={`asset-card${asset.id === selectedBaseAssetId ? " selected" : ""}${asset.id === newlyImportedId ? " just-imported" : ""}`}
                    onClick={() => onSelectBaseAsset(asset.id)}
                  >
                    <div className="asset-card-icon base-icon">
                      <PackagePlus size={18} />
                    </div>
                    <div className="asset-card-body">
                      <strong className="asset-card-title">{asset.title}</strong>
                      <div className="asset-card-meta">
                        <span className="type-badge">{asset.categoryLabel}</span>
                        <span className={`status-badge ${getStatusBadgeClass(asset.analyzerStatus)}`}>
                          {getStatusLabel(asset.analyzerStatus)}
                        </span>
                        {` · ${asset.entryCount} entries`}
                        {asset.reusable ? " · Reusable" : ""}
                      </div>
                      <span className="asset-card-date">{formatShortDate(asset.importedAt)}</span>
                    </div>
                    <div className="asset-card-actions">
                      <button
                        type="button"
                        className="card-action-btn"
                        onClick={(e) => { e.stopPropagation(); onInspectBaseAsset(asset.id); }}
                      >
                        {t.library.analyze}
                      </button>
                      {asset.analyzerStatus === "ready" && (
                        <button
                          type="button"
                          className="card-action-compose"
                          onClick={(e) => { e.stopPropagation(); onInspectBaseAsset(asset.id); }}
                        >
                          {t.library.compose} →
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )
          )}
        </>
      )}
    </section>
  );
}

function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action: React.ReactNode;
}) {
  return (
    <div className="library-empty">
      <div className="library-empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  );
}
