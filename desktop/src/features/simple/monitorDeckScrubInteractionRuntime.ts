import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";

import {
  buildDeckScrubPointerState,
  buildOverviewScrubPointerState,
} from "./monitorDeckScrubOrchestrationRuntime";
import type {
  DeckOverviewScrubMarker,
  MonitorDeckScrubRefs,
} from "./monitorDeckScrubControllerTypes";

export function buildMonitorDeckScrubInteractionHandlers(input: {
  refs: MonitorDeckScrubRefs;
  trackWaveProgress: number;
  isConsoleExpanded: boolean;
  seekToTrackProgress: (progress: number) => void;
  seekTrackFromOverviewViewport: (clientX: number) => void;
  seekTrackFromViewport: (clientX: number) => void;
  onSelectAnomalyForFocus: (anomalyId: string) => void;
  onToggleConsole?: () => void;
}) {
  return {
    handleOverviewPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => {
      const nextState = buildOverviewScrubPointerState(event.pointerId);
      input.refs.isOverviewScrubbingRef.current = nextState.isScrubbing;
      input.refs.activeOverviewPointerIdRef.current = nextState.activePointerId;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      input.seekTrackFromOverviewViewport(event.clientX);
    },
    handleOverviewClick: (event: ReactMouseEvent<HTMLDivElement>) => {
      input.seekTrackFromOverviewViewport(event.clientX);
    },
    handleOverviewAnomalyClick: (
      marker: DeckOverviewScrubMarker,
      event: ReactMouseEvent<HTMLButtonElement>,
    ) => {
      event.stopPropagation();
      if (typeof marker.observedAtMs !== "number") {
        input.seekToTrackProgress(marker.progress);
      }
      input.onSelectAnomalyForFocus(marker.id);
      if (!input.isConsoleExpanded) {
        input.onToggleConsole?.();
      }
    },
    handleOverviewAnomalyPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.stopPropagation();
    },
    handleStagePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const nextState = buildDeckScrubPointerState({
        pointerId: event.pointerId,
        clientX: event.clientX,
        left: rect.left,
        width: rect.width,
        trackWaveProgress: input.trackWaveProgress,
      });
      input.refs.isDeckScrubbingRef.current = nextState.isScrubbing;
      input.refs.activeDeckPointerIdRef.current = nextState.activePointerId;
      input.refs.deckScrubStartRatioRef.current = nextState.startRatio;
      input.refs.deckScrubStartProgressRef.current = nextState.startProgress;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      input.seekTrackFromViewport(event.clientX);
    },
    handleStageClick: (event: ReactMouseEvent<HTMLDivElement>) => {
      input.seekTrackFromViewport(event.clientX);
    },
  };
}
