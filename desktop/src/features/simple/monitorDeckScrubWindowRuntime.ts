import {
  resolveStoppedMonitorScrubPointerState,
  shouldProcessMonitorScrubPointer,
} from "./monitorDeckScrubOrchestrationRuntime";
import type { MonitorDeckScrubRefs } from "./monitorDeckScrubControllerTypes";

export function buildMonitorDeckScrubWindowHandlers(input: {
  refs: Pick<
    MonitorDeckScrubRefs,
    | "isOverviewScrubbingRef"
    | "activeOverviewPointerIdRef"
    | "isDeckScrubbingRef"
    | "activeDeckPointerIdRef"
  >;
  seekTrackFromOverviewViewport: (clientX: number) => void;
  seekTrackFromViewport: (clientX: number) => void;
}) {
  return {
    handlePointerMove: (event: globalThis.PointerEvent) => {
      if (
        shouldProcessMonitorScrubPointer({
          isScrubbing: input.refs.isOverviewScrubbingRef.current,
          activePointerId: input.refs.activeOverviewPointerIdRef.current,
          eventPointerId: event.pointerId,
        })
      ) {
        input.seekTrackFromOverviewViewport(event.clientX);
      }

      if (
        shouldProcessMonitorScrubPointer({
          isScrubbing: input.refs.isDeckScrubbingRef.current,
          activePointerId: input.refs.activeDeckPointerIdRef.current,
          eventPointerId: event.pointerId,
        })
      ) {
        input.seekTrackFromViewport(event.clientX);
      }
    },
    stopScrubbing: (event: globalThis.PointerEvent) => {
      const overviewState = resolveStoppedMonitorScrubPointerState({
        activePointerId: input.refs.activeOverviewPointerIdRef.current,
        eventPointerId: event.pointerId,
      });
      input.refs.isOverviewScrubbingRef.current = overviewState.isScrubbing;
      input.refs.activeOverviewPointerIdRef.current = overviewState.activePointerId;

      const deckState = resolveStoppedMonitorScrubPointerState({
        activePointerId: input.refs.activeDeckPointerIdRef.current,
        eventPointerId: event.pointerId,
      });
      input.refs.isDeckScrubbingRef.current = deckState.isScrubbing;
      input.refs.activeDeckPointerIdRef.current = deckState.activePointerId;
    },
  };
}
