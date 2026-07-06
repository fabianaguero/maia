import { executeMonitorPollTransport } from "./monitorSessionPollTransportRuntime";
import { POLL_INTERVAL_MS, type RunMonitorPollCycleInput } from "./monitorSessionPollingTypes";

export { POLL_INTERVAL_MS };

export type {
  MonitorPollingRefs,
  MonitorSessionRuntimeLogger,
  RunMonitorPollCycleInput,
} from "./monitorSessionPollingTypes";
export {
  scheduleMonitorPoll,
  stopMonitorPollingState,
} from "./monitorSessionPollingLifecycleRuntime";
export { mapStreamPollResultToUpdate } from "./monitorSessionPollTransportRuntime";

export async function runMonitorPollCycle(input: RunMonitorPollCycleInput): Promise<void> {
  const current = input.sessionRef.current;
  if (!current || !input.activeRef.current) {
    input.logger.trace("doPoll skipped — no active session");
    return;
  }

  input.logger.trace("doPoll mode=%s id=%s", current.pollMode, current.sessionId);

  try {
    const update = await executeMonitorPollTransport(current, input);
    if (!update) {
      return;
    }
    input.emitUpdate(update);
  } catch (error) {
    const message = error instanceof Error ? `${error.message}\n${error.stack}` : String(error);
    input.logger.error("poll error (non-fatal, will retry): " + message);
  } finally {
    input.scheduleNext();
  }
}
