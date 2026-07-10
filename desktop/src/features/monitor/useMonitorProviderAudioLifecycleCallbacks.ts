import { useCallback } from "react";

import { ensureMonitorAudioContext } from "./monitorContextRuntime";
import { resumeMonitorAudioContextState } from "./monitorLiveLifecycleRuntime";
import type { UseMonitorProviderRuntimeOrchestrationInput } from "./monitorProviderRuntimeOrchestrationTypes";

export function useMonitorProviderAudioLifecycleCallbacks(
  input: UseMonitorProviderRuntimeOrchestrationInput,
) {
  const { audio, logger } = input;

  const ensureProviderAudioContext = useCallback(
    () =>
      ensureMonitorAudioContext({
        audioContextRef: audio.audioContextRef,
        setAudioContext: audio.setAudioContext,
      }),
    [audio.audioContextRef, audio.setAudioContext],
  );

  const resumeAudio = useCallback(async () => {
    await resumeMonitorAudioContextState({
      ensureAudioContext: () =>
        ensureMonitorAudioContext({
          audioContextRef: audio.audioContextRef,
          setAudioContext: audio.setAudioContext,
          logger,
          reason: "manual-resume",
        }),
      emitProbe: () => {},
      logger,
    });
  }, [audio.audioContextRef, audio.setAudioContext, logger]);

  return {
    ensureProviderAudioContext,
    resumeAudio,
  };
}
