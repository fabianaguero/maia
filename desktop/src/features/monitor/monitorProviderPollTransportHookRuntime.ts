import type {
  MonitorProviderRuntimeAudioSlice,
  MonitorProviderRuntimeLiveSlice,
  MonitorProviderRuntimePersistenceSlice,
  MonitorProviderRuntimeSessionSlice,
  MonitorProviderRuntimeTransportSlice,
} from "./monitorProviderRuntimeOrchestrationTypes";
import { buildEmitMonitorProviderUpdateStateInput } from "./monitorProviderOrchestrationRuntime";
import type { emitMonitorProviderUpdateState } from "./monitorProviderLiveRuntime";
import { buildRunMonitorProviderPollStateInput } from "./monitorProviderOrchestrationRuntime";

export function buildMonitorProviderEmitUpdateHookInput(input: {
  audio: MonitorProviderRuntimeAudioSlice;
  live: MonitorProviderRuntimeLiveSlice;
  logger: Parameters<typeof buildEmitMonitorProviderUpdateStateInput>[0]["logger"];
  persistence: MonitorProviderRuntimePersistenceSlice;
  session: MonitorProviderRuntimeSessionSlice;
  update: Parameters<typeof emitMonitorProviderUpdateState>[0]["update"];
  options?: {
    accumulateMetrics?: boolean;
    persistPlaybackEvent?: boolean;
  };
}) {
  return buildEmitMonitorProviderUpdateStateInput({
    update: input.update,
    listenersRef: input.live.listenersRef,
    sessionRef: input.session.sessionRef,
    pollIndexRef: input.live.pollIndexRef,
    audioContextRef: input.audio.audioContextRef,
    setMetrics: input.session.setMetrics,
    updatePersistedSessionCursor: input.persistence.updatePersistedSessionCursor,
    insertSessionEvent: input.persistence.insertSessionEvent,
    logger: input.logger,
    options: input.options,
  });
}

export function buildMonitorProviderPollTransportHookInput(input: {
  live: MonitorProviderRuntimeLiveSlice;
  logger: Parameters<typeof buildRunMonitorProviderPollStateInput>[0]["logger"];
  session: MonitorProviderRuntimeSessionSlice;
  transport: MonitorProviderRuntimeTransportSlice;
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
  return buildRunMonitorProviderPollStateInput({
    sessionRef: input.session.sessionRef,
    activeRef: input.live.activeRef,
    directCursorRef: input.live.directCursorRef,
    emptyWindowsRef: input.live.emptyWindowsRef,
    wsLineBufferRef: input.live.wsLineBufferRef,
    httpUrlRef: input.live.httpUrlRef,
    pollStreamSession: input.transport.pollStreamSession,
    pollLogStream: input.transport.pollLogStream,
    ingestStreamChunk: input.transport.ingestStreamChunk,
    fetchText: input.transport.fetchText,
    emitUpdate: input.emitUpdate,
    schedulePoll: input.schedulePoll,
    doPoll: input.doPoll,
    logger: input.logger,
  });
}
