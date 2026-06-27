import { Cable, FolderOpen, Music, PackagePlus, Plus } from "lucide-react";

import type {
  BaseAssetRecord,
  BaseTrackPlaylist,
  LibraryTrack,
  LogSourceConnection,
  RepositoryAnalysis,
} from "../../../types/library";
import type { LibraryTab } from "../LibraryScreen";
import { LibraryBaseAssetsListPanel } from "./LibraryBaseAssetsListPanel";
import { LibraryConnectionsListPanel } from "./LibraryConnectionsListPanel";
import { LibraryEmptyState } from "./LibraryEmptyState";
import { LibraryPlaylistsPanel } from "./LibraryPlaylistsPanel";
import { LibrarySourcesListPanel } from "./LibrarySourcesListPanel";
import { LibraryTracksListPanel } from "./LibraryTracksListPanel";

interface EmptyStateContent {
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

function renderEmptyIcon(tab: LibraryTab) {
  if (tab === "tracks") {
    return <Music size={32} />;
  }
  if (tab === "sources") {
    return <FolderOpen size={32} />;
  }
  if (tab === "connections") {
    return <Cable size={32} />;
  }
  return <PackagePlus size={32} />;
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
  if (loading) {
    return (
      <div className="placeholder-loading">
        <span className="spin-ring" aria-hidden="true" />
        {loadingLabel}
      </div>
    );
  }

  const emptyAction = (
    <button type="button" className="action" onClick={onShowForm}>
      <Plus size={14} /> {emptyState.actionLabel}
    </button>
  );

  if (tab === "tracks") {
    if (tracks.length === 0) {
      return (
        <LibraryEmptyState
          icon={renderEmptyIcon(tab)}
          title={emptyState.title}
          body={emptyState.body}
          action={emptyAction}
        />
      );
    }

    return (
      <div className="library-track-stack">
        <LibraryPlaylistsPanel
          playlistEditorId={playlistEditorId}
          playlistEditorOpen={playlistEditorOpen}
          playlistName={playlistName}
          playlistTrackIds={playlistTrackIds}
          playlists={playlists}
          selectedPlaylistId={selectedPlaylistId}
          tracks={tracks}
          onDeletePlaylist={onDeletePlaylist}
          onOpenPlaylistEditor={onOpenPlaylistEditor}
          onResetPlaylistEditor={onResetPlaylistEditor}
          onSavePlaylist={onSavePlaylist}
          onSelectPlaylist={onSelectPlaylist}
          onSetPlaylistName={onSetPlaylistName}
          onTogglePlaylistTrack={onTogglePlaylistTrack}
        />
        <LibraryTracksListPanel
          newlyImportedId={newlyImportedId}
          selectedTrackId={selectedTrackId}
          tracks={tracks}
          onDeleteTrack={onDeleteTrack}
          onInspectTrack={onInspectTrack}
          onReanalyzeTrack={onReanalyzeTrack}
          onRelinkTrack={onRelinkTrack}
          onSelectTrack={onSelectTrack}
        />
      </div>
    );
  }

  if (tab === "sources") {
    if (repositories.length === 0) {
      return (
        <LibraryEmptyState
          icon={renderEmptyIcon(tab)}
          title={emptyState.title}
          body={emptyState.body}
          action={emptyAction}
        />
      );
    }

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

  if (tab === "connections") {
    if (logConnections.length === 0) {
      return (
        <LibraryEmptyState
          icon={renderEmptyIcon(tab)}
          title={emptyState.title}
          body={emptyState.body}
          action={emptyAction}
        />
      );
    }

    return (
      <LibraryConnectionsListPanel
        connections={logConnections}
        onDeleteConnection={onDeleteConnection}
      />
    );
  }

  if (baseAssets.length === 0) {
    return (
      <LibraryEmptyState
        icon={renderEmptyIcon(tab)}
        title={emptyState.title}
        body={emptyState.body}
        action={emptyAction}
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
