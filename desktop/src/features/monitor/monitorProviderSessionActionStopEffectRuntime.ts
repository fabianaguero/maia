import { stopLiveMonitorSessionState } from "./monitorLiveLifecycleRuntime";
import { buildStopMonitorProviderSessionInput } from "./monitorProviderSessionActionBuilderRuntime";
import type { UseMonitorProviderSessionActionsInput } from "./monitorProviderSessionActionTypes";

export async function stopMonitorProviderSessionAction(
  input: Pick<
    UseMonitorProviderSessionActionsInput,
    "session" | "audio" | "live" | "runtime" | "api" | "logger"
  >,
): Promise<void> {
  const current = input.session.sessionRef.current;
  const wasPlayback = input.session.isPlayback;

  input.logger.info("stopSession id=%s wasPlayback=%s", current?.sessionId, wasPlayback);

  await stopLiveMonitorSessionState(
    buildStopMonitorProviderSessionInput({
      currentSession: current,
      ...input,
    }),
  );
}
