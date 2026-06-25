import {
  AudioWaveform,
  Cable,
  FolderOpen,
  ListMusic,
  Music,
  PackagePlus,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useT } from "../../i18n/I18nContext";
import type { BootstrapManifest } from "../../contracts";
import type { BaseAssetCategoryOption } from "../../types/baseAsset";
import type { MusicStyleOption } from "../../types/music";
import type {
  BaseAssetRecord,
  BaseTrackPlaylist,
  CompositionResultRecord,
  ImportBaseAssetInput,
  ImportCompositionInput,
  ImportRepositoryInput,
  ImportTrackInput,
  LibraryTrack,
  LogSourceConnection,
  RepositoryAnalysis,
  SaveBaseTrackPlaylistInput,
} from "../../types/library";
import { formatShortDate } from "../../utils/date";
import { getTrackTitle } from "../../utils/track";
import { deleteLogSourceConnection, listLogSourceConnections } from "../../api/repositories";
import { ImportBaseAssetForm } from "./components/ImportBaseAssetForm";
import { ImportRepositoryForm } from "./components/ImportRepositoryForm";
import { ImportTrackForm } from "./components/ImportTrackForm";

export type LibraryTab = "tracks" | "sources" | "connections" | "bases";

interface LibraryScreenProps {
  tracks: LibraryTrack[];
  playlists: BaseTrackPlaylist[];
  repositories: RepositoryAnalysis[];
  baseAssets: BaseAssetRecord[];
  compositions: CompositionResultRecord[];
  newlyImportedId?: string | null;
  selectedTrackId: string | null;
  selectedPlaylistId: string | null;
  selectedRepositoryId: string | null;
  selectedBaseAssetId: string | null;
  selectedCompositionId: string | null;
  activeTab?: LibraryTab;
  onTabChange?: (tab: LibraryTab) => void;
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
  onRelinkTrack: (trackId: string) => Promise<boolean>;
  onRelinkMissingTracks: () => Promise<boolean>;
  onReanalyzeRepository: (repositoryId: string) => Promise<boolean>;
  onDeleteTrack: (trackId: string) => Promise<boolean>;
  onDeleteRepository: (repositoryId: string) => Promise<boolean>;
  onSeedDemo: () => Promise<void>;
  onSavePlaylist: (input: SaveBaseTrackPlaylistInput) => Promise<boolean>;
  onDeletePlaylist: (playlistId: string) => Promise<boolean>;
  onSelectTrack: (trackId: string) => void;
  onSelectPlaylist: (playlistId: string) => void;
  onSelectRepository: (repositoryId: string) => void;
  onSelectBaseAsset: (baseAssetId: string) => void;
  onSelectComposition: (compositionId: string) => void;
  onInspectTrack: (trackId: string) => void;
  onInspectRepository: (repositoryId: string) => void;
  onInspectBaseAsset: (baseAssetId: string) => void;
  onInspectComposition: (compositionId: string) => void;
}

