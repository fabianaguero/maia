import { useRef, useState } from "react";

import type { SessionEvent } from "../../api/sessions";
import type { SourceTemplate } from "../../config/sourceTemplates";
import type { ActiveMonitorSession, MonitorMetrics, StreamListener } from "./monitorContextTypes";
import type { CrossfadeHandle, GuideTrackPCM } from "./monitorContextRuntime";
import { createEmptyMonitorMetrics } from "./monitorReplayRuntime";

export function useMonitorProviderState(input: { initialTemplate: SourceTemplate }) {
  const [session, setSession] = useState<ActiveMonitorSession | null>(null);
  const [isPlayback, setIsPlayback] = useState(false);
  const [metrics, setMetrics] = useState<MonitorMetrics>(createEmptyMonitorMetrics());
  const [guideTrackReady, setGuideTrackReady] = useState(false);
  const [guideTrackPath, setGuideTrackPathState] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState<number | null>(null);
  const [isPlaybackPaused, setIsPlaybackPaused] = useState(false);
  const [playbackEventIndex, setPlaybackEventIndex] = useState<number | null>(null);
  const [playbackEventCount, setPlaybackEventCount] = useState<number | null>(null);
  const [guideTrackDurationSec, setGuideTrackDurationSec] = useState<number | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [activeTemplate, setActiveTemplateState] = useState<SourceTemplate>(input.initialTemplate);

  const audioContextRef = useRef<AudioContext | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const sessionRef = useRef<ActiveMonitorSession | null>(null);
  const listenersRef = useRef<Set<StreamListener>>(new Set());
  const activeRef = useRef(false);
  const guideTrackRef = useRef<GuideTrackPCM | null>(null);
  const guideTrackCursorRef = useRef<{ current: number }>({ current: 0 });
  const guideTrackFinishedRef = useRef(false);
  const directCursorRef = useRef<number | undefined>(undefined);
  const replayEventsRef = useRef<SessionEvent[]>([]);
  const replayMetricsRef = useRef<MonitorMetrics[]>([
    { windowCount: 0, processedLines: 0, totalAnomalies: 0 },
  ]);
  const replayIndexRef = useRef(0);
  const replayHydratingRef = useRef(false);
  const replayHydrationTokenRef = useRef(0);
  const playbackPausedRef = useRef(false);
  const emptyWindowsRef = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);
  const wsLineBufferRef = useRef<string[]>([]);
  const httpUrlRef = useRef("");
  const pollIndexRef = useRef(0);
  const isPlaybackRef = useRef(false);
  const guideTrackPathRef = useRef<string | null>(null);
  const guideTrackQueueRef = useRef<string[]>([]);
  const guideTrackQueueIndexRef = useRef(0);
  const guideTrackLoadPromiseRef = useRef<Promise<void> | null>(null);
  const currentSegmentRef = useRef<CrossfadeHandle | null>(null);
  const activeTemplateRef = useRef<SourceTemplate>(input.initialTemplate);

  return {
    session,
    setSession,
    isPlayback,
    setIsPlayback,
    metrics,
    setMetrics,
    guideTrackReady,
    setGuideTrackReady,
    guideTrackPath,
    setGuideTrackPathState,
    playbackProgress,
    setPlaybackProgress,
    isPlaybackPaused,
    setIsPlaybackPaused,
    playbackEventIndex,
    setPlaybackEventIndex,
    playbackEventCount,
    setPlaybackEventCount,
    guideTrackDurationSec,
    setGuideTrackDurationSec,
    audioContext,
    setAudioContext,
    activeTemplate,
    setActiveTemplateState,
    audioContextRef,
    pollTimerRef,
    sessionRef,
    listenersRef,
    activeRef,
    guideTrackRef,
    guideTrackCursorRef,
    guideTrackFinishedRef,
    directCursorRef,
    replayEventsRef,
    replayMetricsRef,
    replayIndexRef,
    replayHydratingRef,
    replayHydrationTokenRef,
    playbackPausedRef,
    emptyWindowsRef,
    wsRef,
    wsLineBufferRef,
    httpUrlRef,
    pollIndexRef,
    isPlaybackRef,
    guideTrackPathRef,
    guideTrackQueueRef,
    guideTrackQueueIndexRef,
    guideTrackLoadPromiseRef,
    currentSegmentRef,
    activeTemplateRef,
  };
}
