import type { BaseTrackPlaylist, LibraryTrack, RepositoryAnalysis } from "../../types/library";
import type { QuickSessionMode, SessionBaseMode } from "./sessionDisplay";

export interface SessionSetupPanelProps {
  tracks: LibraryTrack[];
  playlists: BaseTrackPlaylist[];
  sourceOptions: RepositoryAnalysis[];
  mode: QuickSessionMode;
  baseMode: SessionBaseMode;
  selectedTemplateId: string;
  selectedSourceId: string | null;
  selectedTrackId: string | null;
  selectedPlaylistId: string | null;
  selectedSource: RepositoryAnalysis | null;
  selectedTrack: LibraryTrack | null;
  selectedPlaylist: BaseTrackPlaylist | null;
  selectedBaseLabel: string | null;
  selectedBaseDetail: string | null;
  sessionLabel: string;
  sessionLabelPlaceholder: string;
  creating: boolean;
  mutating: boolean;
  onTemplateSelect: (templateId: string) => void;
  onBaseModeChange: (mode: SessionBaseMode) => void;
  onTrackSelect: (trackId: string) => void;
  onPlaylistSelect: (playlistId: string) => void;
  onModeChange: (mode: QuickSessionMode) => void;
  onSourceSelect: (sourceId: string) => void;
  onSessionLabelChange: (value: string) => void;
  onCreateSession: () => void | Promise<void>;
}
