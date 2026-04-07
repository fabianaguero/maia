import type { LibraryTrack } from "../../../types/library";
import { formatShortDateTime } from "../../../utils/date";

interface TracksTableProps {
  tracks: LibraryTrack[];
  selectedTrackId: string | null;
  onSelectTrack: (trackId: string) => void;
  onInspectTrack: (trackId: string) => void;
  onReanalyze?: (trackId: string) => Promise<boolean>;
}

export function TracksTable({
  tracks,
  selectedTrackId,
  onSelectTrack,
  onInspectTrack,
  onReanalyze,
}: TracksTableProps) {
  return (
    <div className="table-shell">
      <table className="tracks-table">
        <thead>
          <tr>
            <th>Track</th>
            <th>Source</th>
            <th>BPM</th>
            <th>Repo BPM</th>
            <th>Status</th>
            <th>Imported</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {tracks.map((track) => {
            const selected = track.id === selectedTrackId;

            return (
              <tr
                key={track.id}
                className={selected ? "selected" : undefined}
                onClick={() => onSelectTrack(track.id)}
              >
                <td>
                  <strong>{track.title}</strong>
                  <small>
                    {track.fileExtension} · {track.musicStyleLabel}
                  </small>
                </td>
                <td title={track.sourcePath}>{track.sourcePath}</td>
                <td>
                  {track.bpm ? Math.round(track.bpm) : "Pending"}
                  <small>{Math.round(track.bpmConfidence * 100)}% confidence</small>
                </td>
                <td>{track.repoSuggestedBpm ?? "Pending"}</td>
                <td>
                  {onReanalyze ? (
                    <button
                      type="button"
                      className="table-action"
                      onClick={(event) => {
                        event.stopPropagation();
                        void onReanalyze(track.id);
                      }}
                    >
                      Re-analyze
                    </button>
                  ) : (
                    track.analyzerStatus
                  )}
                </td>
                <td>{formatShortDateTime(track.importedAt)}</td>
                <td>
                  <button
                    type="button"
                    className="table-action"
                    onClick={(event) => {
                      event.stopPropagation();
                      onInspectTrack(track.id);
                    }}
                  >
                    Open
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