export function LibraryScreen({
  tracks,
  playlists,
  repositories,
  baseAssets,
  newlyImportedId,
  selectedTrackId,
  selectedPlaylistId,
  selectedRepositoryId,
  selectedBaseAssetId,
  activeTab,
  onTabChange,
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
  onRelinkTrack,
  onRelinkMissingTracks,
  onReanalyzeRepository,
  onDeleteTrack,
  onDeleteRepository,
  onSeedDemo,
  onSavePlaylist,
  onDeletePlaylist,
  onSelectTrack,
  onSelectPlaylist,
  onSelectRepository,
  onSelectBaseAsset,
  onInspectTrack,
  onInspectRepository,
  onInspectBaseAsset,
}: LibraryScreenProps) {
  const t = useT();
  const [tab, setTab] = useState<LibraryTab>(activeTab ?? "tracks");
  const [logConnections, setLogConnections] = useState<LogSourceConnection[]>([]);
  const [logConnectionError, setLogConnectionError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [playlistEditorOpen, setPlaylistEditorOpen] = useState(false);
  const [playlistEditorId, setPlaylistEditorId] = useState<string | null>(null);
  const [playlistName, setPlaylistName] = useState("");
  const [playlistTrackIds, setPlaylistTrackIds] = useState<string[]>([]);

  const sourceKindLabel: Record<string, string> = {
    directory: t.library.directory,
    file: t.library.logFile,
    url: t.library.githubUrl,
  };

  const connectionKindLabel: Record<string, string> = {
    file_log: t.library.fileTail,
    gcp_cloud_run: t.simpleMode.connections.gcpCloudRun,
  };

  const tabs: Array<{ id: LibraryTab; label: string; count: number; icon: React.ReactNode }> = [
    { id: "tracks", label: t.library.sounds, count: tracks.length, icon: <Music size={14} /> },
    {
      id: "sources",
      label: t.library.logSources,
      count: repositories.length,
      icon: <FolderOpen size={14} />,
    },
    {
      id: "connections",
      label: t.library.connections,
      count: logConnections.length,
      icon: <Cable size={14} />,
    },
    {
      id: "bases",
      label: t.library.profiles,
      count: baseAssets.length,
      icon: <PackagePlus size={14} />,
    },
  ];

  function handleTabChange(next: LibraryTab) {
    setTab(next);
    onTabChange?.(next);
    setShowForm(false);
  }

  async function refreshLogConnections(): Promise<void> {
    try {
      setLogConnectionError(null);
      setLogConnections(await listLogSourceConnections());
    } catch (error) {
      setLogConnectionError(error instanceof Error ? error.message : String(error));
    }
  }

  useEffect(() => {
    void refreshLogConnections();
  }, []);

  useEffect(() => {
    if (activeTab) {
      setTab(activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    const selectedPlaylist =
      playlists.find((playlist) => playlist.id === selectedPlaylistId) ?? null;

    if (!selectedPlaylist) {
      if (!playlistEditorOpen) {
        setPlaylistEditorId(null);
        setPlaylistName("");
        setPlaylistTrackIds([]);
      }
      return;
    }

    if (playlistEditorOpen && playlistEditorId === selectedPlaylist.id) {
      setPlaylistName(selectedPlaylist.name);
      setPlaylistTrackIds(selectedPlaylist.trackIds);
    }
  }, [playlistEditorId, playlistEditorOpen, playlists, selectedPlaylistId]);

  function openPlaylistEditor(playlist?: BaseTrackPlaylist) {
    setPlaylistEditorOpen(true);
    setPlaylistEditorId(playlist?.id ?? null);
    setPlaylistName(playlist?.name ?? "");
    setPlaylistTrackIds(playlist?.trackIds ?? []);
    if (playlist) {
      onSelectPlaylist(playlist.id);
    }
  }

  function resetPlaylistEditor() {
    setPlaylistEditorOpen(false);
    setPlaylistEditorId(null);
    setPlaylistName("");
    setPlaylistTrackIds([]);
  }

  function togglePlaylistTrack(trackId: string) {
    setPlaylistTrackIds((current) =>
      current.includes(trackId) ? current.filter((id) => id !== trackId) : [...current, trackId],
    );
  }

  async function handleSavePlaylist() {
    const ok = await onSavePlaylist({
      id: playlistEditorId ?? undefined,
      name: playlistName,
      trackIds: playlistTrackIds,
    });

    if (ok) {
      resetPlaylistEditor();
    }
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

  async function handleImportTrack(input: ImportTrackInput) {
    const ok = await onImportTrack(input);
    if (ok) setShowForm(false);
    return ok;
  }

  async function handleImportRepository(input: ImportRepositoryInput) {
    const ok = await onImportRepository(input);
    if (ok) {
      if (input.sourceKind === "file") {
        void refreshLogConnections();
      }
      setShowForm(false);
    }
    return ok;
  }

  async function handleDeleteLogConnection(connectionId: string): Promise<void> {
    try {
      await deleteLogSourceConnection(connectionId);
      await refreshLogConnections();
    } catch (error) {
      setLogConnectionError(error instanceof Error ? error.message : String(error));
    }
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
  const missingTrackCount = tracks.filter(
    (track) => track.file.availabilityState === "missing",
  ).length;

  const error =
    tab === "tracks"
      ? trackError
      : tab === "sources"
        ? repositoryError
        : tab === "connections"
          ? logConnectionError
          : baseAssetError;

  return (
    <section className="screen">
      {/* Header */}
      <header className="library-header">
        <div>
          <h2>{t.library.title}</h2>
          <p className="support-copy">{t.library.copy}</p>
        </div>
      </header>

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

      <div className="library-tab-toolbar">
        <div className="library-tab-toolbar-copy">
          <div className="library-tab-toolbar-meta">
            <span className="eyebrow">
              {tab === "tracks"
                ? t.library.sounds
                : tab === "sources"
                  ? t.library.logSources
                  : tab === "connections"
                    ? t.library.connections
                    : t.library.profiles}
            </span>
            <span className="library-toolbar-count">
              {tab === "tracks"
                ? tracks.length
                : tab === "sources"
                  ? repositories.length
                  : tab === "connections"
                    ? logConnections.length
                    : baseAssets.length}
            </span>
          </div>
          <strong>
            {tab === "tracks"
              ? t.library.toolbarSoundsTitle
              : tab === "sources"
                ? t.library.toolbarSourcesTitle
                : tab === "connections"
                  ? t.library.toolbarConnectionsTitle
                  : t.library.toolbarProfilesTitle}
          </strong>
          <p className="library-tab-toolbar-note">
            {tab === "tracks"
              ? t.library.toolbarSoundsNote
              : tab === "sources"
                ? t.library.toolbarSourcesNote
                : tab === "connections"
                  ? t.library.toolbarConnectionsNote
                  : t.library.toolbarProfilesNote}
          </p>
        </div>

        <div className="library-tab-toolbar-actions">
          <button
            type="button"
            className={showForm ? "action toolbar-action active" : "action toolbar-action"}
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? (
              <>
                <X size={14} /> {t.library.cancel}
              </>
            ) : tab === "tracks" ? (
              <>
                <Music size={14} /> {t.library.importTrack}
              </>
            ) : tab === "sources" || tab === "connections" ? (
              <>
                <FolderOpen size={14} />{" "}
                {tab === "connections" ? t.library.addConnection : t.library.importRepository}
              </>
            ) : (
              <>
                <PackagePlus size={14} /> {t.library.importBaseAsset}
              </>
            )}
          </button>

          {tab === "tracks" && (
            <button
              type="button"
              className="action toolbar-action"
              onClick={async () => {
                await onSeedDemo();
                setShowForm(false);
              }}
            >
              <Plus size={14} /> {t.library.seedDemo}
            </button>
          )}

          {tab === "tracks" && tracks.length > 0 && (
            <button
              type="button"
              className="secondary-action toolbar-action"
              onClick={() => openPlaylistEditor()}
            >
              <ListMusic size={14} /> {t.library.newPlaylist}
            </button>
          )}

          {tab === "tracks" && missingTrackCount > 0 && (
            <button
              type="button"
              className="secondary-action toolbar-action"
              onClick={() => void onRelinkMissingTracks()}
            >
              <FolderOpen size={14} /> {t.library.relinkMissing} ({missingTrackCount})
            </button>
          )}

          {tab === "tracks" && tracks.length > 0 && (
            <button
              type="button"
              className="action action-secondary toolbar-action"
              onClick={async () => {
                const orphanTracks = tracks.filter((t) => !t.analysis.bpm);
                if (orphanTracks.length === 0) {
                  alert(t.library.noUnanalyzedTracks);
                  return;
                }
                if (
                  !confirm(
                    t.library.confirmDeleteTracks.replace("{count}", String(orphanTracks.length)),
                  )
                )
                  return;
                for (const orphan of orphanTracks) {
                  await onDeleteTrack(orphan.id);
                }
              }}
              title={t.library.deleteUnanalyzedTracks}
            >
              <Trash2 size={14} /> {t.library.cleanOrphans}
            </button>
          )}

          {tab === "sources" && repositories.length > 0 && (
            <button
              type="button"
              className="action action-secondary toolbar-action"
              onClick={async () => {
                const orphanRepos = repositories.filter((r) => !r.suggestedBpm);
                if (orphanRepos.length === 0) {
                  alert(t.library.noUnanalyzedSources);
                  return;
                }
                if (
                  !confirm(
                    t.library.confirmDeleteSources.replace("{count}", String(orphanRepos.length)),
                  )
                )
                  return;
                for (const orphan of orphanRepos) {
                  await onDeleteRepository(orphan.id);
                }
              }}
              title={t.library.deleteUnanalyzedSources}
            >
              <Trash2 size={14} /> {t.library.cleanOrphans}
            </button>
          )}
        </div>
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
              onSeedDemo={async () => {
                await onSeedDemo();
                setShowForm(false);
              }}
            />
          )}
          {(tab === "sources" || tab === "connections") && (
            <ImportRepositoryForm
              busy={repositoryBusy}
              defaultDirectoryPath={manifest?.repoRoot}
              onImportRepository={handleImportRepository}
              onLogConnectionSaved={() => {
                setShowForm(false);
                void refreshLogConnections();
              }}
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
          {t.library.loading}
        </div>
      ) : (
        <>
          {/* TRACKS */}
          {tab === "tracks" &&
            (tracks.length === 0 ? (
              <EmptyState
                icon={<Music size={32} />}
                title={t.library.noTracksYet}
                body={t.library.noTracksBody}
                action={
                  <button type="button" className="action" onClick={() => setShowForm(true)}>
                    <Plus size={14} /> {t.library.addTrack}
                  </button>
                }
              />
            ) : (
              <div className="library-track-stack">
                <section className="playlist-panel">
                  <div className="panel-header compact">
                    <div>
                      <h2>{t.library.basePlaylists}</h2>
                      <p className="support-copy">{t.library.basePlaylistsHelp}</p>
                    </div>
                  </div>

                  {playlistEditorOpen ? (
                    <div className="playlist-editor">
                      <label className="field">
                        <span>{t.library.playlistName}</span>
                        <input
                          value={playlistName}
                          onChange={(event) => setPlaylistName(event.target.value)}
                          placeholder={t.library.playlistPlaceholder}
                        />
                      </label>
                      <div className="playlist-track-picker">
                        {tracks.map((track) => (
                          <label key={track.id} className="playlist-track-option">
                            <input
                              type="checkbox"
                              checked={playlistTrackIds.includes(track.id)}
                              onChange={() => togglePlaylistTrack(track.id)}
                            />
                            <span>{getTrackTitle(track)}</span>
                            <small>
                              {track.analysis.bpm
                                ? `${Math.round(track.analysis.bpm)} BPM`
                                : t.library.noBpm}
                              {track.file.availabilityState === "missing"
                                ? ` · ${t.library.lost.toUpperCase()}`
                                : ""}
                            </small>
                          </label>
                        ))}
                      </div>
                      <div className="form-actions">
                        <button
                          type="button"
                          className="action"
                          onClick={() => void handleSavePlaylist()}
                        >
                          {playlistEditorId ? t.library.updatePlaylist : t.library.savePlaylist}
                        </button>
                        <button
                          type="button"
                          className="secondary-action"
                          onClick={resetPlaylistEditor}
                        >
                          {t.library.cancel}
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {playlists.length > 0 ? (
                    <div className="playlist-card-list">
                      {playlists.map((playlist) => (
                        <article
                          key={playlist.id}
                          className={`playlist-card${playlist.id === selectedPlaylistId ? " selected" : ""}`}
                          onClick={() => onSelectPlaylist(playlist.id)}
                        >
                          <div className="playlist-card-copy">
                            <strong>{playlist.name}</strong>
                            <span>
                              {playlist.trackIds.length} {t.library.sounds.toLowerCase()} ·{" "}
                              {formatShortDate(playlist.updatedAt)}
                            </span>
                            <small>
                              {playlist.trackIds
                                .map((trackId) => tracks.find((track) => track.id === trackId))
                                .filter((track): track is LibraryTrack => track !== undefined)
                                .slice(0, 3)
                                .map((track) => getTrackTitle(track))
                                .join(" · ") || t.library.noTracksAssigned}
                            </small>
                          </div>
                          <div className="playlist-card-actions">
                            <button
                              type="button"
                              className="card-action-btn"
                              onClick={(event) => {
                                event.stopPropagation();
                                openPlaylistEditor(playlist);
                              }}
                            >
                              {t.library.edit}
                            </button>
                            <button
                              type="button"
                              className="card-action-delete"
                              title={t.library.deletePlaylist}
                              onClick={(event) => {
                                event.stopPropagation();
                                void onDeletePlaylist(playlist.id);
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="support-copy">{t.library.noBasePlaylists}</p>
                  )}
                </section>

                <ul className="asset-card-list">
                  {tracks.map((track) => (
                    <li
                      key={track.id}
                      className={`asset-card${track.id === selectedTrackId ? " selected" : ""}${track.id === newlyImportedId ? " just-imported" : ""}${track.file.availabilityState === "missing" ? " asset-card-missing" : ""}`}
                      onClick={() => onSelectTrack(track.id)}
                    >
                      <div className="asset-card-icon track-icon">
                        <AudioWaveform size={18} />
                      </div>
                      <div className="asset-card-body">
                        <strong className="asset-card-title">{getTrackTitle(track)}</strong>
                        <div className="asset-card-meta">
                          {track.analysis.bpm ? (
                            <span className="bpm-badge">{Math.round(track.analysis.bpm)} BPM</span>
                          ) : (
                            <span className="bpm-badge pending">-</span>
                          )}
                          {track.file.availabilityState === "missing" ? (
                            <span className="track-lost-badge">{t.library.lost.toUpperCase()}</span>
                          ) : null}
                          {track.analysis.durationSeconds
                            ? ` · ${Math.round(track.analysis.durationSeconds / 60)}m${Math.round(track.analysis.durationSeconds % 60)}s`
                            : ""}
                          {" · "}
                          {track.tags.musicStyleLabel}
                          {" · "}
                          {track.file.fileExtension}
                        </div>
                        <span className="asset-card-date">
                          {formatShortDate(track.analysis.importedAt)}
                        </span>
                      </div>
                      <div className="asset-card-actions">
                        {track.file.availabilityState === "missing" ? (
                          <button
                            type="button"
                            className="card-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              void onRelinkTrack(track.id);
                            }}
                          >
                            {t.library.relink}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="card-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            !track.analysis.bpm
                              ? void onReanalyzeTrack(track.id)
                              : onInspectTrack(track.id);
                          }}
                        >
                          {!track.analysis.bpm ? t.library.analyze : t.library.view}
                        </button>
                        <button
                          type="button"
                          className="card-action-delete"
                          title={t.library.deleteTrack}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTrack(track.id);
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

          {/* SOURCES */}
          {tab === "sources" &&
            (repositories.length === 0 ? (
              <EmptyState
                icon={<FolderOpen size={32} />}
                title={t.library.noSourcesYet}
                body={t.library.noSourcesBody}
                action={
                  <button type="button" className="action" onClick={() => setShowForm(true)}>
                    <Plus size={14} /> {t.library.addSource}
                  </button>
                }
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
                        <span className="type-badge">
                          {sourceKindLabel[repo.sourceKind] ?? repo.sourceKind}
                        </span>
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
                        onClick={(e) => {
                          e.stopPropagation();
                          !repo.suggestedBpm
                            ? void onReanalyzeRepository(repo.id)
                            : onInspectRepository(repo.id);
                        }}
                      >
                        {!repo.suggestedBpm ? t.library.analyze : t.library.view}
                      </button>
                      <button
                        type="button"
                        className="card-action-delete"
                        title={t.library.deleteRepository}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteRepository(repo.id);
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ))}

          {/* CONNECTIONS */}
          {tab === "connections" &&
            (logConnections.length === 0 ? (
              <EmptyState
                icon={<Cable size={32} />}
                title={t.library.noConnectionsYet}
                body={t.library.noConnectionsBody}
                action={
                  <button type="button" className="action" onClick={() => setShowForm(true)}>
                    <Plus size={14} /> {t.library.addConnection}
                  </button>
                }
              />
            ) : (
              <ul className="asset-card-list">
                {logConnections.map((connection) => (
                  <li key={connection.id} className="asset-card">
                    <div className="asset-card-icon source-icon">
                      <Cable size={18} />
                    </div>
                    <div className="asset-card-body">
                      <strong className="asset-card-title">{connection.label}</strong>
                      <div className="asset-card-meta">
                        <span className="type-badge">
                          {connectionKindLabel[connection.kind] ?? connection.kind}
                        </span>
                        <span className={connection.enabled ? "bpm-badge" : "bpm-badge pending"}>
                          {connection.enabled ? t.library.enabled : t.library.disabled}
                        </span>
                        {" · "}
                        {connection.adapterKind}
                      </div>
                      <span className="asset-card-date" title={connection.sourceUri}>
                        {connection.sourceUri}
                      </span>
                    </div>
                    <div className="asset-card-actions">
                      <button
                        type="button"
                        className="card-action-delete"
                        title={t.library.deleteConnection}
                        onClick={() => void handleDeleteLogConnection(connection.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ))}

          {/* BASES */}
          {tab === "bases" &&
            (baseAssets.length === 0 ? (
              <EmptyState
                icon={<PackagePlus size={32} />}
                title={t.library.noBasePacksYet}
                body={t.library.noBasePacksBody}
                action={
                  <button type="button" className="action" onClick={() => setShowForm(true)}>
                    <Plus size={14} /> {t.library.addBase}
                  </button>
                }
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
                        <span
                          className={`status-badge ${getStatusBadgeClass(asset.analyzerStatus)}`}
                        >
                          {getStatusLabel(asset.analyzerStatus)}
                        </span>
                        {` · ${asset.entryCount} ${t.library.entries}`}
                        {asset.reusable ? ` · ${t.library.reusable}` : ""}
                      </div>
                      <span className="asset-card-date">{formatShortDate(asset.importedAt)}</span>
                    </div>
                    <div className="asset-card-actions">
                      <button
                        type="button"
                        className="card-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectBaseAsset(asset.id);
                        }}
                      >
                        {t.library.analyze}
                      </button>
                      {asset.analyzerStatus === "ready" && (
                        <button
                          type="button"
                          className="card-action-compose"
                          onClick={(e) => {
                            e.stopPropagation();
                            onInspectBaseAsset(asset.id);
                          }}
                        >
                          {t.library.compose} →
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ))}
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
