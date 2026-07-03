import type { SessionEvent } from "../../api/sessions";
import type { SourceTemplate } from "../../config/sourceTemplates";
import type { StartSessionInput } from "../../types/monitor";
import type { GuideTrackPCM } from "./monitorAudioRuntimeTypes";
import type { MonitorContextValue } from "./monitorContextTypes";
import type {
  MonitorProviderOrchestrationControllerState,
  MonitorProviderSessionControllerState,
} from "./monitorProviderControllerStateTypes";
import { buildMonitorProviderPlaybackControlsInput } from "./monitorProviderControllerViewRuntime";
import type { MonitorProviderGuideTrackLogger } from "./monitorProviderGuideTrackTypes";
import type { MonitorProviderRuntimeLogger } from "./monitorProviderOrchestrationRuntime";
import type {
  IngestStreamChunkFn,
  MonitorProviderRuntimePersistenceSlice,
  PollLogStreamFn,
  PollStreamSessionFn,
} from "./monitorProviderRuntimeOrchestrationTypes";

export interface UseMonitorProviderControllerActionsInput {
  state: MonitorProviderOrchestrationControllerState & MonitorProviderSessionControllerState;
  logger: MonitorProviderRuntimeLogger & MonitorProviderGuideTrackLogger;
  resolveSourceTemplate: (id: string) => SourceTemplate;
  decodedAudioCache: Map<string, Promise<GuideTrackPCM>>;
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

export function buildMonitorProviderGuideTrackActionsInput(
  input: UseMonitorProviderControllerActionsInput,
) {
  return {
    state: input.state,
    logger: input.logger,
    resolveSourceTemplate: input.resolveSourceTemplate,
    decodedAudioCache: input.decodedAudioCache,
  };
}

export function buildMonitorProviderSessionOrchestrationInput(input: {
  source: UseMonitorProviderControllerActionsInput;
  buildReloadPendingGuideTrack: (reason: "session-start" | "attach-session") => () => void;
}) {
  return {
    state: input.source.state,
    logger: input.source.logger,
    buildReloadPendingGuideTrack: input.buildReloadPendingGuideTrack,
    transport: input.source.transport,
    sessionApi: input.source.sessionApi,
    persistence: input.source.persistence,
  };
}

export function buildMonitorProviderControllerActionsResult(input: {
  guideTrack: Pick<
    MonitorContextValue,
    "setActiveTemplate" | "seekGuideTrack" | "setGuideTrack" | "setGuideTrackPlaylist"
  >;
  orchestration: Pick<MonitorContextValue, "resumeAudio">;
  sessionActions: Pick<
    MonitorContextValue,
    "startSession" | "attachSession" | "playbackSession" | "stopSession"
  >;
  playbackControls: Pick<
    MonitorContextValue,
    | "seekPlaybackProgress"
    | "seekPlaybackWindow"
    | "pausePlayback"
    | "resumePlayback"
    | "stepPlaybackWindow"
  >;
}) {
  return {
    guideTrack: {
      setActiveTemplate: input.guideTrack.setActiveTemplate,
      seekGuideTrack: input.guideTrack.seekGuideTrack,
      setGuideTrack: input.guideTrack.setGuideTrack,
      setGuideTrackPlaylist: input.guideTrack.setGuideTrackPlaylist,
    },
    orchestration: {
      resumeAudio: input.orchestration.resumeAudio,
    },
    sessionActions: input.sessionActions,
    playbackControls: input.playbackControls,
  };
}

export { buildMonitorProviderPlaybackControlsInput };
