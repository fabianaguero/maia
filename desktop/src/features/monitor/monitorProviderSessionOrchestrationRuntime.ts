import type { SessionEvent } from "../../api/sessions";
import type { StartSessionInput } from "../../types/monitor";
import type {
  IngestStreamChunkFn,
  MonitorProviderRuntimePersistenceSlice,
  PollLogStreamFn,
  PollStreamSessionFn,
} from "./monitorProviderRuntimeOrchestrationTypes";
import type {
  MonitorProviderOrchestrationControllerState,
  MonitorProviderSessionControllerState,
} from "./monitorProviderControllerStateTypes";
import type { MonitorProviderGuideTrackLogger } from "./monitorProviderGuideTrackTypes";
import type { MonitorProviderRuntimeLogger } from "./monitorProviderOrchestrationRuntime";
import type { BuildLiveStartInputFn } from "./monitorProviderSessionActionTypes";
import { buildMonitorProviderRuntimeOrchestrationInputFromState } from "./monitorProviderControllerRuntime";
import { buildMonitorProviderSessionActionsInputFromState } from "./monitorProviderSessionControllerRuntime";

export interface UseMonitorProviderSessionOrchestrationInput {
  state: MonitorProviderOrchestrationControllerState & MonitorProviderSessionControllerState;
  logger: MonitorProviderRuntimeLogger & MonitorProviderGuideTrackLogger;
  buildReloadPendingGuideTrack: (reason: "session-start" | "attach-session") => () => void;
  transport: {
    pollStreamSession: PollStreamSessionFn;
    pollLogStream: PollLogStreamFn;
    ingestStreamChunk: IngestStreamChunkFn;
    fetchText: (url: string) => Promise<string>;
  };
  sessionApi: {
    startStreamSession: (input: StartSessionInput) => Promise<unknown>;
    stopStreamSession: (sessionId: string) => Promise<unknown>;
    listSessionEvents: (sessionId: string) => Promise<SessionEvent[]>;
  };
  persistence: MonitorProviderRuntimePersistenceSlice;
}

interface MonitorProviderSessionOrchestrationRuntimeCallbacks {
  stopPolling: () => void;
  buildLiveStartInput: BuildLiveStartInputFn;
  ensureProviderAudioContext: () => Promise<AudioContext>;
  replayTick: () => void;
  syncReplayTelemetry: (processedEvents: number) => void;
  resetReplayTelemetry: () => void;
}

export function buildMonitorProviderSessionOrchestrationDependencies(
  input: UseMonitorProviderSessionOrchestrationInput,
) {
  const runtimeOrchestrationInput = buildMonitorProviderRuntimeOrchestrationInputFromState({
    logger: input.logger,
    state: input.state,
    buildReloadPendingGuideTrack: input.buildReloadPendingGuideTrack,
    pollStreamSession: input.transport.pollStreamSession,
    pollLogStream: input.transport.pollLogStream,
    ingestStreamChunk: input.transport.ingestStreamChunk,
    fetchText: input.transport.fetchText,
    updatePersistedSessionCursor: input.persistence.updatePersistedSessionCursor,
    insertSessionEvent: input.persistence.insertSessionEvent,
    updatePersistedSessionStatus: input.persistence.updatePersistedSessionStatus,
  });

  return {
    runtimeOrchestrationInput,
    buildSessionActionsInput: (
      orchestration: MonitorProviderSessionOrchestrationRuntimeCallbacks,
    ) =>
      buildMonitorProviderSessionActionsInputFromState({
        logger: input.logger,
        state: input.state,
        stopPolling: orchestration.stopPolling,
        buildLiveStartInput: orchestration.buildLiveStartInput,
        ensureProviderAudioContext: orchestration.ensureProviderAudioContext,
        replayTick: orchestration.replayTick,
        syncReplayTelemetry: orchestration.syncReplayTelemetry,
        resetReplayTelemetry: orchestration.resetReplayTelemetry,
        startStreamSession: input.sessionApi.startStreamSession,
        stopStreamSession: input.sessionApi.stopStreamSession,
        listSessionEvents: input.sessionApi.listSessionEvents,
        updatePersistedSessionStatus: input.persistence.updatePersistedSessionStatus,
        pollLogStream: input.transport.pollLogStream,
      }),
  };
}
