import type { ActiveMonitorSession, MonitorMetrics } from "./monitorContextTypes";
import type { GuideTrackPCM } from "./monitorAudioRuntimeTypes";
import type { UseMonitorProviderRuntimeOrchestrationInput } from "./monitorProviderRuntimeOrchestrationTypes";

export function buildMonitorProviderRuntimeSessionSlice(input: {
  sessionRef: React.MutableRefObject<ActiveMonitorSession | null>;
  setSession: React.Dispatch<React.SetStateAction<ActiveMonitorSession | null>>;
  setIsPlayback: React.Dispatch<React.SetStateAction<boolean>>;
  setMetrics: React.Dispatch<React.SetStateAction<MonitorMetrics>>;
}): UseMonitorProviderRuntimeOrchestrationInput["session"] {
  return {
    sessionRef: input.sessionRef,
    setSession: input.setSession,
    setIsPlayback: input.setIsPlayback,
    setMetrics: input.setMetrics,
  };
}

export function buildMonitorProviderRuntimeAudioSlice(input: {
  audioContextRef: React.MutableRefObject<AudioContext | null>;
  setAudioContext: React.Dispatch<React.SetStateAction<AudioContext | null>>;
  guideTrackRef: React.MutableRefObject<GuideTrackPCM | null>;
  guideTrackCursorRef: React.MutableRefObject<{ current: number }>;
  guideTrackFinishedRef: React.MutableRefObject<boolean>;
}): UseMonitorProviderRuntimeOrchestrationInput["audio"] {
  return {
    audioContextRef: input.audioContextRef,
    setAudioContext: input.setAudioContext,
    guideTrackRef: input.guideTrackRef,
    guideTrackCursorRef: input.guideTrackCursorRef,
    guideTrackFinishedRef: input.guideTrackFinishedRef,
  };
}
