import type {
  BaseAssetRecord,
  BaseTrackPlaylist,
  LibraryTrack,
  LogSourceConnection,
  RepositoryAnalysis,
} from "../../../types/library";
import type { LibraryTab } from "../libraryScreenTypes";
import { LibraryBaseAssetsListPanel } from "./LibraryBaseAssetsListPanel";
import { LibraryConnectionsListPanel } from "./LibraryConnectionsListPanel";
import { LibrarySourcesListPanel } from "./LibrarySourcesListPanel";
import { LibraryTabEmptySection } from "./LibraryTabEmptySection";
import { LibraryTabLoadingState } from "./LibraryTabLoadingState";
import { LibraryTracksTabSection } from "./LibraryTracksTabSection";
import { buildLibraryTabContentState } from "./libraryTabContentRuntime";

export interface EmptyStateContent {
  title: string;
  body: string;
  actionLabel: string;
}

interface LibraryTabContentProps {
  tab: LibraryTab;
  loading: boolean;
  loadingLabel: string;
  emptyState: EmptyStateContent;
  newlyImportedId?: string | null;
  tracks: LibraryTrack[];
  playlists: BaseTrackPlaylist[];
  repositories: RepositoryAnalysis[];
  baseAssets: BaseAssetRecord[];
  selectedTrackId: string | null;
  selectedPlaylistId: string | null;
  selectedRepositoryId: string | null;
  selectedBaseAssetId: string | null;
  playlistEditorOpen: boolean;
  playlistEditorId: string | null;
  playlistName: string;
  playlistTrackIds: string[];
  logConnections: LogSourceConnection[];
  onShowForm: () => void;
  onDeleteTrack: (trackId: string) => Promise<boolean>;
  onInspectTrack: (trackId: string) => void;
  onReanalyzeTrack: (trackId: string) => Promise<boolean>;
  onRelinkTrack: (trackId: string) => Promise<boolean>;
  onSelectTrack: (trackId: string) => void;
  onDeleteRepository: (repositoryId: string) => Promise<boolean>;
  onInspectRepository: (repositoryId: string) => void;
  onReanalyzeRepository: (repositoryId: string) => Promise<boolean>;
  onSelectRepository: (repositoryId: string) => void;
  onDeleteConnection: (connectionId: string) => Promise<void>;
  onInspectBaseAsset: (baseAssetId: string) => void;
  onSelectBaseAsset: (baseAssetId: string) => void;
  onDeletePlaylist: (playlistId: string) => Promise<boolean>;
  onOpenPlaylistEditor: (playlist?: BaseTrackPlaylist) => void;
  onResetPlaylistEditor: () => void;
  onSavePlaylist: () => Promise<void>;
  onSelectPlaylist: (playlistId: string) => void;
  onSetPlaylistName: (value: string) => void;
  onTogglePlaylistTrack: (trackId: string) => void;
}

export function LibraryTabContent({
  tab,
  loading,
  loadingLabel,
  emptyState,
  newlyImportedId,
  tracks,
  playlists,
  repositories,
  baseAssets,
  selectedTrackId,
  selectedPlaylistId,
  selectedRepositoryId,
  selectedBaseAssetId,
  playlistEditorOpen,
  playlistEditorId,
  playlistName,
  playlistTrackIds,
  logConnections,
  onShowForm,
  onDeleteTrack,
  onInspectTrack,
  onReanalyzeTrack,
  onRelinkTrack,
  onSelectTrack,
  onDeleteRepository,
  onInspectRepository,
  onReanalyzeRepository,
  onSelectRepository,
  onDeleteConnection,
  onInspectBaseAsset,
  onSelectBaseAsset,
  onDeletePlaylist,
  onOpenPlaylistEditor,
  onResetPlaylistEditor,
  onSavePlaylist,
  onSelectPlaylist,
  onSetPlaylistName,
  onTogglePlaylistTrack,
}: LibraryTabContentProps) {
  const contentState = buildLibraryTabContentState({
    tab,
    loading,
    trackCount: tracks.length,
    repositoryCount: repositories.length,
    connectionCount: logConnections.length,
    baseAssetCount: baseAssets.length,
  });

  if (contentState.kind === "loading") {
    return <LibraryTabLoadingState loadingLabel={loadingLabel} />;
  }

  if (contentState.kind === "empty") {
    return (
      <LibraryTabEmptySection
        iconKind={contentState.emptyIconKind ?? "tracks"}
        title={emptyState.title}
        body={emptyState.body}
        actionLabel={emptyState.actionLabel}
        onShowForm={onShowForm}
      />
    );
  }

  if (contentState.kind === "tracks") {
    return (
      <LibraryTracksTabSection
        newlyImportedId={newlyImportedId}
        selectedTrackId={selectedTrackId}
        selectedPlaylistId={selectedPlaylistId}
        playlistEditorOpen={playlistEditorOpen}
        playlistEditorId={playlistEditorId}
        playlistName={playlistName}
        playlistTrackIds={playlistTrackIds}
        tracks={tracks}
        playlists={playlists}
        onDeleteTrack={onDeleteTrack}
        onInspectTrack={onInspectTrack}
        onReanalyzeTrack={onReanalyzeTrack}
        onRelinkTrack={onRelinkTrack}
        onSelectTrack={onSelectTrack}
        onDeletePlaylist={onDeletePlaylist}
        onOpenPlaylistEditor={onOpenPlaylistEditor}
        onResetPlaylistEditor={onResetPlaylistEditor}
        onSavePlaylist={onSavePlaylist}
        onSelectPlaylist={onSelectPlaylist}
        onSetPlaylistName={onSetPlaylistName}
        onTogglePlaylistTrack={onTogglePlaylistTrack}
      />
    );
  }

  if (contentState.kind === "sources") {
    return (
      <LibrarySourcesListPanel
        newlyImportedId={newlyImportedId}
        repositories={repositories}
        selectedRepositoryId={selectedRepositoryId}
        onDeleteRepository={onDeleteRepository}
        onInspectRepository={onInspectRepository}
        onReanalyzeRepository={onReanalyzeRepository}
        onSelectRepository={onSelectRepository}
      />
    );
  }

  if (contentState.kind === "connections") {
    return (
      <LibraryConnectionsListPanel
        connections={logConnections}
        onDeleteConnection={onDeleteConnection}
      />
    );
  }

  return (
    <LibraryBaseAssetsListPanel
      assets={baseAssets}
      newlyImportedId={newlyImportedId}
      selectedBaseAssetId={selectedBaseAssetId}
      onInspectBaseAsset={onInspectBaseAsset}
      onSelectBaseAsset={onSelectBaseAsset}
    />
  );
}
