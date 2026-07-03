import type { MutableRefObject } from "react";

import type { SessionEvent } from "../../api/sessions";
import type { GuideTrackPCM } from "./monitorAudioRuntimeTypes";
import type { ActiveMonitorSession, MonitorMetrics } from "./monitorContextTypes";
import type {
  MonitorPlaybackRuntimeLogger,
  PlaybackSessionSelection,
  PreparedPlaybackMonitorSession,
} from "./monitorPlaybackSessionRuntime";

type SetBooleanState = (value: boolean) => void;
type SetSessionState = (value: ActiveMonitorSession | null) => void;
type SetMetricsState = (value: MonitorMetrics) => void;
type SyncReplayTelemetryFn = (processedEvents: number) => void;
type RebuildReplayEventsFromSourceFn = (input: {
  sessionId: string;
  sourcePath: string;
}) => Promise<SessionEvent[]>;

export interface MonitorProviderPlaybackSessionSharedStateInput {
  sessionRef: MutableRefObject<ActiveMonitorSession | null>;
  activeRef: MutableRefObject<boolean>;
  isPlaybackRef: MutableRefObject<boolean>;
  playbackPausedRef: MutableRefObject<boolean>;
  replayEventsRef: MutableRefObject<SessionEvent[]>;
  replayMetricsRef: MutableRefObject<MonitorMetrics[]>;
  replayIndexRef: MutableRefObject<number>;
  replayHydratingRef: MutableRefObject<boolean>;
  replayHydrationTokenRef: MutableRefObject<number>;
  pollTimerRef: MutableRefObject<number | null>;
  setSession: SetSessionState;
  setIsPlayback: SetBooleanState;
  setIsPlaybackPaused: SetBooleanState;
  setMetrics: SetMetricsState;
  syncReplayTelemetry: SyncReplayTelemetryFn;
  ensureAudioContext: () => Promise<unknown>;
  guideTrackPathRef: MutableRefObject<string | null>;
  guideTrackQueueRef: MutableRefObject<string[]>;
  guideTrackRef: MutableRefObject<GuideTrackPCM | null>;
  guideTrackLoadPromiseRef: MutableRefObject<Promise<void> | null>;
  awaitGuideTrack: () => Promise<void>;
  replayTick: () => void;
  rebuildReplayEventsFromSource: RebuildReplayEventsFromSourceFn;
  setTimeoutFn: (handler: () => void, timeout: number) => number;
  logger: MonitorPlaybackRuntimeLogger;
}

export interface StartMonitorProviderPlaybackSessionStateInput
  extends PlaybackSessionSelection, MonitorProviderPlaybackSessionSharedStateInput {
  stopPolling: () => void;
  loadSessionEvents: (sessionId: string) => Promise<SessionEvent[]>;
}

export interface ActivateAndBootstrapPlaybackSessionStateInput extends MonitorProviderPlaybackSessionSharedStateInput {
  prepared: PreparedPlaybackMonitorSession;
}
