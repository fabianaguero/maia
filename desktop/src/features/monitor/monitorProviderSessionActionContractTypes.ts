import type { RepositoryAnalysis } from "../../types/library";
import type {
  LiveLogStreamUpdate,
  StartSessionInput,
  StreamSessionRecord,
} from "../../types/monitor";
import type { PlaybackSessionSelection } from "./monitorPlaybackRuntime";

export interface MonitorProviderAttachSessionSelection {
  session: StreamSessionRecord;
  repoId: string;
  repoTitle: string;
  trackId?: string;
  trackTitle?: string;
  initialStreamUpdate?: LiveLogStreamUpdate | null;
  sourceTemplateId?: string | null;
  persistedSessionId?: string | null;
}

export interface UseMonitorProviderSessionActionsResult {
  replaceExistingSessionIfPresent: () => Promise<void>;
  startSession: (
    repo: RepositoryAnalysis,
    sessionInput: StartSessionInput,
    persistedSessionId?: string,
  ) => Promise<boolean>;
  attachSession: (input: MonitorProviderAttachSessionSelection) => Promise<boolean>;
  playbackSession: (input: PlaybackSessionSelection) => Promise<boolean>;
  stopSession: () => Promise<void>;
}
