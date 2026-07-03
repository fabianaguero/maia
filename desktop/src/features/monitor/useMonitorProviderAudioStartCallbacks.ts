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
  const { live, persistence, session, template } = input;
  const { doPoll, ensureProviderAudioContext, resetReplayTelemetry } = deps;

  const emitLiveStartProbe = useCallback((context: AudioContext) => {
    emitMonitorAudioProbe({
      context,
      frequency: 528,
      attackGain: 0.12,
      releaseTimeSec: 0.25,
    });
  }, []);

  const runProviderPoll = useCallback(() => {
    void doPoll();
  }, [doPoll]);

  const buildLiveStartInput = useCallback(
    (reason: "session-start" | "attach-session", includeProbe: boolean) =>
      buildMonitorProviderLiveStartHookInput({
        live,
        persistence,
        session,
        template,
        deps: {
          doPoll,
          ensureProviderAudioContext,
          resetReplayTelemetry,
        },
        reason,
        includeProbe,
        emitProbe: emitLiveStartProbe,
        runProviderPoll,
      }),
    [
      doPoll,
      emitLiveStartProbe,
      ensureProviderAudioContext,
      live,
      persistence,
      runProviderPoll,
      resetReplayTelemetry,
      session,
      template,
    ],
  );

  return {
    buildLiveStartInput,
  };
}
