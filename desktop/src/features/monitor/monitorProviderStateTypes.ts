import type { SessionEvent } from "../../api/sessions";
import type { SourceTemplate } from "../../config/sourceTemplates";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { ActiveMonitorSession, MonitorMetrics, StreamListener } from "./monitorContextTypes";
import type { CrossfadeHandle, GuideTrackPCM } from "./monitorAudioRuntimeTypes";

export type UseMonitorProviderStateInput = {
  initialTemplate: SourceTemplate;
};

export type MonitorProviderObservableState = {
  session: ActiveMonitorSession | null;
  setSession: React.Dispatch<React.SetStateAction<ActiveMonitorSession | null>>;
  isPlayback: boolean;
  setIsPlayback: React.Dispatch<React.SetStateAction<boolean>>;
  metrics: MonitorMetrics;
  setMetrics: React.Dispatch<React.SetStateAction<MonitorMetrics>>;
  guideTrackReady: boolean;
  setGuideTrackReady: React.Dispatch<React.SetStateAction<boolean>>;
  guideTrackPath: string | null;
  setGuideTrackPathState: React.Dispatch<React.SetStateAction<string | null>>;
  playbackProgress: number | null;
  setPlaybackProgress: React.Dispatch<React.SetStateAction<number | null>>;
  isPlaybackPaused: boolean;
  setIsPlaybackPaused: React.Dispatch<React.SetStateAction<boolean>>;
  playbackEventIndex: number | null;
  setPlaybackEventIndex: React.Dispatch<React.SetStateAction<number | null>>;
  playbackEventCount: number | null;
  setPlaybackEventCount: React.Dispatch<React.SetStateAction<number | null>>;
  guideTrackDurationSec: number | null;
  setGuideTrackDurationSec: React.Dispatch<React.SetStateAction<number | null>>;
  audioContext: AudioContext | null;
  setAudioContext: React.Dispatch<React.SetStateAction<AudioContext | null>>;
  activeTemplate: SourceTemplate;
  setActiveTemplateState: React.Dispatch<React.SetStateAction<SourceTemplate>>;
};

export type MonitorProviderRefsState = {
  audioContextRef: React.MutableRefObject<AudioContext | null>;
  pollTimerRef: React.MutableRefObject<number | null>;
  sessionRef: React.MutableRefObject<ActiveMonitorSession | null>;
  listenersRef: React.MutableRefObject<Set<StreamListener>>;
  recentUpdatesRef: React.MutableRefObject<LiveLogStreamUpdate[]>;
  activeRef: React.MutableRefObject<boolean>;
  guideTrackRef: React.MutableRefObject<GuideTrackPCM | null>;
  guideTrackCursorRef: React.MutableRefObject<{ current: number }>;
  guideTrackFinishedRef: React.MutableRefObject<boolean>;
  directCursorRef: React.MutableRefObject<number | undefined>;
  replayEventsRef: React.MutableRefObject<SessionEvent[]>;
  replayMetricsRef: React.MutableRefObject<MonitorMetrics[]>;
  replayIndexRef: React.MutableRefObject<number>;
  replayHydratingRef: React.MutableRefObject<boolean>;
  replayHydrationTokenRef: React.MutableRefObject<number>;
  playbackPausedRef: React.MutableRefObject<boolean>;
  emptyWindowsRef: React.MutableRefObject<number>;
  wsRef: React.MutableRefObject<WebSocket | null>;
  wsLineBufferRef: React.MutableRefObject<string[]>;
  httpUrlRef: React.MutableRefObject<string>;
  pollIndexRef: React.MutableRefObject<number>;
  isPlaybackRef: React.MutableRefObject<boolean>;
  guideTrackPathRef: React.MutableRefObject<string | null>;
  guideTrackQueueRef: React.MutableRefObject<string[]>;
  guideTrackQueueIndexRef: React.MutableRefObject<number>;
  guideTrackLoadPromiseRef: React.MutableRefObject<Promise<void> | null>;
  currentSegmentRef: React.MutableRefObject<CrossfadeHandle | null>;
  activeTemplateRef: React.MutableRefObject<SourceTemplate>;
};

export type UseMonitorProviderStateResult = MonitorProviderObservableState &
  MonitorProviderRefsState;
