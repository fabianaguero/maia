import type { SourceTemplate } from "../../config/sourceTemplates";
import type { RepositoryAnalysis } from "../../types/library";
import type {
  LiveLogStreamUpdate,
  StartSessionInput,
  StreamAdapterKind,
  StreamSessionRecord,
} from "../../types/monitor";

export interface ActiveMonitorSession {
  sessionId: string;
  persistedSessionId: string | null;
  repoId: string;
  repoTitle: string;
  trackId?: string;
  trackName?: string;
  sourcePath: string;
  adapterKind: StreamAdapterKind;
  pollMode: "session" | "direct" | "websocket" | "http-poll";
  startedAt: number;
}

export interface MonitorMetrics {
  windowCount: number;
  processedLines: number;
  totalAnomalies: number;
}

export type StreamListener = (update: LiveLogStreamUpdate) => void;

export interface MonitorContextValue {
  session: ActiveMonitorSession | null;
  metrics: MonitorMetrics;
  isPlayback: boolean;
  guideTrackReady: boolean;
  guideTrackPath: string | null;
  playbackProgress: number | null;
  isPlaybackPaused: boolean;
  playbackEventIndex: number | null;
  playbackEventCount: number | null;
  guideTrackDurationSec: number | null;
  setGuideTrack: (path: string | null) => void;
  setGuideTrackPlaylist: (paths: string[]) => void;
  seekGuideTrack: (second: number) => void;
  startSession: (
    repo: RepositoryAnalysis,
    input: StartSessionInput,
    persistedSessionId?: string,
  ) => Promise<boolean>;
  attachSession: (input: {
    session: StreamSessionRecord;
    repoId: string;
    repoTitle: string;
    trackId?: string;
    trackTitle?: string;
    sourceTemplateId?: string | null;
    persistedSessionId?: string | null;
  }) => Promise<boolean>;
  stopSession: () => Promise<void>;
  playbackSession: (input: {
    sessionId: string;
    label: string;
    sourcePath: string;
    repoId?: string | null;
  }) => Promise<boolean>;
  seekPlaybackProgress: (progress: number) => void;
  seekPlaybackWindow: (replayWindowIndex: number) => void;
  pausePlayback: () => void;
  resumePlayback: () => void;
  stepPlaybackWindow: (direction: -1 | 1) => void;
  subscribe: (listener: StreamListener) => () => void;
  audioContext: AudioContext | null;
  resumeAudio: () => Promise<void>;
  activeTemplate: SourceTemplate;
  setActiveTemplate: (id: string) => void;
}
