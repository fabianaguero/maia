import { useRef } from "react";

import type {
  MonitorProviderRefsState,
  UseMonitorProviderStateInput,
} from "./monitorProviderStateTypes";
import { createEmptyMonitorMetrics } from "./monitorReplayRuntime";

export function useMonitorProviderRefs(
  input: UseMonitorProviderStateInput,
): MonitorProviderRefsState {
  const audioContextRef = useRef<AudioContext | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const sessionRef = useRef<MonitorProviderRefsState["sessionRef"]["current"]>(null);
  const listenersRef = useRef<
    Set<MonitorProviderRefsState["listenersRef"]["current"] extends Set<infer Item> ? Item : never>
  >(new Set());
  const recentUpdatesRef = useRef<MonitorProviderRefsState["recentUpdatesRef"]["current"]>([]);
  const activeRef = useRef(false);
  const guideTrackRef = useRef<MonitorProviderRefsState["guideTrackRef"]["current"]>(null);
  const guideTrackCursorRef = useRef({ current: 0 });
  const guideTrackFinishedRef = useRef(false);
  const directCursorRef = useRef<number | undefined>(undefined);
  const replayEventsRef = useRef<MonitorProviderRefsState["replayEventsRef"]["current"]>([]);
  const replayMetricsRef = useRef([createEmptyMonitorMetrics()]);
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
  const currentSegmentRef = useRef<MonitorProviderRefsState["currentSegmentRef"]["current"]>(null);
  const activeTemplateRef = useRef(input.initialTemplate);

  return {
    audioContextRef,
    pollTimerRef,
    sessionRef,
    listenersRef,
    recentUpdatesRef,
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
