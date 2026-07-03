import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import type { SessionEvent } from "../../api/sessions";
import type { SourceTemplate } from "../../config/sourceTemplates";
import type { GuideTrackPCM } from "./monitorAudioRuntimeTypes";
import type { ActiveMonitorSession, MonitorMetrics, StreamListener } from "./monitorContextTypes";
import type { MonitorProviderRuntimeLogger } from "./monitorProviderOrchestrationRuntime";

export interface MonitorProviderRuntimeSessionSlice {
  sessionRef: MutableRefObject<ActiveMonitorSession | null>;
  setSession: Dispatch<SetStateAction<ActiveMonitorSession | null>>;
  setIsPlayback: Dispatch<SetStateAction<boolean>>;
  setMetrics: Dispatch<SetStateAction<MonitorMetrics>>;
}

export interface MonitorProviderRuntimeAudioSlice {
  audioContextRef: MutableRefObject<AudioContext | null>;
  setAudioContext: Dispatch<SetStateAction<AudioContext | null>>;
  guideTrackRef: MutableRefObject<GuideTrackPCM | null>;
  guideTrackCursorRef: MutableRefObject<{ current: number }>;
  guideTrackFinishedRef: MutableRefObject<boolean>;
}

export interface MonitorProviderRuntimePlaybackSlice {
  replayEventsRef: MutableRefObject<SessionEvent[]>;
  replayMetricsRef: MutableRefObject<MonitorMetrics[]>;
  replayIndexRef: MutableRefObject<number>;
  replayHydratingRef: MutableRefObject<boolean>;
  replayHydrationTokenRef: MutableRefObject<number>;
  playbackPausedRef: MutableRefObject<boolean>;
  setPlaybackProgress: Dispatch<SetStateAction<number | null>>;
  setIsPlaybackPaused: Dispatch<SetStateAction<boolean>>;
  setPlaybackEventIndex: Dispatch<SetStateAction<number | null>>;
  setPlaybackEventCount: Dispatch<SetStateAction<number | null>>;
}

export interface MonitorProviderRuntimeLiveSlice {
  activeRef: MutableRefObject<boolean>;
  pollTimerRef: MutableRefObject<number | null>;
  wsRef: MutableRefObject<WebSocket | null>;
  wsLineBufferRef: MutableRefObject<string[]>;
  httpUrlRef: MutableRefObject<string>;
  directCursorRef: MutableRefObject<number | undefined>;
  emptyWindowsRef: MutableRefObject<number>;
  pollIndexRef: MutableRefObject<number>;
  isPlaybackRef: MutableRefObject<boolean>;
  listenersRef: MutableRefObject<Set<StreamListener>>;
}

export interface MonitorProviderRuntimeTemplateSlice {
  activeTemplateRef: MutableRefObject<SourceTemplate>;
  setActiveTemplateState: Dispatch<SetStateAction<SourceTemplate>>;
  buildReloadPendingGuideTrack: (reason: "session-start" | "attach-session") => () => void;
}

export interface UseMonitorProviderRuntimeOrchestrationInput {
  logger: MonitorProviderRuntimeLogger;
  session: MonitorProviderRuntimeSessionSlice;
  audio: MonitorProviderRuntimeAudioSlice;
  playback: MonitorProviderRuntimePlaybackSlice;
  live: MonitorProviderRuntimeLiveSlice;
  template: MonitorProviderRuntimeTemplateSlice;
  transport: import("./monitorProviderRuntimeOrchestrationIoTypes").MonitorProviderRuntimeTransportSlice;
  persistence: import("./monitorProviderRuntimeOrchestrationIoTypes").MonitorProviderRuntimePersistenceSlice;
}
