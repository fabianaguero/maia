import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { ActiveMonitorSession } from "./monitorContextTypes";
import {
  mapStreamPollResultToUpdate,
  runHttpPollTransport,
  runSessionPollTransport,
  runWebsocketPollTransport,
} from "./monitorSessionBufferedPollRuntime";
import { runDirectPollTransport } from "./monitorSessionDirectPollRuntime";
import type { RunMonitorPollCycleInput } from "./monitorSessionPollingTypes";

export { mapStreamPollResultToUpdate };

export async function executeMonitorPollTransport(
  current: ActiveMonitorSession,
  input: RunMonitorPollCycleInput,
): Promise<LiveLogStreamUpdate | null> {
  if (current.pollMode === "session") {
    return runSessionPollTransport(current, input);
  }
  if (current.pollMode === "direct") {
    return runDirectPollTransport(current, input);
  }
  if (current.pollMode === "websocket") {
    return runWebsocketPollTransport(current, input);
  }
  return runHttpPollTransport(current, input);
}
