import type { SessionEvent } from "../../api/sessions";
import type { LiveLogStreamUpdate, StartSessionInput } from "../../types/monitor";
import type { MonitorProviderLiveStartBaseInput } from "./monitorProviderStartRuntime";
import type { UseMonitorProviderSessionActionsInput } from "./monitorProviderSessionActionTypes";

export function buildMonitorProviderSessionRuntimeSlice(input: {
  stopPolling: () => void;
  buildLiveStartInput: (
    reason: "session-start" | "attach-session",
    includeProbe: boolean,
  ) => MonitorProviderLiveStartBaseInput;
  ensureProviderAudioContext: () => Promise<AudioContext>;
  replayTick: () => void;
  syncReplayTelemetry: (processedEvents: number) => void;
  resetReplayTelemetry: () => void;
}): UseMonitorProviderSessionActionsInput["runtime"] {
  return {
    stopPolling: input.stopPolling,
    buildLiveStartInput: input.buildLiveStartInput,
    ensureProviderAudioContext: input.ensureProviderAudioContext,
    replayTick: input.replayTick,
    syncReplayTelemetry: input.syncReplayTelemetry,
    resetReplayTelemetry: input.resetReplayTelemetry,
  };
}

export function buildMonitorProviderSessionApiSlice(input: {
  startStreamSession: (input: StartSessionInput) => Promise<unknown>;
  stopStreamSession: (sessionId: string) => Promise<unknown>;
  listSessionEvents: (sessionId: string) => Promise<SessionEvent[]>;
  updatePersistedSessionStatus: (
    persistedSessionId: string,
    status: "active" | "paused" | "stopped",
  ) => Promise<void>;
  pollLogStream: (
    sourcePath: string,
    cursor?: number,
    maxBytes?: number,
  ) => Promise<LiveLogStreamUpdate>;
}): UseMonitorProviderSessionActionsInput["api"] {
  return {
    startStreamSession: input.startStreamSession,
    stopStreamSession: input.stopStreamSession,
    listSessionEvents: input.listSessionEvents,
    updatePersistedSessionStatus: input.updatePersistedSessionStatus,
    pollLogStream: input.pollLogStream,
  };
}
