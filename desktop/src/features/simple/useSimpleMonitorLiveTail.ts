import { useEffect, useRef, type UIEvent } from "react";

import type { MonitorLogLine } from "./monitorLogParsing";
import {
  buildSimpleMonitorLiveTailEffectState,
  buildSimpleMonitorLiveTailFocusState,
  buildSimpleMonitorLiveTailScrollState,
} from "./simpleMonitorLiveTailRuntime";

function safeElementScrollTo(element: HTMLDivElement, top: number, behavior: ScrollBehavior): void {
  if (typeof element.scrollTo === "function") {
    element.scrollTo({ top, behavior });
    return;
  }

  element.scrollTop = top;
}

interface UseSimpleMonitorLiveTailInput {
  liveLines: MonitorLogLine[];
  selectedAnomalyId: string | null;
  onSelectAnomalyId: (anomalyId: string) => void;
  trackWaveProgress: number; // 0-1, synchronized with waveform playhead
  deckDurationSeconds: number | null;
}

export function useSimpleMonitorLiveTail({
  liveLines,
  selectedAnomalyId,
  onSelectAnomalyId,
  trackWaveProgress,
  deckDurationSeconds,
}: UseSimpleMonitorLiveTailInput) {
  const terminalLinesRef = useRef<HTMLDivElement | null>(null);
  const isTailPinnedRef = useRef(true);
  const focusSelectedLogRef = useRef(false);
  const lineRefs = useRef(new Map<string, HTMLDivElement>());

  useEffect(() => {
    const container = terminalLinesRef.current;
    if (!container) {
      console.debug("[useSimpleMonitorLiveTail] no container ref");
      return;
    }

    console.log(
      "[useSimpleMonitorLiveTail] effect: %d lines, wave=%.1f%%, isPinned=%s",
      liveLines.length,
      trackWaveProgress * 100,
      isTailPinnedRef.current,
    );

    // Sync with waveform playhead position
    if (deckDurationSeconds && liveLines.length > 0 && !focusSelectedLogRef.current) {
      const currentTimeSeconds = trackWaveProgress * deckDurationSeconds;
      let targetLine: HTMLDivElement | null = null;
      let closestTimeDiff = Infinity;

      // Find line closest to current playback time
      for (const [lineId, lineElement] of lineRefs.current.entries()) {
        const line = liveLines.find(l => l.id === lineId);
        if (!line || !line.timestamp) continue;

        // Parse ISO timestamp to seconds
        const lineTime = parseFloat(line.timestamp);
        if (isNaN(lineTime)) continue;

        const timeDiff = Math.abs(lineTime - currentTimeSeconds);
        if (timeDiff < closestTimeDiff) {
          closestTimeDiff = timeDiff;
          targetLine = lineElement;
        }
      }

      // Scroll to line that matches current playback time
      if (targetLine && closestTimeDiff < 5) { // 5 second tolerance
        targetLine.scrollIntoView({ block: "center", behavior: "smooth" });
        console.log("[useSimpleMonitorLiveTail] synced to playback position (timeDiff=%.1fs)", closestTimeDiff);
        return;
      }
    }

    const syncPlan = buildSimpleMonitorLiveTailEffectState({
      liveLines,
      selectedAnomalyId,
      shouldFocusSelectedLog: focusSelectedLogRef.current,
      isTailPinned: isTailPinnedRef.current,
    });

    if (syncPlan.type === "focus") {
      const node = lineRefs.current.get(syncPlan.lineId);
      if (node) {
        node.scrollIntoView({ block: "nearest", behavior: "smooth" });
        focusSelectedLogRef.current = false;
      }
      return;
    }

    if (syncPlan.type === "pin") {
      console.log("[useSimpleMonitorLiveTail] tail pinned - scrolling to bottom");
      safeElementScrollTo(container, container.scrollHeight, "smooth");
    }
  }, [liveLines, trackWaveProgress, selectedAnomalyId, deckDurationSeconds]);

  return {
    terminalLinesRef,
    onTerminalScroll: (event: UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget;
      const distanceFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
      isTailPinnedRef.current = buildSimpleMonitorLiveTailScrollState({
        distanceFromBottom,
      }).isTailPinned;
    },
    registerLineRef: (lineId: string, node: HTMLDivElement | null) => {
      if (node) {
        lineRefs.current.set(lineId, node);
      } else {
        lineRefs.current.delete(lineId);
      }
    },
    focusAnomaly: (anomalyId: string) => {
      const focusState = buildSimpleMonitorLiveTailFocusState(anomalyId);
      focusSelectedLogRef.current = focusState.shouldFocusSelectedLog;
      onSelectAnomalyId(focusState.anomalyId);
    },
  };
}
