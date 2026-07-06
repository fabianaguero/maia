import type { BaseTrackPlaylist, LibraryTrack } from "../../../types/library";
import { LibraryPlaylistsPanel } from "./LibraryPlaylistsPanel";
import { LibraryTracksListPanel } from "./LibraryTracksListPanel";

interface LibraryTracksTabSectionProps {
  newlyImportedId?: string | null;
  selectedTrackId: string | null;
  selectedPlaylistId: string | null;
  playlistEditorOpen: boolean;
  playlistEditorId: string | null;
  playlistName: string;
  playlistTrackIds: string[];
  tracks: LibraryTrack[];
  playlists: BaseTrackPlaylist[];
  onDeleteTrack: (trackId: string) => Promise<boolean>;
  onInspectTrack: (trackId: string) => void;
  onReanalyzeTrack: (trackId: string) => Promise<boolean>;
  onRelinkTrack: (trackId: string) => Promise<boolean>;
  onSelectTrack: (trackId: string) => void;
  onDeletePlaylist: (playlistId: string) => Promise<boolean>;
  onOpenPlaylistEditor: (playlist?: BaseTrackPlaylist) => void;
  onResetPlaylistEditor: () => void;
  onSavePlaylist: () => Promise<void>;
  onSelectPlaylist: (playlistId: string) => void;
  onSetPlaylistName: (value: string) => void;
  onTogglePlaylistTrack: (trackId: string) => void;
}

export function LibraryTracksTabSection({
  newlyImportedId,
  selectedTrackId,
  selectedPlaylistId,
  playlistEditorOpen,
  playlistEditorId,
  playlistName,
  playlistTrackIds,
  tracks,
  playlists,
  onDeleteTrack,
  onInspectTrack,
  onReanalyzeTrack,
  onRelinkTrack,
  onSelectTrack,
  onDeletePlaylist,
  onOpenPlaylistEditor,
  onResetPlaylistEditor,
  onSavePlaylist,
  onSelectPlaylist,
  onSetPlaylistName,
  onTogglePlaylistTrack,
}: LibraryTracksTabSectionProps) {
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
