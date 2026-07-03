import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import type { MonitorProviderRuntimeLogger } from "./monitorProviderOrchestrationRuntime";

export function buildResumeMonitorAudioContextStateInput(input: {
  audioContextRef: MutableRefObject<AudioContext | null>;
  setAudioContext: Dispatch<SetStateAction<AudioContext | null>>;
  logger: MonitorProviderRuntimeLogger;
}) {
  return {
    ensureAudioContext: () => ({
      audioContextRef: input.audioContextRef,
      setAudioContext: input.setAudioContext,
      logger: input.logger,
      reason: "manual-resume" as const,
    }),
    emitProbe: (context: AudioContext) => ({
      context,
      frequency: 440,
      attackGain: 0.15,
      releaseTimeSec: 0.3,
    }),
    logger: input.logger,
  };
}
