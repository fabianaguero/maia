import type { LibraryTrack } from "../../../types/library";
import { useT } from "../../../i18n/I18nContext";
import { formatShortDateTime } from "../../../utils/date";
import { getTrackAvailabilityLabel, getTrackSourcePath, getTrackTitle } from "../../../utils/track";

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
  const t = useT();
  return (
    <div className="table-shell">
      <table className="tracks-table">
        <thead>
          <tr>
            <th>{t.library.tables.tracks.track}</th>
            <th>{t.library.tables.tracks.source}</th>
            <th>{t.inspect.detectedBpm}</th>
            <th>{t.library.tables.tracks.repoBpm}</th>
            <th>{t.library.tables.tracks.status}</th>
            <th>{t.library.tables.tracks.imported}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {tracks.map((track) => {
            const selected = track.id === selectedTrackId;
            const isMissing = track.file.availabilityState === "missing";

            return (
              <tr
                key={track.id}
                className={
                  `${selected ? "selected " : ""}${isMissing ? "track-missing" : ""}`.trim() ||
                  undefined
                }
                onClick={() => onSelectTrack(track.id)}
              >
                <td>
                  <strong>{getTrackTitle(track)}</strong>
                  <small>
                    {track.file.fileExtension} · {track.tags.musicStyleLabel}
                    {isMissing ? ` · ${t.library.lost.toUpperCase()}` : ""}
                  </small>
                </td>
                <td title={track.file.sourcePath}>{getTrackSourcePath(track)}</td>
                <td>
                  {track.analysis.bpm ? Math.round(track.analysis.bpm) : t.library.tables.tracks.pending}
                  <small>{t.library.tables.tracks.confidence.replace("{value}", String(Math.round(track.analysis.bpmConfidence * 100)))}</small>
                </td>
                <td>{track.analysis.repoSuggestedBpm ?? t.library.tables.tracks.pending}</td>
                <td>
                  {!track.analysis.bpm && onReanalyze ? (
                    <button
                      type="button"
                      className="table-action"
                      onClick={(event) => {
                        event.stopPropagation();
                        void onReanalyze(track.id);
                      }}
                    >
                      {t.library.tables.tracks.reanalyze}
                    </button>
                  ) : (
                    <>
                      {track.analysis.analyzerStatus}
                      <small>{getTrackAvailabilityLabel(track)}</small>
                    </>
                  )}
                </td>
                <td>{formatShortDateTime(track.analysis.importedAt)}</td>
                <td>
                  <button
                    type="button"
                    className="table-action"
                    onClick={(event) => {
                      event.stopPropagation();
                      onInspectTrack(track.id);
                    }}
                  >
                    {t.library.tables.tracks.open}
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
