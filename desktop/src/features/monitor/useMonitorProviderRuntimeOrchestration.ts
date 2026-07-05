import {
  buildMonitorProviderAudioHookInput,
  buildMonitorProviderReplayHookInput,
  buildMonitorProviderRuntimeOrchestrationResult,
} from "./monitorProviderRuntimeOrchestrationHookRuntime";
import type { UseMonitorProviderRuntimeOrchestrationInput } from "./monitorProviderRuntimeOrchestrationTypes";
import { useMonitorProviderAudioRuntime } from "./useMonitorProviderAudioRuntime";
import { useMonitorProviderPollRuntime } from "./useMonitorProviderPollRuntime";
import { useMonitorProviderReplayRuntime } from "./useMonitorProviderReplayRuntime";

export function useMonitorProviderRuntimeOrchestration(
  input: UseMonitorProviderRuntimeOrchestrationInput,
) {
  const poll = useMonitorProviderPollRuntime(input);
  const replayHookInput = buildMonitorProviderReplayHookInput(input, poll.emitUpdate);
  const replay = useMonitorProviderReplayRuntime(replayHookInput.input, replayHookInput.emitUpdate);
  const audioHookInput = buildMonitorProviderAudioHookInput(input, {
    resetReplayTelemetry: replay.resetReplayTelemetry,
    doPoll: poll.doPoll,
  });
  const audio = useMonitorProviderAudioRuntime(audioHookInput.input, audioHookInput.deps);

  return buildMonitorProviderRuntimeOrchestrationResult({
    poll,
    replay,
    audio,
  });
}
