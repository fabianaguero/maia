import { AudioWaveform, FolderOpen, ListMusic, Music, PackagePlus, Plus, Trash2, X } from "lucide-react";
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
  RepositoryAnalysis,
  SaveBaseTrackPlaylistInput,
} from "../../types/library";
import { formatShortDate } from "../../utils/date";
import { getTrackTitle } from "../../utils/track";
import { ImportBaseAssetForm } from "./components/ImportBaseAssetForm";
import { ImportRepositoryForm } from "./components/ImportRepositoryForm";
import { ImportTrackForm } from "./components/ImportTrackForm";

type LibraryTab = "tracks" | "sources" | "bases";

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

const SOURCE_KIND_LABEL: Record<string, string> = {
  directory: "Directory",
  file: "Log file",
  url: "GitHub URL",
};

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
  const [tab, setTab] = useState<LibraryTab>("tracks");
  const [showForm, setShowForm] = useState(false);
  const [playlistEditorOpen, setPlaylistEditorOpen] = useState(false);
  const [playlistEditorId, setPlaylistEditorId] = useState<string | null>(null);
  const [playlistName, setPlaylistName] = useState("");
  const [playlistTrackIds, setPlaylistTrackIds] = useState<string[]>([]);

  const tabs: Array<{ id: LibraryTab; label: string; count: number; icon: React.ReactNode }> = [
    { id: "tracks", label: "Tracks", count: tracks.length, icon: <Music size={14} /> },
    { id: "sources", label: "Sources", count: repositories.length, icon: <FolderOpen size={14} /> },
    { id: "bases", label: "Bases", count: baseAssets.length, icon: <PackagePlus size={14} /> },
  ];

  function handleTabChange(next: LibraryTab) {
    setTab(next);
    setShowForm(false);
  }

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
      current.includes(trackId)
        ? current.filter((id) => id !== trackId)
        : [...current, trackId],
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
              {tab === "tracks" ? "Tracks" : tab === "sources" ? "Sources" : "Bases"}
            </span>
            <span className="library-toolbar-count">
              {tab === "tracks"
                ? tracks.length
                : tab === "sources"
                  ? repositories.length
                  : baseAssets.length}
            </span>
          </div>
          <strong>
            {tab === "tracks"
              ? "DJ-ready track crate"
              : tab === "sources"
                ? "Code, logs, and live signal browser"
                : "Reusable musical base pool"}
          </strong>
          <p className="library-tab-toolbar-note">
            {tab === "tracks"
              ? "Import, seed, and clean the music library."
              : tab === "sources"
                ? "Bring in repositories and operational signals."
                : "Stage assets for composition and live scenes."}
          </p>
        </div>

        <div className="library-tab-toolbar-actions">
          <button
            type="button"
            className={showForm ? "action toolbar-action active" : "action toolbar-action"}
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? (
              <><X size={14} /> Cancel</>
            ) : tab === "tracks" ? (
              <><Music size={14} /> {t.library.importTrack}</>
            ) : tab === "sources" ? (
              <><FolderOpen size={14} /> {t.library.importRepository}</>
            ) : (
              <><PackagePlus size={14} /> {t.library.importBaseAsset}</>
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
              <Plus size={14} /> Seed Demo
            </button>
          )}

          {tab === "tracks" && tracks.length > 0 && (
            <button
              type="button"
              className="secondary-action toolbar-action"
              onClick={() => openPlaylistEditor()}
            >
              <ListMusic size={14} /> New Playlist
            </button>
          )}

          {tab === "tracks" && tracks.length > 0 && (
            <button
              type="button"
              className="action action-secondary toolbar-action"
              onClick={async () => {
                const orphanTracks = tracks.filter((t) => !t.analysis.bpm);
                if (orphanTracks.length === 0) {
                  alert("No unanalyzed tracks to delete");
                  return;
                }
                if (!confirm(`Delete ${orphanTracks.length} unanalyzed track(s)?`)) return;
                for (const orphan of orphanTracks) {
                  await onDeleteTrack(orphan.id);
                }
              }}
              title="Delete all unanalyzed or missing tracks"
            >
              <Trash2 size={14} /> Clean Orphans
            </button>
          )}

          {tab === "sources" && repositories.length > 0 && (
            <button
              type="button"
              className="action action-secondary toolbar-action"
              onClick={async () => {
                const orphanRepos = repositories.filter((r) => !r.suggestedBpm);
                if (orphanRepos.length === 0) {
                  alert("No unanalyzed repositories to delete");
                  return;
                }
                if (!confirm(`Delete ${orphanRepos.length} unanalyzed repositor(y|ies)?`)) return;
                for (const orphan of orphanRepos) {
                  await onDeleteRepository(orphan.id);
                }
              }}
              title="Delete all unanalyzed or missing repositories"
            >
              <Trash2 size={14} /> Clean Orphans
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
              <div className="library-track-stack">
                <section className="playlist-panel">
                  <div className="panel-header compact">
                    <div>
                      <h2>Base playlists</h2>
                      <p className="support-copy">
                        Reusable blended track groups for monitor sessions and background listening.
                      </p>
                    </div>
                  </div>

                  {playlistEditorOpen ? (
                    <div className="playlist-editor">
                      <label className="field">
                        <span>Playlist name</span>
                        <input
                          value={playlistName}
                          onChange={(event) => setPlaylistName(event.target.value)}
                          placeholder="Team base playlist"
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
                              {track.analysis.bpm ? `${Math.round(track.analysis.bpm)} BPM` : "No BPM"}
                            </small>
                          </label>
                        ))}
                      </div>
                      <div className="form-actions">
                        <button type="button" className="action" onClick={() => void handleSavePlaylist()}>
                          {playlistEditorId ? "Update playlist" : "Save playlist"}
                        </button>
                        <button type="button" className="secondary-action" onClick={resetPlaylistEditor}>
                          Cancel
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
                              {playlist.trackIds.length} tracks · {formatShortDate(playlist.updatedAt)}
                            </span>
                            <small>
                              {playlist.trackIds
                                .map((trackId) => tracks.find((track) => track.id === trackId))
                                .filter((track): track is LibraryTrack => track !== undefined)
                                .slice(0, 3)
                                .map((track) => getTrackTitle(track))
                                .join(" · ") || "No tracks assigned"}
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
                              Edit
                            </button>
                            <button
                              type="button"
                              className="card-action-delete"
                              title="Delete playlist"
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
                    <p className="support-copy">No base playlists saved yet.</p>
                  )}
                </section>

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
                        <strong className="asset-card-title">{getTrackTitle(track)}</strong>
                        <div className="asset-card-meta">
                          {track.analysis.bpm ? (
                            <span className="bpm-badge">{Math.round(track.analysis.bpm)} BPM</span>
                          ) : (
                            <span className="bpm-badge pending">-</span>
                          )}
                          {track.analysis.durationSeconds ? ` · ${Math.round(track.analysis.durationSeconds / 60)}m${Math.round(track.analysis.durationSeconds % 60)}s` : ""}
                          {" · "}{track.tags.musicStyleLabel}
                          {" · "}{track.file.fileExtension}
                        </div>
                        <span className="asset-card-date">{formatShortDate(track.analysis.importedAt)}</span>
                      </div>
                      <div className="asset-card-actions">
                        <button
                          type="button"
                          className="card-action-btn"
                          onClick={(e) => { e.stopPropagation(); !track.analysis.bpm ? void onReanalyzeTrack(track.id) : onInspectTrack(track.id); }}
                        >
                          {!track.analysis.bpm ? "Analyze" : "View"}
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
              </div>
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
