import type { UseMonitorProviderRuntimeOrchestrationInput } from "./monitorProviderRuntimeOrchestrationTypes";
import { buildEmitMonitorProviderUpdateStateInput } from "./monitorProviderOrchestrationRuntime";
import type { emitMonitorProviderUpdateState } from "./monitorProviderLiveRuntime";
import { buildRunMonitorProviderPollStateInput } from "./monitorProviderOrchestrationRuntime";

export function buildMonitorProviderEmitUpdateHookInput(input: {
  source: UseMonitorProviderRuntimeOrchestrationInput;
  update: Parameters<typeof emitMonitorProviderUpdateState>[0]["update"];
  options?: {
    accumulateMetrics?: boolean;
    persistPlaybackEvent?: boolean;
  };
}) {
  const { audio, live, logger, persistence, session } = input.source;

  return buildEmitMonitorProviderUpdateStateInput({
    update: input.update,
    listenersRef: live.listenersRef,
    sessionRef: session.sessionRef,
    pollIndexRef: live.pollIndexRef,
    audioContextRef: audio.audioContextRef,
    setMetrics: session.setMetrics,
    updatePersistedSessionCursor: persistence.updatePersistedSessionCursor,
    insertSessionEvent: persistence.insertSessionEvent,
    logger,
    options: input.options,
  });
}

export function buildMonitorProviderPollTransportHookInput(input: {
  source: UseMonitorProviderRuntimeOrchestrationInput;
  emitUpdate: (
    update: Parameters<typeof emitMonitorProviderUpdateState>[0]["update"],
    options?: {
      accumulateMetrics?: boolean;
      persistPlaybackEvent?: boolean;
    },
  ) => void;
  schedulePoll: (doPoll: () => Promise<void>) => void;
  doPoll: () => Promise<void>;
}) {
  const { live, logger, session, transport } = input.source;

  return buildRunMonitorProviderPollStateInput({
    sessionRef: session.sessionRef,
    activeRef: live.activeRef,
    directCursorRef: live.directCursorRef,
    emptyWindowsRef: live.emptyWindowsRef,
    wsLineBufferRef: live.wsLineBufferRef,
    httpUrlRef: live.httpUrlRef,
    pollStreamSession: transport.pollStreamSession,
    pollLogStream: transport.pollLogStream,
    ingestStreamChunk: transport.ingestStreamChunk,
    fetchText: transport.fetchText,
    emitUpdate: input.emitUpdate,
    schedulePoll: input.schedulePoll,
    doPoll: input.doPoll,
    logger,
  });
}
