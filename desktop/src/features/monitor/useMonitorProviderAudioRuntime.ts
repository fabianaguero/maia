import type { UseMonitorProviderRuntimeOrchestrationInput } from "./monitorProviderRuntimeOrchestrationTypes";
import { useMonitorProviderAudioLifecycleCallbacks } from "./useMonitorProviderAudioLifecycleCallbacks";
import { useMonitorProviderAudioStartCallbacks } from "./useMonitorProviderAudioStartCallbacks";

export function useMonitorProviderAudioRuntime(
  input: UseMonitorProviderRuntimeOrchestrationInput,
  deps: {
    resetReplayTelemetry: () => void;
    doPoll: () => Promise<void>;
  },
) {
  const { ensureProviderAudioContext, resumeAudio } =
    useMonitorProviderAudioLifecycleCallbacks(input);
  const { buildLiveStartInput } = useMonitorProviderAudioStartCallbacks(input, {
    resetReplayTelemetry: deps.resetReplayTelemetry,
    doPoll: deps.doPoll,
    ensureProviderAudioContext,
  });

  return {
    ensureProviderAudioContext,
    buildLiveStartInput,
    resumeAudio,
  };
}
