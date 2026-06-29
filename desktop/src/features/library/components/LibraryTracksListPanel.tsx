import { AudioWaveform, Trash2 } from "lucide-react";

import { useT } from "../../../i18n/I18nContext";
import type { LibraryTrack } from "../../../types/library";
import { buildLibraryTracksViewModel } from "../libraryTracksViewModel";

interface LibraryTracksListPanelProps {
  newlyImportedId?: string | null;
  selectedTrackId: string | null;
  tracks: LibraryTrack[];
  onDeleteTrack: (trackId: string) => Promise<boolean>;
  onInspectTrack: (trackId: string) => void;
  onReanalyzeTrack: (trackId: string) => Promise<boolean>;
  onRelinkTrack: (trackId: string) => Promise<boolean>;
  onSelectTrack: (trackId: string) => void;
}

export function LibraryTracksListPanel({
  newlyImportedId,
  selectedTrackId,
  tracks,
  onDeleteTrack,
  onInspectTrack,
  onReanalyzeTrack,
  onRelinkTrack,
  onSelectTrack,
}: LibraryTracksListPanelProps) {
  const t = useT();
  const viewModel = buildLibraryTracksViewModel({
    newlyImportedId,
    selectedTrackId,
    t,
    tracks,
  });

  return (
    <ul className="asset-card-list">
      {viewModel.map((track) => (
        <li
          key={track.id}
          className={`asset-card${track.isSelected ? " selected" : ""}${track.isNewlyImported ? " just-imported" : ""}${track.isMissing ? " asset-card-missing" : ""}`}
          onClick={() => onSelectTrack(track.id)}
        >
          <div className="asset-card-icon track-icon">
            <AudioWaveform size={18} />
          </div>
          <div className="asset-card-body">
            <strong className="asset-card-title">{track.title}</strong>
            <div className="asset-card-meta">{track.meta}</div>
            <span className="asset-card-date">{track.importedAtLabel}</span>
          </div>
          <div className="asset-card-actions">
            {track.isMissing ? (
              <button
                type="button"
                className="card-action-btn"
                onClick={(event) => {
                  event.stopPropagation();
                  void onRelinkTrack(track.id);
                }}
              >
                {t.library.relink}
              </button>
            ) : null}
            <button
              type="button"
              className="card-action-btn"
              onClick={(event) => {
                event.stopPropagation();
                track.shouldAnalyze ? void onReanalyzeTrack(track.id) : onInspectTrack(track.id);
              }}
            >
              {track.actionLabel}
            </button>
            <button
              type="button"
              className="card-action-delete"
              title={t.library.deleteTrack}
              onClick={(event) => {
                event.stopPropagation();
                void onDeleteTrack(track.id);
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
