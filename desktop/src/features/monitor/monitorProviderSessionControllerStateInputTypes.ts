import type { SessionEvent } from "../../api/sessions";
import type { LiveLogStreamUpdate, StartSessionInput } from "../../types/monitor";
import type { MonitorProviderSessionControllerState } from "./monitorProviderControllerStateTypes";
import type { MonitorProviderLiveStartBaseInput } from "./monitorProviderStartRuntime";
import type { MonitorProviderSessionActionsLogger } from "./monitorProviderSessionActionTypes";

export interface BuildMonitorProviderSessionActionsInputFromStateInput {
  logger: MonitorProviderSessionActionsLogger;
  state: MonitorProviderSessionControllerState;
  stopPolling: () => void;
  buildLiveStartInput: (
    reason: "session-start" | "attach-session",
    includeProbe: boolean,
  ) => MonitorProviderLiveStartBaseInput;
  ensureProviderAudioContext: () => Promise<AudioContext>;
  replayTick: () => void;
  syncReplayTelemetry: (processedEvents: number) => void;
  resetReplayTelemetry: () => void;
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
}
