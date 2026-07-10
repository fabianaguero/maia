import type { SourceTemplate } from "../../config/sourceTemplates";
import type { SessionEvent } from "../../api/sessions";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { GuideTrackPCM, CrossfadeHandle } from "./monitorAudioRuntimeTypes";
import type { ActiveMonitorSession, MonitorMetrics, StreamListener } from "./monitorContextTypes";

export interface MonitorProviderStateViewModel {
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
  audioContext: AudioContext | null;
  activeTemplate: SourceTemplate;
  setGuideTrackReady: React.Dispatch<React.SetStateAction<boolean>>;
  setGuideTrackPathState: React.Dispatch<React.SetStateAction<string | null>>;
  setGuideTrackDurationSec: React.Dispatch<React.SetStateAction<number | null>>;
  setActiveTemplateState: React.Dispatch<React.SetStateAction<SourceTemplate>>;
  setIsPlaybackPaused: React.Dispatch<React.SetStateAction<boolean>>;
  audioContextRef: React.MutableRefObject<AudioContext | null>;
  listenersRef: React.MutableRefObject<Set<StreamListener>>;
  recentUpdatesRef: React.MutableRefObject<LiveLogStreamUpdate[]>;
  currentSegmentRef: React.MutableRefObject<CrossfadeHandle | null>;
  guideTrackPathRef: React.MutableRefObject<string | null>;
  guideTrackQueueRef: React.MutableRefObject<string[]>;
  guideTrackQueueIndexRef: React.MutableRefObject<number>;
  guideTrackRef: React.MutableRefObject<GuideTrackPCM | null>;
  guideTrackCursorRef: React.MutableRefObject<{ current: number }>;
  guideTrackFinishedRef: React.MutableRefObject<boolean>;
  guideTrackLoadPromiseRef: React.MutableRefObject<Promise<void> | null>;
  activeTemplateRef: React.MutableRefObject<SourceTemplate>;
  replayEventsRef: React.MutableRefObject<SessionEvent[]>;
  replayIndexRef: React.MutableRefObject<number>;
  pollTimerRef: React.MutableRefObject<number | null>;
  playbackPausedRef: React.MutableRefObject<boolean>;
  activeRef: React.MutableRefObject<boolean>;
}

export interface MonitorProviderOrchestrationControllerState extends MonitorProviderStateViewModel {
  sessionRef: React.MutableRefObject<ActiveMonitorSession | null>;
  setSession: React.Dispatch<React.SetStateAction<ActiveMonitorSession | null>>;
  setIsPlayback: React.Dispatch<React.SetStateAction<boolean>>;
  setMetrics: React.Dispatch<React.SetStateAction<MonitorMetrics>>;
  setAudioContext: React.Dispatch<React.SetStateAction<AudioContext | null>>;
  replayMetricsRef: React.MutableRefObject<MonitorMetrics[]>;
  replayHydratingRef: React.MutableRefObject<boolean>;
  replayHydrationTokenRef: React.MutableRefObject<number>;
  setPlaybackProgress: React.Dispatch<React.SetStateAction<number | null>>;
  setPlaybackEventIndex: React.Dispatch<React.SetStateAction<number | null>>;
  setPlaybackEventCount: React.Dispatch<React.SetStateAction<number | null>>;
  wsRef: React.MutableRefObject<WebSocket | null>;
  wsLineBufferRef: React.MutableRefObject<string[]>;
  httpUrlRef: React.MutableRefObject<string>;
  directCursorRef: React.MutableRefObject<number | undefined>;
  emptyWindowsRef: React.MutableRefObject<number>;
  pollIndexRef: React.MutableRefObject<number>;
  isPlaybackRef: React.MutableRefObject<boolean>;
}

export interface MonitorProviderSessionControllerState extends MonitorProviderStateViewModel {
  sessionRef: React.MutableRefObject<ActiveMonitorSession | null>;
  setSession: React.Dispatch<React.SetStateAction<ActiveMonitorSession | null>>;
  setIsPlayback: React.Dispatch<React.SetStateAction<boolean>>;
  setMetrics: React.Dispatch<React.SetStateAction<MonitorMetrics>>;
  isPlaybackRef: React.MutableRefObject<boolean>;
  directCursorRef: React.MutableRefObject<number | undefined>;
  emptyWindowsRef: React.MutableRefObject<number>;
  replayMetricsRef: React.MutableRefObject<MonitorMetrics[]>;
  replayHydratingRef: React.MutableRefObject<boolean>;
  replayHydrationTokenRef: React.MutableRefObject<number>;
}
