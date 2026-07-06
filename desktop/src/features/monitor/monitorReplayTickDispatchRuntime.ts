import type { MutableRefObject } from "react";

import type { SessionEvent } from "../../api/sessions";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { ActiveMonitorSession } from "./monitorContextTypes";
import { buildReplayUpdateFromEvent } from "./monitorReplayRuntime";

type EmitUpdateFn = (
  update: LiveLogStreamUpdate,
  options?: {
    accumulateMetrics?: boolean;
    persistPlaybackEvent?: boolean;
  },
) => void;

type SyncReplayTelemetryFn = (processedEvents: number) => void;
type SyncGuideTrackToReplayProgressFn = (progress: number) => void;

export function clearReplayTimer(input: {
  pollTimerRef: MutableRefObject<number | null>;
  clearTimeoutFn: (timer: number) => void;
}): void {
  if (input.pollTimerRef.current !== null) {
    input.clearTimeoutFn(input.pollTimerRef.current);
    input.pollTimerRef.current = null;
  }
}

export function dispatchReplayEventAtIndexState(input: {
  eventIndex: number;
  replayEventsRef: MutableRefObject<SessionEvent[]>;
  replayIndexRef: MutableRefObject<number>;
  sessionRef: MutableRefObject<ActiveMonitorSession | null>;
  emitUpdate: EmitUpdateFn;
  syncReplayTelemetry: SyncReplayTelemetryFn;
  syncGuideTrackToReplayProgress?: SyncGuideTrackToReplayProgressFn;
  syncGuideTrack?: boolean;
}): boolean {
  const events = input.replayEventsRef.current;
  if (events.length === 0) {
    return false;
  }

  const clampedIndex = Math.max(0, Math.min(input.eventIndex, events.length - 1));
  const event = events[clampedIndex]!;
  input.replayIndexRef.current = clampedIndex + 1;

  if (input.syncGuideTrack && input.syncGuideTrackToReplayProgress) {
    input.syncGuideTrackToReplayProgress(events.length > 1 ? clampedIndex / events.length : 0);
  }

  input.syncReplayTelemetry(clampedIndex + 1);
  input.emitUpdate(
    buildReplayUpdateFromEvent(
      event,
      input.sessionRef.current?.sourcePath ?? event.sessionId,
      clampedIndex + 1,
    ),
    {
      accumulateMetrics: false,
      persistPlaybackEvent: false,
    },
  );

  return true;
}
