import { LibraryFormDrawer } from "./components/LibraryFormDrawer";
import { LibraryToolbar } from "./components/LibraryToolbar";
import { LibraryTabContent } from "./components/LibraryTabContent";
import { LibraryTabStrip } from "./LibraryTabStrip";
import type { LibraryScreenProps } from "./libraryScreenTypes";
import { useLibraryScreenController } from "./useLibraryScreenController";

export function LibraryScreen({
  manifest,
  musicStyles,
  baseAssetCategories,
  defaultTrackMusicStyleId,
  defaultBaseAssetCategoryId,
  ...props
}: LibraryScreenProps) {
  const {
    t,
    tab,
    viewModel,
    toolbarActions,
    showForm,
    setShowForm,
    handleTabChange,
    handleImportTrack,
    handleImportRepository,
    handleImportBaseAsset,
    refreshLogConnections,
    logConnections,
    playlistEditorOpen,
    playlistEditorId,
    playlistName,
    setPlaylistName,
    playlistTrackIds,
    openPlaylistEditor,
    resetPlaylistEditor,
    togglePlaylistTrack,
    handleSavePlaylist,
    handleDeleteLogConnection,
    selectedTrackId,
    selectedPlaylistId,
    selectedRepositoryId,
    selectedBaseAssetId,
    newlyImportedId,
    tracks,
    playlists,
    repositories,
    baseAssets,
    onDeleteTrack,
    onInspectTrack,
    onReanalyzeTrack,
    onRelinkTrack,
    onSelectTrack,
    onDeleteRepository,
    onInspectRepository,
    onReanalyzeRepository,
    onSelectRepository,
    onInspectBaseAsset,
    onSelectBaseAsset,
    onDeletePlaylist,
    onSelectPlaylist,
  } = useLibraryScreenController(props);

  return (
    <section className="screen">
      <header className="library-header">
        <div>
          <h2>{t.library.title}</h2>
          <p className="support-copy">{t.library.copy}</p>
        </div>
      </header>

      <LibraryTabStrip tabs={viewModel.tabs} activeTab={tab} onTabChange={handleTabChange} />

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
        trackBusy={props.trackBusy}
        repositoryBusy={props.repositoryBusy}
        baseAssetBusy={props.baseAssetBusy}
        onImportTrack={handleImportTrack}
        onImportRepository={handleImportRepository}
        onImportBaseAsset={handleImportBaseAsset}
        onSeedDemo={props.onSeedDemo}
        onClose={() => setShowForm(false)}
        onLogConnectionSaved={() => {
          setShowForm(false);
          void refreshLogConnections();
        }}
      />

      {viewModel.error && <p className="inline-error">{viewModel.error}</p>}

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
