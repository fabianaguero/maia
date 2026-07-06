import type { SessionEvent } from "../../api/sessions";
import type { LiveLogStreamUpdate, StartSessionInput } from "../../types/monitor";
import type { GuideTrackPCM, CrossfadeHandle } from "./monitorAudioRuntimeTypes";
import type { ActiveMonitorSession, MonitorMetrics } from "./monitorContextTypes";
import type { MonitorProviderLiveStartBaseInput } from "./monitorProviderStartRuntime";
import type { MonitorProviderSessionActionsLogger } from "./monitorProviderSessionActionTypes";

export interface BuildMonitorProviderSessionActionsInput {
  logger: MonitorProviderSessionActionsLogger;
  sessionRef: React.MutableRefObject<ActiveMonitorSession | null>;
  setSession: React.Dispatch<React.SetStateAction<ActiveMonitorSession | null>>;
  setIsPlayback: React.Dispatch<React.SetStateAction<boolean>>;
  setIsPlaybackPaused: React.Dispatch<React.SetStateAction<boolean>>;
  setMetrics: React.Dispatch<React.SetStateAction<MonitorMetrics>>;
  isPlayback: boolean;
  activeRef: React.MutableRefObject<boolean>;
  isPlaybackRef: React.MutableRefObject<boolean>;
  directCursorRef: React.MutableRefObject<number | undefined>;
  emptyWindowsRef: React.MutableRefObject<number>;
  currentSegmentRef: React.MutableRefObject<CrossfadeHandle | null>;
  audioContextRef: React.MutableRefObject<AudioContext | null>;
  replayEventsRef: React.MutableRefObject<SessionEvent[]>;
  replayMetricsRef: React.MutableRefObject<MonitorMetrics[]>;
  replayIndexRef: React.MutableRefObject<number>;
  replayHydratingRef: React.MutableRefObject<boolean>;
  replayHydrationTokenRef: React.MutableRefObject<number>;
  playbackPausedRef: React.MutableRefObject<boolean>;
  pollTimerRef: React.MutableRefObject<number | null>;
  guideTrackPathRef: React.MutableRefObject<string | null>;
  guideTrackQueueRef: React.MutableRefObject<string[]>;
  guideTrackRef: React.MutableRefObject<GuideTrackPCM | null>;
  guideTrackLoadPromiseRef: React.MutableRefObject<Promise<void> | null>;
  stopPolling: () => void;
  buildLiveStartInput: (
    reason: "session-start" | "attach-session",
    includeProbe: boolean,
  ) => MonitorProviderLiveStartBaseInput;
  ensureProviderAudioContext: () => Promise<AudioContext>;
  replayTick: () => void;
  syncReplayTelemetry: (processedEvents: number) => void;
  resetReplayTelemetry: () => void;
  startStreamSession: (input: StartSessionInput) => Promise<unknown>;
  stopStreamSession: (sessionId: string) => Promise<unknown>;
  listSessionEvents: (sessionId: string) => Promise<SessionEvent[]>;
  updatePersistedSessionStatus: (
    persistedSessionId: string,
    status: "active" | "paused" | "stopped",
  ) => Promise<void>;
  pollLogStream: (
    sourcePath: string,
    cursor?: number,
    maxBytes?: number,
  ) => Promise<LiveLogStreamUpdate>;
}
