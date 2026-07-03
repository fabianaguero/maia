import { useCallback } from "react";

import { emitMonitorAudioProbe, ensureMonitorAudioContext } from "./monitorContextRuntime";
import { resumeMonitorAudioContextState } from "./monitorLiveLifecycleRuntime";
import { buildResumeMonitorAudioContextStateInput } from "./monitorProviderOrchestrationRuntime";
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
    const resumeState = buildResumeMonitorAudioContextStateInput({
      audioContextRef: audio.audioContextRef,
      setAudioContext: audio.setAudioContext,
      logger,
    });
    await resumeMonitorAudioContextState({
      ensureAudioContext: () => ensureMonitorAudioContext(resumeState.ensureAudioContext()),
      emitProbe: (context) => emitMonitorAudioProbe(resumeState.emitProbe(context)),
      logger: resumeState.logger,
    });
  }, [audio.audioContextRef, audio.setAudioContext, logger]);

  return {
    ensureProviderAudioContext,
    resumeAudio,
  };
}
