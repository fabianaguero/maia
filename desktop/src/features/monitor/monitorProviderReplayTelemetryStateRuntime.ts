import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import type { SessionEvent } from "../../api/sessions";
import type { MonitorMetrics } from "./monitorContextTypes";

type SetMetricsState = Dispatch<SetStateAction<MonitorMetrics>>;
type SetNullableNumberState = Dispatch<SetStateAction<number | null>>;

export function buildSyncReplayTelemetryStateInput(input: {
  processedEvents: number;
  replayEventsRef: MutableRefObject<SessionEvent[]>;
  replayMetricsRef: MutableRefObject<MonitorMetrics[]>;
  setPlaybackEventCount: SetNullableNumberState;
  setPlaybackEventIndex: SetNullableNumberState;
  setPlaybackProgress: SetNullableNumberState;
  setMetrics: SetMetricsState;
}) {
  return {
    processedEvents: input.processedEvents,
    replayEventsRef: input.replayEventsRef,
    replayMetricsRef: input.replayMetricsRef,
    setPlaybackEventCount: input.setPlaybackEventCount,
    setPlaybackEventIndex: input.setPlaybackEventIndex,
    setPlaybackProgress: input.setPlaybackProgress,
    setMetrics: input.setMetrics,
  };
}
