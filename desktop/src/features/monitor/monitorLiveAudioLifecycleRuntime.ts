import type { MutableRefObject } from "react";

export interface MonitorLiveLifecycleLogger {
  info: (message: string, ...args: unknown[]) => void;
  warn?: (message: string, ...args: unknown[]) => void;
}

export async function finalizeLiveMonitorStartupState(input: {
  ensureAudioContext: () => Promise<AudioContext>;
  emitProbe?: ((context: AudioContext) => void) | null;
  reloadPendingGuideTrack: () => void;
  doPoll: () => void;
  logger?: MonitorLiveLifecycleLogger;
  logLabel?: string;
}): Promise<void> {
  const currentCtx = await input.ensureAudioContext();
  if (input.logger && input.logLabel) {
    input.logger.info(
      `[MAIA:Audio] ${input.logLabel} ctx state=${currentCtx.state} sampleRate=${currentCtx.sampleRate}`,
    );
  }

  if (currentCtx.state === "running" && input.emitProbe) {
    input.emitProbe(currentCtx);
    if (input.logger && input.logLabel) {
      input.logger.info("[MAIA:Audio] start-tone fired");
    }
  }

  input.reloadPendingGuideTrack();
  input.doPoll();
}

export function clearMonitorAudioState(input: {
  stopAllMonitorAudio: () => void;
  currentSegmentRef: MutableRefObject<unknown | null>;
  audioContextRef: MutableRefObject<AudioContext | null>;
}): void {
  input.stopAllMonitorAudio();
  input.currentSegmentRef.current = null;
  if (input.audioContextRef.current?.state === "running") {
    void input.audioContextRef.current.suspend();
  }
}

export async function resumeMonitorAudioContextState(input: {
  ensureAudioContext: () => Promise<AudioContext | null>;
  emitProbe: (context: AudioContext) => void;
  logger?: MonitorLiveLifecycleLogger;
}): Promise<AudioContext | null> {
  const activeCtx = await input.ensureAudioContext();
  if (activeCtx && activeCtx.state === "running") {
    input.logger?.info?.(
      `[MAIA:Audio] context running — sampleRate=${activeCtx.sampleRate} state=${activeCtx.state}`,
    );
    input.emitProbe(activeCtx);
    return activeCtx;
  }

  input.logger?.warn?.(
    `[MAIA:Audio] context NOT running after resume — state=${activeCtx?.state ?? "null"}`,
  );
  return activeCtx;
}
