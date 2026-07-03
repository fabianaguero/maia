import { getPlaylistMedianBpm } from "../../utils/playlist";
import { getTrackTitle } from "../../utils/track";
import { useT } from "../../i18n/I18nContext";
import type { BaseTrackPlaylist, LibraryTrack } from "../../types/library";
import type { SessionBaseMode } from "./sessionDisplay";

interface SessionSetupBaseSelectionCardProps {
  tracks: LibraryTrack[];
  playlists: BaseTrackPlaylist[];
  baseMode: SessionBaseMode;
  selectedTrackId: string | null;
  selectedPlaylistId: string | null;
  selectedTrack: LibraryTrack | null;
  selectedPlaylist: BaseTrackPlaylist | null;
  selectedBaseLabel: string | null;
  selectedBaseDetail: string | null;
  onBaseModeChange: (mode: SessionBaseMode) => void;
  onTrackSelect: (trackId: string) => void;
  onPlaylistSelect: (playlistId: string) => void;
}

export function SessionSetupBaseSelectionCard({
  tracks,
  playlists,
  baseMode,
  selectedTrackId,
  selectedPlaylistId,
  selectedTrack,
  selectedPlaylist,
  selectedBaseLabel,
  selectedBaseDetail,
  onBaseModeChange,
  onTrackSelect,
  onPlaylistSelect,
}: SessionSetupBaseSelectionCardProps) {
  const t = useT();

  return (
    <div className="audio-path-card monitor-setup-card">
      <span>{t.session.stepBaseTitle}</span>
      <p className="monitor-empty-hint">{t.session.stepBaseHelp}</p>

      <div className="session-mode-tabs">
        <button
          type="button"
          className={`session-mode-tab${baseMode === "track" ? " active" : ""}`}
          onClick={() => onBaseModeChange("track")}
          disabled={tracks.length === 0}
        >
          {t.session.track}
        </button>
        <button
          type="button"
          className={`session-mode-tab${baseMode === "playlist" ? " active" : ""}`}
          onClick={() => onBaseModeChange("playlist")}
          disabled={playlists.length === 0}
        >
          {t.session.playlist}
        </button>
      </div>

      {baseMode === "track" ? (
        tracks.length === 0 ? (
          <p className="placeholder">{t.session.noTracks}</p>
        ) : (
          <div className="session-asset-options">
            {tracks.map((track) => (
              <button
                key={track.id}
                type="button"
                className={`session-asset-option${selectedTrackId === track.id ? " selected" : ""}`}
                onClick={() => onTrackSelect(track.id)}
              >
                <span className="session-asset-title">{getTrackTitle(track)}</span>
                <span className="session-asset-path">
                  {track.analysis.bpm?.toFixed(0) ?? "—"} BPM
                </span>
              </button>
            ))}
          </div>
        )
      ) : playlists.length === 0 ? (
        <p className="placeholder">{t.session.noPlaylists}</p>
      ) : (
        <div className="session-asset-options">
          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              type="button"
              className={`session-asset-option${selectedPlaylistId === playlist.id ? " selected" : ""}`}
              onClick={() => onPlaylistSelect(playlist.id)}
            >
              <span className="session-asset-title">{playlist.name}</span>
              <span className="session-asset-path">
                {playlist.trackIds.length} {t.library.sounds.toLowerCase()} · {t.session.median}{" "}
                {getPlaylistMedianBpm(playlist, tracks)?.toFixed(0) ?? "?"} BPM
              </span>
            </button>
          ))}
        </div>
      )}

      {(selectedTrack || selectedPlaylist) && (
        <div className="monitor-source-summary">
          <small>{t.session.armed}</small>
          <strong>{selectedBaseLabel}</strong>
          <small style={{ marginTop: 4 }}>{selectedBaseDetail}</small>
        </div>
      )}
    </div>
  );
}
