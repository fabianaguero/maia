import type { SourceTemplate } from "../../config/sourceTemplates";
import type { SessionEvent } from "../../api/sessions";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { GuideTrackPCM } from "./monitorAudioRuntimeTypes";
import type { ActiveMonitorSession, MonitorMetrics, StreamListener } from "./monitorContextTypes";
import type {
  IngestStreamChunkFn,
  PollLogStreamFn,
  PollStreamSessionFn,
} from "./monitorProviderRuntimeOrchestrationTypes";
import type { MonitorProviderRuntimeLogger } from "./monitorProviderOrchestrationRuntime";

export interface BuildMonitorProviderRuntimeOrchestrationDependencies {
  logger: MonitorProviderRuntimeLogger;
  sessionRef: React.MutableRefObject<ActiveMonitorSession | null>;
  setSession: React.Dispatch<React.SetStateAction<ActiveMonitorSession | null>>;
  setIsPlayback: React.Dispatch<React.SetStateAction<boolean>>;
  setMetrics: React.Dispatch<React.SetStateAction<MonitorMetrics>>;
  audioContextRef: React.MutableRefObject<AudioContext | null>;
  setAudioContext: React.Dispatch<React.SetStateAction<AudioContext | null>>;
  guideTrackRef: React.MutableRefObject<GuideTrackPCM | null>;
  guideTrackCursorRef: React.MutableRefObject<{ current: number }>;
  guideTrackFinishedRef: React.MutableRefObject<boolean>;
  replayEventsRef: React.MutableRefObject<SessionEvent[]>;
  replayMetricsRef: React.MutableRefObject<MonitorMetrics[]>;
  replayIndexRef: React.MutableRefObject<number>;
  replayHydratingRef: React.MutableRefObject<boolean>;
  replayHydrationTokenRef: React.MutableRefObject<number>;
  playbackPausedRef: React.MutableRefObject<boolean>;
  setPlaybackProgress: React.Dispatch<React.SetStateAction<number | null>>;
  setIsPlaybackPaused: React.Dispatch<React.SetStateAction<boolean>>;
  setPlaybackEventIndex: React.Dispatch<React.SetStateAction<number | null>>;
  setPlaybackEventCount: React.Dispatch<React.SetStateAction<number | null>>;
  activeRef: React.MutableRefObject<boolean>;
  pollTimerRef: React.MutableRefObject<number | null>;
  wsRef: React.MutableRefObject<WebSocket | null>;
  wsLineBufferRef: React.MutableRefObject<string[]>;
  httpUrlRef: React.MutableRefObject<string>;
  directCursorRef: React.MutableRefObject<number | undefined>;
  emptyWindowsRef: React.MutableRefObject<number>;
  pollIndexRef: React.MutableRefObject<number>;
  isPlaybackRef: React.MutableRefObject<boolean>;
  listenersRef: React.MutableRefObject<Set<StreamListener>>;
  recentUpdatesRef: React.MutableRefObject<LiveLogStreamUpdate[]>;
  activeTemplateRef: React.MutableRefObject<SourceTemplate>;
  setActiveTemplateState: React.Dispatch<React.SetStateAction<SourceTemplate>>;
  buildReloadPendingGuideTrack: (reason: "session-start" | "attach-session") => () => void;
  pollStreamSession: PollStreamSessionFn;
  pollLogStream: PollLogStreamFn;
  ingestStreamChunk: IngestStreamChunkFn;
  fetchText: (url: string) => Promise<string>;
  updatePersistedSessionCursor: (
    sessionId: string,
    toOffset: number,
    lineCount: number,
    anomalyCount: number,
    suggestedBpm: number | null,
  ) => Promise<void>;
  insertSessionEvent: (payload: {
    sessionId: string;
    pollIndex: number;
    fromOffset: number;
    toOffset: number;
    summary: string;
    suggestedBpm: number | null;
    confidence: number;
    dominantLevel: string;
    lineCount: number;
    anomalyCount: number;
    levelCountsJson: string;
    anomalyMarkersJson: string;
    topComponentsJson: string;
    sonificationCuesJson: string;
    parsedLinesJson: string;
    warningsJson: string;
  }) => Promise<unknown>;
  updatePersistedSessionStatus: (
    persistedSessionId: string,
    status: "active" | "paused" | "stopped",
  ) => Promise<void>;
}
