import { ListMusic, Trash2 } from "lucide-react";

import { useT } from "../../../i18n/I18nContext";
import type { BaseTrackPlaylist, LibraryTrack } from "../../../types/library";
import { buildLibraryPlaylistsViewModel } from "../libraryPlaylistsViewModel";

interface LibraryPlaylistsPanelProps {
  playlistEditorId: string | null;
  playlistEditorOpen: boolean;
  playlistName: string;
  playlistTrackIds: string[];
  playlists: BaseTrackPlaylist[];
  selectedPlaylistId: string | null;
  tracks: LibraryTrack[];
  onDeletePlaylist: (playlistId: string) => Promise<boolean>;
  onOpenPlaylistEditor: (playlist?: BaseTrackPlaylist) => void;
  onResetPlaylistEditor: () => void;
  onSavePlaylist: () => Promise<void>;
  onSelectPlaylist: (playlistId: string) => void;
  onSetPlaylistName: (value: string) => void;
  onTogglePlaylistTrack: (trackId: string) => void;
}

export function LibraryPlaylistsPanel({
  playlistEditorId,
  playlistEditorOpen,
  playlistName,
  playlistTrackIds,
  playlists,
  selectedPlaylistId,
  tracks,
  onDeletePlaylist,
  onOpenPlaylistEditor,
  onResetPlaylistEditor,
  onSavePlaylist,
  onSelectPlaylist,
  onSetPlaylistName,
  onTogglePlaylistTrack,
}: LibraryPlaylistsPanelProps) {
  const t = useT();
  const viewModel = buildLibraryPlaylistsViewModel({
    playlistEditorId,
    playlistTrackIds,
    playlists,
    selectedPlaylistId,
    t,
    tracks,
  });

  return (
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
              onChange={(event) => onSetPlaylistName(event.target.value)}
              placeholder={t.library.playlistPlaceholder}
            />
          </label>
          <div className="playlist-track-picker">
            {viewModel.trackOptions.map((track) => (
              <label key={track.id} className="playlist-track-option">
                <input
                  type="checkbox"
                  checked={track.checked}
                  onChange={() => onTogglePlaylistTrack(track.id)}
                />
                <span>{track.title}</span>
                <small>{track.detail}</small>
              </label>
            ))}
          </div>
          <div className="form-actions">
            <button type="button" className="action" onClick={() => void onSavePlaylist()}>
              {viewModel.editorActionLabel}
            </button>
            <button type="button" className="secondary-action" onClick={onResetPlaylistEditor}>
              {t.library.cancel}
            </button>
          </div>
        </div>
      ) : null}

      {viewModel.cards.length > 0 ? (
        <div className="playlist-card-list">
          {viewModel.cards.map((playlist) => (
            <article
              key={playlist.id}
              className={`playlist-card${playlist.isSelected ? " selected" : ""}`}
              onClick={() => onSelectPlaylist(playlist.id)}
            >
              <div className="playlist-card-copy">
                <strong>{playlist.name}</strong>
                <span>{playlist.meta}</span>
                <small>{playlist.preview}</small>
              </div>
              <div className="playlist-card-actions">
                <button
                  type="button"
                  className="card-action-btn"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenPlaylistEditor(playlist.playlist);
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
        <div
          className="support-copy"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <ListMusic size={14} />
          <span>{viewModel.emptyMessage}</span>
        </div>
      )}
    </section>
  );
}
