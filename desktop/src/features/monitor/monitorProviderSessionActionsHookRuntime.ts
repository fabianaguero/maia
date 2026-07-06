import type {
  MonitorProviderAttachSessionSelection,
  UseMonitorProviderSessionActionsInput,
  UseMonitorProviderSessionActionsResult,
} from "./monitorProviderSessionActionTypes";
import type { PlaybackSessionSelection } from "./monitorPlaybackRuntime";

export interface MonitorProviderSessionLiveActionDependencies {
  api: UseMonitorProviderSessionActionsInput["api"];
  logger: UseMonitorProviderSessionActionsInput["logger"];
  runtime: UseMonitorProviderSessionActionsInput["runtime"];
  session: UseMonitorProviderSessionActionsInput["session"];
}

export interface MonitorProviderSessionStopActionDependencies {
  api: UseMonitorProviderSessionActionsInput["api"];
  audio: UseMonitorProviderSessionActionsInput["audio"];
  live: UseMonitorProviderSessionActionsInput["live"];
  logger: UseMonitorProviderSessionActionsInput["logger"];
  runtime: UseMonitorProviderSessionActionsInput["runtime"];
  session: UseMonitorProviderSessionActionsInput["session"];
}

export interface MonitorProviderSessionLiveBindings {
  replaceExistingSessionIfPresent: UseMonitorProviderSessionActionsResult["replaceExistingSessionIfPresent"];
  startSession: (
    repo: Parameters<UseMonitorProviderSessionActionsResult["startSession"]>[0],
    sessionInput: Parameters<UseMonitorProviderSessionActionsResult["startSession"]>[1],
    persistedSessionId?: Parameters<UseMonitorProviderSessionActionsResult["startSession"]>[2],
  ) => ReturnType<UseMonitorProviderSessionActionsResult["startSession"]>;
  attachSession: (
    selection: MonitorProviderAttachSessionSelection,
  ) => ReturnType<UseMonitorProviderSessionActionsResult["attachSession"]>;
}

export interface MonitorProviderSessionPlaybackBindings {
  playbackSession: (
    selection: PlaybackSessionSelection,
  ) => ReturnType<UseMonitorProviderSessionActionsResult["playbackSession"]>;
}

export interface MonitorProviderSessionStopBindings {
  stopSession: UseMonitorProviderSessionActionsResult["stopSession"];
}

export function buildMonitorProviderSessionLiveCallbacksInput(
  input: UseMonitorProviderSessionActionsInput,
): MonitorProviderSessionLiveActionDependencies {
  return {
    api: input.api,
    logger: input.logger,
    runtime: input.runtime,
    session: input.session,
  };
}

export function buildMonitorProviderSessionPlaybackCallbacksInput(
  input: UseMonitorProviderSessionActionsInput,
): UseMonitorProviderSessionActionsInput {
  return input;
}

export function buildMonitorProviderSessionStopCallbackInput(
  input: UseMonitorProviderSessionActionsInput,
): MonitorProviderSessionStopActionDependencies {
  return {
    api: input.api,
    audio: input.audio,
    live: input.live,
    logger: input.logger,
    runtime: input.runtime,
    session: input.session,
  };
}

export function buildMonitorProviderSessionActionsResult(input: {
  live: MonitorProviderSessionLiveBindings;
  playback: MonitorProviderSessionPlaybackBindings;
  stop: MonitorProviderSessionStopBindings;
}): UseMonitorProviderSessionActionsResult {
  return {
    replaceExistingSessionIfPresent: input.live.replaceExistingSessionIfPresent,
    startSession: input.live.startSession,
    attachSession: input.live.attachSession,
    playbackSession: input.playback.playbackSession,
    stopSession: input.stop.stopSession,
  };
}
