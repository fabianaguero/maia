import { useT } from "../../i18n/I18nContext";
import type { BaseTrackPlaylist, LibraryTrack } from "../../types/library";
import type { SessionBaseMode } from "./sessionDisplay";
import {
  buildSessionSetupBaseModeTabs,
  buildSessionSetupBaseSummary,
  buildSessionSetupPlaylistOptions,
  buildSessionSetupTrackOptions,
  resolveSessionSetupBaseEmptyState,
} from "./sessionSetupBaseSelectionCardRuntime";

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
  const modeTabs = buildSessionSetupBaseModeTabs({
    t,
    baseMode,
    trackCount: tracks.length,
    playlistCount: playlists.length,
  });
  const emptyState = resolveSessionSetupBaseEmptyState({
    t,
    baseMode,
    trackCount: tracks.length,
    playlistCount: playlists.length,
  });
  const trackOptions = buildSessionSetupTrackOptions({ tracks, selectedTrackId });
  const playlistOptions = buildSessionSetupPlaylistOptions({
    playlists,
    tracks,
    selectedPlaylistId,
    t,
  });
  const summary = buildSessionSetupBaseSummary({
    t,
    selectedBaseLabel,
    selectedBaseDetail,
  });

  return (
    <div className="audio-path-card monitor-setup-card">
      <span>{t.session.stepBaseTitle}</span>
      <p className="monitor-empty-hint">{t.session.stepBaseHelp}</p>

      <div className="session-mode-tabs">
        {modeTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`session-mode-tab${tab.active ? " active" : ""}`}
            onClick={() => onBaseModeChange(tab.id)}
            disabled={tab.disabled}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {emptyState ? (
        <p className="placeholder">{emptyState}</p>
      ) : baseMode === "track" ? (
        <div className="session-asset-options">
          {trackOptions.map((track) => (
            <button
              key={track.id}
              type="button"
              className={`session-asset-option${track.selected ? " selected" : ""}`}
              onClick={() => onTrackSelect(track.id)}
            >
              <span className="session-asset-title">{track.title}</span>
              <span className="session-asset-path">{track.detail}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="session-asset-options">
          {playlistOptions.map((playlist) => (
            <button
              key={playlist.id}
              type="button"
              className={`session-asset-option${playlist.selected ? " selected" : ""}`}
              onClick={() => onPlaylistSelect(playlist.id)}
            >
              <span className="session-asset-title">{playlist.title}</span>
              <span className="session-asset-path">{playlist.detail}</span>
            </button>
          ))}
        </div>
      )}

      {summary && (selectedTrack || selectedPlaylist) ? (
        <div className="monitor-source-summary">
          <small>{summary.eyebrow}</small>
          <strong>{summary.title}</strong>
          <small style={{ marginTop: 4 }}>{summary.detail}</small>
        </div>
      ) : null}
    </div>
  );
}
