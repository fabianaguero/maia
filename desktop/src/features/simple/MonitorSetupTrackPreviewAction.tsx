import { Pause, Play } from "lucide-react";

import type { LibraryTrack } from "../../types/library";

interface MonitorSetupTrackPreviewActionProps {
  track: LibraryTrack;
  previewTrackId: string | null;
  previewLabel: string;
  pauseLabel: string;
  onToggleTrackPreview: (track: LibraryTrack) => void | Promise<void>;
}

export function MonitorSetupTrackPreviewAction({
  track,
  previewTrackId,
  previewLabel,
  pauseLabel,
  onToggleTrackPreview,
}: MonitorSetupTrackPreviewActionProps) {
  const isPreviewing = previewTrackId === track.id;

  return (
    <button
      type="button"
      className="track-preview-button"
      title={isPreviewing ? pauseLabel : previewLabel}
      onClick={() => {
        void onToggleTrackPreview(track);
      }}
    >
      {isPreviewing ? <Pause size={14} /> : <Play size={14} />}
    </button>
  );
}
