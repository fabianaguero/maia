import { useCallback } from "react";

import { emitMonitorAudioProbe } from "./monitorContextRuntime";
import {
  buildMonitorProviderLiveStartHookInput,
  type MonitorProviderAudioStartHookDeps,
} from "./monitorProviderAudioStartHookRuntime";
import type { UseMonitorProviderRuntimeOrchestrationInput } from "./monitorProviderRuntimeOrchestrationTypes";

export function useMonitorProviderAudioStartCallbacks(
  input: UseMonitorProviderRuntimeOrchestrationInput,
  deps: MonitorProviderAudioStartHookDeps,
) {
  const emitLiveStartProbe = useCallback((context: AudioContext) => {
    emitMonitorAudioProbe({
      context,
      frequency: 528,
      attackGain: 0.12,
      releaseTimeSec: 0.25,
    });
  }, []);

  const runProviderPoll = useCallback(() => {
    void deps.doPoll();
  }, [deps]);

  const buildLiveStartInput = useCallback(
    (reason: "session-start" | "attach-session", includeProbe: boolean) =>
      buildMonitorProviderLiveStartHookInput({
        source: input,
        deps,
        reason,
        includeProbe,
        emitProbe: emitLiveStartProbe,
        runProviderPoll,
      }),
    [
      input,
      deps.ensureProviderAudioContext,
      deps.resetReplayTelemetry,
      emitLiveStartProbe,
      runProviderPoll,
    ],
  );

  return {
    buildLiveStartInput,
  };
}
