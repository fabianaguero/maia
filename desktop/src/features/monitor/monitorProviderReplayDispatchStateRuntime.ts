import type { MutableRefObject } from "react";

import type { SessionEvent } from "../../api/sessions";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { ActiveMonitorSession } from "./monitorContextTypes";

export function buildDispatchReplayEventAtIndexStateInput(input: {
  eventIndex: number;
  replayEventsRef: MutableRefObject<SessionEvent[]>;
  replayIndexRef: MutableRefObject<number>;
  sessionRef: MutableRefObject<ActiveMonitorSession | null>;
  emitUpdate: (
    update: LiveLogStreamUpdate,
    options?: {
      accumulateMetrics?: boolean;
      persistPlaybackEvent?: boolean;
    },
  ) => void;
  syncReplayTelemetry: (processedEvents: number) => void;
  syncGuideTrackToReplayProgress: (progress: number) => void;
  syncGuideTrack?: boolean;
}) {
  return {
    eventIndex: input.eventIndex,
    replayEventsRef: input.replayEventsRef,
    replayIndexRef: input.replayIndexRef,
    sessionRef: input.sessionRef,
    emitUpdate: input.emitUpdate,
    syncReplayTelemetry: input.syncReplayTelemetry,
    syncGuideTrackToReplayProgress: input.syncGuideTrackToReplayProgress,
    syncGuideTrack: input.syncGuideTrack,
  };
}
