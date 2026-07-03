import type { MutableRefObject } from "react";

import type { MonitorAudioRuntimeLogger } from "./monitorAudioRuntimeTypes";

export async function ensureMonitorAudioContext(input: {
  audioContextRef: MutableRefObject<AudioContext | null>;
  setAudioContext: (context: AudioContext) => void;
  logger?: MonitorAudioRuntimeLogger;
  createAudioContext?: () => AudioContext;
  reason?: string;
}): Promise<AudioContext> {
  let currentCtx = input.audioContextRef.current;
  if (!currentCtx) {
    if (input.logger && input.reason === "manual-resume") {
      input.logger.info("creating new audio context on manual resume");
    }
    currentCtx = (input.createAudioContext ?? (() => new AudioContext()))();
    input.audioContextRef.current = currentCtx;
    input.setAudioContext(currentCtx);
  }

  if (currentCtx.state === "suspended") {
    if (input.logger && input.reason === "manual-resume") {
      input.logger.info("resuming audio context manually");
    }
    await currentCtx.resume();
  }

  return currentCtx;
}
