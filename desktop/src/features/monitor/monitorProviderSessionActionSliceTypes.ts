import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import type { SessionEvent } from "../../api/sessions";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { GuideTrackPCM, CrossfadeHandle } from "./monitorAudioRuntimeTypes";
import type { ActiveMonitorSession, MonitorMetrics } from "./monitorContextTypes";
import type {
  BuildLiveStartInputFn,
  ListSessionEventsFn,
  MonitorProviderSessionActionsLogger,
  PollLogStreamFn,
  StartStreamSessionFn,
  StopStreamSessionFn,
} from "./monitorProviderSessionActionBaseTypes";

export interface MonitorProviderSessionStateSlice {
  sessionRef: MutableRefObject<ActiveMonitorSession | null>;
  setSession: Dispatch<SetStateAction<ActiveMonitorSession | null>>;
  setIsPlayback: Dispatch<SetStateAction<boolean>>;
  setIsPlaybackPaused: Dispatch<SetStateAction<boolean>>;
  setMetrics: Dispatch<SetStateAction<MonitorMetrics>>;
  isPlayback: boolean;
}

export interface MonitorProviderSessionLiveSlice {
  activeRef: MutableRefObject<boolean>;
  isPlaybackRef: MutableRefObject<boolean>;
  directCursorRef: MutableRefObject<number | undefined>;
  emptyWindowsRef: MutableRefObject<number>;
  pollTimerRef: MutableRefObject<number | null>;
  recentUpdatesRef: MutableRefObject<LiveLogStreamUpdate[]>;
}

export interface MonitorProviderSessionAudioSlice {
  currentSegmentRef: MutableRefObject<CrossfadeHandle | null>;
  audioContextRef: MutableRefObject<AudioContext | null>;
}

export interface MonitorProviderSessionReplaySlice {
  replayEventsRef: MutableRefObject<SessionEvent[]>;
  replayMetricsRef: MutableRefObject<MonitorMetrics[]>;
  replayIndexRef: MutableRefObject<number>;
  replayHydratingRef: MutableRefObject<boolean>;
  replayHydrationTokenRef: MutableRefObject<number>;
  playbackPausedRef: MutableRefObject<boolean>;
}

export interface MonitorProviderSessionGuideTrackSlice {
  guideTrackPathRef: MutableRefObject<string | null>;
  guideTrackQueueRef: MutableRefObject<string[]>;
  guideTrackRef: MutableRefObject<GuideTrackPCM | null>;
  guideTrackLoadPromiseRef: MutableRefObject<Promise<void> | null>;
}

export interface MonitorProviderSessionRuntimeSlice {
  stopPolling: () => void;
  buildLiveStartInput: BuildLiveStartInputFn;
  ensureProviderAudioContext: () => Promise<AudioContext>;
  replayTick: () => void;
  syncReplayTelemetry: (processedEvents: number) => void;
  resetReplayTelemetry: () => void;
}

export interface MonitorProviderSessionApiSlice {
  startStreamSession: StartStreamSessionFn;
  stopStreamSession: StopStreamSessionFn;
  listSessionEvents: ListSessionEventsFn;
  updatePersistedSessionStatus: (
    persistedSessionId: string,
    status: "active" | "paused" | "stopped",
  ) => Promise<void>;
  pollLogStream: PollLogStreamFn;
}

export interface UseMonitorProviderSessionActionsInput {
  logger: MonitorProviderSessionActionsLogger;
  session: MonitorProviderSessionStateSlice;
  live: MonitorProviderSessionLiveSlice;
  audio: MonitorProviderSessionAudioSlice;
  replay: MonitorProviderSessionReplaySlice;
  guideTrack: MonitorProviderSessionGuideTrackSlice;
  runtime: MonitorProviderSessionRuntimeSlice;
  api: MonitorProviderSessionApiSlice;
}
