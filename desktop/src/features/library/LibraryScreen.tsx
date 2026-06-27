import {
  Cable,
  FolderOpen,
  ListMusic,
  Music,
  PackagePlus,
  Plus,
  Trash2,
  X,
} from "lucide-react";
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
import { deleteLogSourceConnection } from "../../api/repositories";
import { LibraryFormDrawer } from "./components/LibraryFormDrawer";
import { LibraryToolbar } from "./components/LibraryToolbar";
import { LibraryTabContent } from "./components/LibraryTabContent";
import { buildLibraryScreenViewModel } from "./libraryScreenViewModel";
import { useLibraryScreenState } from "./useLibraryScreenState";

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
  const {
    tab,
    handleTabChange,
    logConnections,
    logConnectionError,
    setLogConnectionError,
    showForm,
    setShowForm,
    playlistEditorOpen,
    playlistEditorId,
    playlistName,
    setPlaylistName,
    playlistTrackIds,
    openPlaylistEditor,
    resetPlaylistEditor,
    togglePlaylistTrack,
    handleSavePlaylist,
    refreshLogConnections,
  } = useLibraryScreenState({
    activeTab,
    onSavePlaylist,
    onSelectPlaylist,
    onTabChange,
    playlists,
    selectedPlaylistId,
  });

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

  const missingTrackCount = tracks.filter(
    (track) => track.file.availabilityState === "missing",
  ).length;
  const viewModel = buildLibraryScreenViewModel({
    activeTab: tab,
    showForm,
    counts: {
      tracks: tracks.length,
      repositories: repositories.length,
      logConnections: logConnections.length,
      baseAssets: baseAssets.length,
      missingTracks: missingTrackCount,
    },
    loadingState: {
      trackLoading,
      repositoryLoading,
      baseAssetLoading,
    },
    errorState: {
      trackError,
      repositoryError,
      logConnectionError,
      baseAssetError,
    },
    t,
  });

  const toolbarActions = [
    {
      id: "toggle-form",
      label: showForm ? t.library.cancel : viewModel.toolbar.formToggleLabel,
      icon: showForm ? <X size={14} /> : tab === "tracks" ? <Music size={14} /> : tab === "sources" || tab === "connections" ? <FolderOpen size={14} /> : <PackagePlus size={14} />,
      className: showForm ? "action toolbar-action active" : "action toolbar-action",
      onClick: () => setShowForm((value) => !value),
    },
    ...(viewModel.toolbar.showSeedDemo
      ? [
          {
            id: "seed-demo",
            label: t.library.seedDemo,
            icon: <Plus size={14} />,
            className: "action toolbar-action",
            onClick: async () => {
              await onSeedDemo();
              setShowForm(false);
            },
          },
        ]
      : []),
    ...(viewModel.toolbar.showNewPlaylist
      ? [
          {
            id: "new-playlist",
            label: t.library.newPlaylist,
            icon: <ListMusic size={14} />,
            className: "secondary-action toolbar-action",
            onClick: () => openPlaylistEditor(),
          },
        ]
      : []),
    ...(viewModel.toolbar.showRelinkMissing
      ? [
          {
            id: "relink-missing",
            label: `${t.library.relinkMissing} (${missingTrackCount})`,
            icon: <FolderOpen size={14} />,
            className: "secondary-action toolbar-action",
            onClick: () => void onRelinkMissingTracks(),
          },
        ]
      : []),
    ...(tab === "tracks" && viewModel.toolbar.showCleanOrphans
      ? [
          {
            id: "clean-track-orphans",
            label: t.library.cleanOrphans,
            icon: <Trash2 size={14} />,
            className: "action action-secondary toolbar-action",
            onClick: async () => {
              const orphanTracks = tracks.filter((track) => !track.analysis.bpm);
              if (orphanTracks.length === 0) {
                alert(t.library.noUnanalyzedTracks);
                return;
              }
              if (
                !confirm(
                  t.library.confirmDeleteTracks.replace("{count}", String(orphanTracks.length)),
                )
              ) {
                return;
              }
              for (const orphan of orphanTracks) {
                await onDeleteTrack(orphan.id);
              }
            },
          },
        ]
      : []),
    ...(tab === "sources" && viewModel.toolbar.showCleanOrphans
      ? [
          {
            id: "clean-source-orphans",
            label: t.library.cleanOrphans,
            icon: <Trash2 size={14} />,
            className: "action action-secondary toolbar-action",
            onClick: async () => {
              const orphanRepos = repositories.filter((repository) => !repository.suggestedBpm);
              if (orphanRepos.length === 0) {
                alert(t.library.noUnanalyzedSources);
                return;
              }
              if (
                !confirm(
                  t.library.confirmDeleteSources.replace("{count}", String(orphanRepos.length)),
                )
              ) {
                return;
              }
              for (const orphan of orphanRepos) {
                await onDeleteRepository(orphan.id);
              }
            },
          },
        ]
      : []),
  ];

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
        {viewModel.tabs.map((tabItem) => (
          <button
            key={tabItem.id}
            type="button"
            role="tab"
            aria-selected={tab === tabItem.id}
            className={`library-tab${tab === tabItem.id ? " active" : ""}`}
            onClick={() => handleTabChange(tabItem.id)}
          >
            {tabItem.id === "tracks" ? (
              <Music size={14} />
            ) : tabItem.id === "sources" ? (
              <FolderOpen size={14} />
            ) : tabItem.id === "connections" ? (
              <Cable size={14} />
            ) : (
              <PackagePlus size={14} />
            )}
            {tabItem.label}
            <span className="library-tab-count">{tabItem.count}</span>
          </button>
        ))}
      </div>

      <LibraryToolbar
        eyebrow={viewModel.toolbar.eyebrow}
        count={String(viewModel.toolbar.count)}
        title={viewModel.toolbar.title}
        note={viewModel.toolbar.note}
        actions={toolbarActions}
      />

      <LibraryFormDrawer
        visible={showForm}
        tab={tab}
        manifest={manifest}
        musicStyles={musicStyles}
        baseAssetCategories={baseAssetCategories}
        defaultTrackMusicStyleId={defaultTrackMusicStyleId}
        defaultBaseAssetCategoryId={defaultBaseAssetCategoryId}
        trackBusy={trackBusy}
        repositoryBusy={repositoryBusy}
        baseAssetBusy={baseAssetBusy}
        onImportTrack={handleImportTrack}
        onImportRepository={handleImportRepository}
        onImportBaseAsset={handleImportBaseAsset}
        onSeedDemo={onSeedDemo}
        onClose={() => setShowForm(false)}
        onLogConnectionSaved={() => {
          setShowForm(false);
          void refreshLogConnections();
        }}
      />

      {viewModel.error && <p className="inline-error">{viewModel.error}</p>}

      {/* Content */}
      <LibraryTabContent
        tab={tab}
        loading={viewModel.loading}
        loadingLabel={t.library.loading}
        emptyState={viewModel.emptyState}
        newlyImportedId={newlyImportedId}
        tracks={tracks}
        playlists={playlists}
        repositories={repositories}
        baseAssets={baseAssets}
        selectedTrackId={selectedTrackId}
        selectedPlaylistId={selectedPlaylistId}
        selectedRepositoryId={selectedRepositoryId}
        selectedBaseAssetId={selectedBaseAssetId}
        playlistEditorOpen={playlistEditorOpen}
        playlistEditorId={playlistEditorId}
        playlistName={playlistName}
        playlistTrackIds={playlistTrackIds}
        logConnections={logConnections}
        onShowForm={() => setShowForm(true)}
        onDeleteTrack={onDeleteTrack}
        onInspectTrack={onInspectTrack}
        onReanalyzeTrack={onReanalyzeTrack}
        onRelinkTrack={onRelinkTrack}
        onSelectTrack={onSelectTrack}
        onDeleteRepository={onDeleteRepository}
        onInspectRepository={onInspectRepository}
        onReanalyzeRepository={onReanalyzeRepository}
        onSelectRepository={onSelectRepository}
        onDeleteConnection={handleDeleteLogConnection}
        onInspectBaseAsset={onInspectBaseAsset}
        onSelectBaseAsset={onSelectBaseAsset}
        onDeletePlaylist={onDeletePlaylist}
        onOpenPlaylistEditor={openPlaylistEditor}
        onResetPlaylistEditor={resetPlaylistEditor}
        onSavePlaylist={handleSavePlaylist}
        onSelectPlaylist={onSelectPlaylist}
        onSetPlaylistName={setPlaylistName}
        onTogglePlaylistTrack={togglePlaylistTrack}
      />
    </section>
  );
}
