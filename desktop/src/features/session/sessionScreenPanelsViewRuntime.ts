import type { ComponentProps } from "react";

import type { PersistedSession, SessionBookmark } from "../../api/sessions";
import type { ReplayFeedbackRecommendation } from "../../utils/replayFeedback";
import type { QuickSessionMode, SessionBaseMode } from "./sessionDisplay";
import type { SessionBookmarkContext } from "./sessionScreenRuntime";
import type { BaseTrackPlaylist, LibraryTrack, RepositoryAnalysis } from "../../types/library";
import type { SessionSavedSessionsPanel } from "./SessionSavedSessionsPanel";
import type { SessionSetupPanel } from "./SessionSetupPanel";

export function buildSessionSetupPanelProps(input: {
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
  onTrackSelect: (trackId: string | null) => void;
  onPlaylistSelect: (playlistId: string | null) => void;
  onModeChange: (mode: QuickSessionMode) => void;
  onSourceSelect: (sourceId: string | null) => void;
  onSessionLabelChange: (value: string) => void;
  onCreateSession: () => void;
}): ComponentProps<typeof SessionSetupPanel> {
  return {
    ...input,
    onTrackSelect: (trackId: string) => input.onTrackSelect(trackId),
    onPlaylistSelect: (playlistId: string) => input.onPlaylistSelect(playlistId),
    onSourceSelect: (sourceId: string) => input.onSourceSelect(sourceId),
  };
}

export function buildSessionSavedSessionsPanelProps(input: {
  sessions: PersistedSession[];
  loading: boolean;
  mutating: boolean;
  selectedSessionId: string | null;
  selectedSession: PersistedSession | null;
  selectedSessionBookmarks: SessionBookmark[];
  selectedSessionReplayFeedbackRecommendation: ReplayFeedbackRecommendation | null;
  sessionBookmarksBySessionId: Record<string, SessionBookmark[]>;
  bookmarkContexts: Record<number, SessionBookmarkContext>;
  activeSessionId: string | null;
  activeSessionMode: "live" | "playback" | null;
  liveWindowCount: number;
  liveProcessedLines: number;
  liveTotalAnomalies: number;
  onSelectSession: (sessionId: string) => void;
  onResumeSession: (sessionId: string) => void;
  onPlaybackSession: (session: PersistedSession) => Promise<void>;
  onReplayBookmark: (session: PersistedSession, replayWindowIndex: number) => Promise<void>;
  onDeleteSession: (sessionId: string) => void;
}): ComponentProps<typeof SessionSavedSessionsPanel> {
  return input;
}
