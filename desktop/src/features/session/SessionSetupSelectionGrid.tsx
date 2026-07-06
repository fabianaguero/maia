import type { BaseTrackPlaylist, LibraryTrack, RepositoryAnalysis } from "../../types/library";
import type { QuickSessionMode, SessionBaseMode } from "./sessionDisplay";
import { SessionSetupBaseSelectionCard } from "./SessionSetupBaseSelectionCard";
import { SessionSetupSourceSelectionCard } from "./SessionSetupSourceSelectionCard";

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
  return (
    <div className="monitor-setup-grid">
      <SessionSetupBaseSelectionCard
        tracks={tracks}
        playlists={playlists}
        baseMode={baseMode}
        selectedTrackId={selectedTrackId}
        selectedPlaylistId={selectedPlaylistId}
        selectedTrack={selectedTrack}
        selectedPlaylist={selectedPlaylist}
        selectedBaseLabel={selectedBaseLabel}
        selectedBaseDetail={selectedBaseDetail}
        onBaseModeChange={onBaseModeChange}
        onTrackSelect={onTrackSelect}
        onPlaylistSelect={onPlaylistSelect}
      />

      <SessionSetupSourceSelectionCard
        sourceOptions={sourceOptions}
        mode={mode}
        selectedSourceId={selectedSourceId}
        selectedSource={selectedSource}
        onModeChange={onModeChange}
        onSourceSelect={onSourceSelect}
      />
    </div>
  );
}
