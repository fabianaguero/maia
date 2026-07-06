import type {
  IngestStreamChunkFn,
  PollLogStreamFn,
  PollStreamSessionFn,
  UseMonitorProviderRuntimeOrchestrationInput,
} from "./monitorProviderRuntimeOrchestrationTypes";

export function buildMonitorProviderRuntimeTransportSlice(input: {
  pollStreamSession: PollStreamSessionFn;
  pollLogStream: PollLogStreamFn;
  ingestStreamChunk: IngestStreamChunkFn;
  fetchText: (url: string) => Promise<string>;
}): UseMonitorProviderRuntimeOrchestrationInput["transport"] {
  return {
    pollStreamSession: input.pollStreamSession,
    pollLogStream: input.pollLogStream,
    ingestStreamChunk: input.ingestStreamChunk,
    fetchText: input.fetchText,
  };
}

export function buildMonitorProviderRuntimePersistenceSlice(input: {
  updatePersistedSessionCursor: UseMonitorProviderRuntimeOrchestrationInput["persistence"]["updatePersistedSessionCursor"];
  insertSessionEvent: UseMonitorProviderRuntimeOrchestrationInput["persistence"]["insertSessionEvent"];
  updatePersistedSessionStatus: UseMonitorProviderRuntimeOrchestrationInput["persistence"]["updatePersistedSessionStatus"];
}): UseMonitorProviderRuntimeOrchestrationInput["persistence"] {
  return {
    updatePersistedSessionCursor: input.updatePersistedSessionCursor,
    insertSessionEvent: input.insertSessionEvent,
    updatePersistedSessionStatus: input.updatePersistedSessionStatus,
  };
}
