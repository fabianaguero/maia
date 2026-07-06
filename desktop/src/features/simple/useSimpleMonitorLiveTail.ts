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
}

export function useSimpleMonitorLiveTail({
  liveLines,
  selectedAnomalyId,
  onSelectAnomalyId,
}: UseSimpleMonitorLiveTailInput) {
  const terminalLinesRef = useRef<HTMLDivElement | null>(null);
  const isTailPinnedRef = useRef(true);
  const focusSelectedLogRef = useRef(false);
  const lineRefs = useRef(new Map<string, HTMLDivElement>());

  useEffect(() => {
    const container = terminalLinesRef.current;
    if (!container) {
      return;
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
      safeElementScrollTo(container, container.scrollHeight, "auto");
    }
  }, [liveLines, selectedAnomalyId]);

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
