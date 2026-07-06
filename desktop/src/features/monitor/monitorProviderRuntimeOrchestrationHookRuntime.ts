import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { BuildLiveStartInputFn } from "./monitorProviderSessionActionTypes";
import type { UseMonitorProviderRuntimeOrchestrationInput } from "./monitorProviderRuntimeOrchestrationTypes";

export interface MonitorProviderRuntimePollBindings {
  stopPolling: () => void;
  emitUpdate: (
    update: LiveLogStreamUpdate,
    options?: {
      accumulateMetrics?: boolean;
      persistPlaybackEvent?: boolean;
    },
  ) => void;
  doPoll: () => Promise<void>;
}

export interface MonitorProviderRuntimeReplayBindings {
  resetReplayTelemetry: () => void;
  syncReplayTelemetry: (processedEvents: number) => void;
  syncGuideTrackToReplayProgress?: (progress: number) => void;
  dispatchReplayEventAtIndex: (
    eventIndex: number,
    options?: { syncGuideTrack?: boolean },
  ) => boolean;
  replayTick: () => void;
}

export interface MonitorProviderRuntimeAudioBindings {
  ensureProviderAudioContext: () => Promise<AudioContext>;
  buildLiveStartInput: BuildLiveStartInputFn;
  resumeAudio: () => Promise<void>;
}

export function buildMonitorProviderReplayHookInput(
  input: UseMonitorProviderRuntimeOrchestrationInput,
  emitUpdate: MonitorProviderRuntimePollBindings["emitUpdate"],
) {
  return {
    input,
    emitUpdate,
  };
}

export function buildMonitorProviderAudioHookInput(
  input: UseMonitorProviderRuntimeOrchestrationInput,
  deps: {
    resetReplayTelemetry: MonitorProviderRuntimeReplayBindings["resetReplayTelemetry"];
    doPoll: MonitorProviderRuntimePollBindings["doPoll"];
  },
) {
  return {
    input,
    deps,
  };
}

export function buildMonitorProviderRuntimeOrchestrationResult(input: {
  poll: MonitorProviderRuntimePollBindings;
  replay: MonitorProviderRuntimeReplayBindings;
  audio: MonitorProviderRuntimeAudioBindings;
}) {
  return {
    stopPolling: input.poll.stopPolling,
    resetReplayTelemetry: input.replay.resetReplayTelemetry,
    syncReplayTelemetry: input.replay.syncReplayTelemetry,
    emitUpdate: input.poll.emitUpdate,
    doPoll: input.poll.doPoll,
    ensureProviderAudioContext: input.audio.ensureProviderAudioContext,
    buildLiveStartInput: input.audio.buildLiveStartInput,
    dispatchReplayEventAtIndex: input.replay.dispatchReplayEventAtIndex,
    replayTick: input.replay.replayTick,
    resumeAudio: input.audio.resumeAudio,
  };
}
