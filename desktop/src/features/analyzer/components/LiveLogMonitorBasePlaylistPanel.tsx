interface BasePlaylistTrackOption {
  id: string;
  label: string;
  disabled?: boolean;
}

interface SavedPlaylistOption {
  id: string;
  label: string;
}

interface BasePlaylistEditorItem {
  id: string;
  label: string;
  lostTitle: string | null;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

interface LiveLogMonitorBasePlaylistPanelLabels {
  title: string;
  stableBedCopy: string;
  namePlaceholder: string;
  lost: string;
  addBaseTrack: string;
  addAction: string;
  loadSavedPlaylist: string;
  loadAction: string;
  moveUp: (name: string) => string;
  moveDown: (name: string) => string;
  removeFromPlaylist: (name: string) => string;
  intendedListeningBedHint: string;
}

interface LiveLogMonitorBasePlaylistPanelProps {
  playlistName: string;
  labels: LiveLogMonitorBasePlaylistPanelLabels;
  pendingAddTrackId: string;
  pendingLoadPlaylistId: string;
  addTrackOptions: BasePlaylistTrackOption[];
  savedPlaylistOptions: SavedPlaylistOption[];
  playlistItems: BasePlaylistEditorItem[];
  onPlaylistNameChange: (value: string) => void;
  onPendingAddTrackIdChange: (value: string) => void;
  onPendingLoadPlaylistIdChange: (value: string) => void;
  onAddTrack: () => void;
  onLoadPlaylist: () => void;
  onMoveTrackUp: (trackId: string) => void;
  onMoveTrackDown: (trackId: string) => void;
  onRemoveTrack: (trackId: string) => void;
}

export function LiveLogMonitorBasePlaylistPanel({
  playlistName,
  labels,
  pendingAddTrackId,
  pendingLoadPlaylistId,
  addTrackOptions,
  savedPlaylistOptions,
  playlistItems,
  onPlaylistNameChange,
  onPendingAddTrackIdChange,
  onPendingLoadPlaylistIdChange,
  onAddTrack,
  onLoadPlaylist,
  onMoveTrackUp,
  onMoveTrackDown,
  onRemoveTrack,
}: LiveLogMonitorBasePlaylistPanelProps) {
  return (
    <div className="audio-path-card monitor-setup-card">
      <span>{labels.title}</span>
      <strong>{playlistName}</strong>
      <p className="support-copy">{labels.stableBedCopy}</p>
      <div className="monitor-setup-stack">
        <input
          type="text"
          value={playlistName}
          onChange={(event) => onPlaylistNameChange(event.target.value)}
          placeholder={labels.namePlaceholder}
          aria-label={labels.title}
        />
        {addTrackOptions.length > 0 ? (
          <div className="monitor-setup-row">
            <select
              className="compact-select"
              value={pendingAddTrackId}
              onChange={(event) => onPendingAddTrackIdChange(event.target.value)}
              title={labels.addBaseTrack}
            >
              <option value="">{labels.addBaseTrack}</option>
              {addTrackOptions.map((track) => (
                <option key={track.id} value={track.id} disabled={track.disabled}>
                  {track.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="compact-action"
              disabled={!pendingAddTrackId}
              onClick={onAddTrack}
            >
              {labels.addAction}
            </button>
          </div>
        ) : null}
        {savedPlaylistOptions.length > 0 ? (
          <div className="monitor-setup-row">
            <select
              className="compact-select"
              value={pendingLoadPlaylistId}
              onChange={(event) => onPendingLoadPlaylistIdChange(event.target.value)}
              title={labels.loadSavedPlaylist}
            >
              <option value="">{labels.loadSavedPlaylist}</option>
              {savedPlaylistOptions.map((playlist) => (
                <option key={playlist.id} value={playlist.id}>
                  {playlist.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="compact-action"
              disabled={!pendingLoadPlaylistId}
              onClick={onLoadPlaylist}
            >
              {labels.loadAction}
            </button>
          </div>
        ) : null}
        {playlistItems.length > 0 ? (
          <div className="pill-strip">
            {playlistItems.map((item) => (
              <span
                key={item.id}
                className={`pill-removable${item.lostTitle ? " pill-removable--lost" : ""}`}
              >
                <button
                  type="button"
                  className="pill-reorder"
                  aria-label={labels.moveUp(item.label)}
                  disabled={!item.canMoveUp}
                  onClick={() => onMoveTrackUp(item.id)}
                >
                  ↑
                </button>
                {item.label}
                {item.lostTitle ? (
                  <span className="track-lost-badge" title={item.lostTitle}>
                    {labels.lost}
                  </span>
                ) : null}
                <button
                  type="button"
                  className="pill-reorder"
                  aria-label={labels.moveDown(item.label)}
                  disabled={!item.canMoveDown}
                  onClick={() => onMoveTrackDown(item.id)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  aria-label={labels.removeFromPlaylist(item.label)}
                  onClick={() => onRemoveTrack(item.id)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="monitor-empty-hint">{labels.intendedListeningBedHint}</p>
        )}
      </div>
    </div>
  );
}
