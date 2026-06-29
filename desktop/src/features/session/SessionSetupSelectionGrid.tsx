import { getPlaylistMedianBpm } from "../../utils/playlist";
import { getTrackTitle } from "../../utils/track";
import { useT } from "../../i18n/I18nContext";
import type { BaseTrackPlaylist, LibraryTrack, RepositoryAnalysis } from "../../types/library";
import type { QuickSessionMode, SessionBaseMode } from "./sessionDisplay";

interface SessionSetupSelectionGridProps {
  tracks: LibraryTrack[];
  playlists: BaseTrackPlaylist[];
  sourceOptions: RepositoryAnalysis[];
  mode: QuickSessionMode;
  baseMode: SessionBaseMode;
  selectedSourceId: string | null;
  selectedTrackId: string | null;
  selectedPlaylistId: string | null;
  selectedSource: RepositoryAnalysis | null;
  selectedTrack: LibraryTrack | null;
  selectedPlaylist: BaseTrackPlaylist | null;
  selectedBaseLabel: string | null;
  selectedBaseDetail: string | null;
  onBaseModeChange: (mode: SessionBaseMode) => void;
  onTrackSelect: (trackId: string) => void;
  onPlaylistSelect: (playlistId: string) => void;
  onModeChange: (mode: QuickSessionMode) => void;
  onSourceSelect: (sourceId: string) => void;
}

export function SessionSetupSelectionGrid({
  tracks,
  playlists,
  sourceOptions,
  mode,
  baseMode,
  selectedSourceId,
  selectedTrackId,
  selectedPlaylistId,
  selectedSource,
  selectedTrack,
  selectedPlaylist,
  selectedBaseLabel,
  selectedBaseDetail,
  onBaseModeChange,
  onTrackSelect,
  onPlaylistSelect,
  onModeChange,
  onSourceSelect,
}: SessionSetupSelectionGridProps) {
  const t = useT();

  return (
    <div className="monitor-setup-grid">
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

      <div className="audio-path-card monitor-setup-card">
        <span>{t.session.stepSourceTitle}</span>
        <p className="monitor-empty-hint">{t.session.stepSourceHelp}</p>

        <div className="session-mode-tabs">
          <button
            type="button"
            className={`session-mode-tab${mode === "log" ? " active" : ""}`}
            onClick={() => onModeChange("log")}
          >
            {t.session.logFile}
          </button>
          <button
            type="button"
            className={`session-mode-tab${mode === "repo" ? " active" : ""}`}
            onClick={() => onModeChange("repo")}
          >
            {t.session.repository}
          </button>
        </div>

        {sourceOptions.length === 0 ? (
          <p className="placeholder">
            {mode === "log" ? t.session.noImportedLogs : t.session.noImportedRepos}
          </p>
        ) : (
          <div className="session-asset-options">
            {sourceOptions.map((source) => (
              <button
                key={source.id}
                type="button"
                className={`session-asset-option${selectedSourceId === source.id ? " selected" : ""}`}
                onClick={() => onSourceSelect(source.id)}
              >
                <span className="session-asset-title">{source.title}</span>
                <span className="session-asset-path">{source.sourcePath}</span>
              </button>
            ))}
          </div>
        )}

        {selectedSource && (
          <div className="monitor-source-summary">
            <small>{t.session.selected}</small>
            <strong>{selectedSource.title}</strong>
          </div>
        )}
      </div>
    </div>
  );
}
