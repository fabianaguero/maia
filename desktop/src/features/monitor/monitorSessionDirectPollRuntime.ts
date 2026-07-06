import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { ActiveMonitorSession } from "./monitorContextTypes";
import type { RunMonitorPollCycleInput } from "./monitorSessionPollingTypes";

function updateDirectPollingCursorState(input: {
  update: LiveLogStreamUpdate;
  directCursorRef: RunMonitorPollCycleInput["directCursorRef"];
  emptyWindowsRef: RunMonitorPollCycleInput["emptyWindowsRef"];
  logger: RunMonitorPollCycleInput["logger"];
}): void {
  input.directCursorRef.current = input.update.toOffset;
  if (input.update.hasData) {
    input.logger.debug(
      "direct poll → hasData lines=%d cues=%d offset=%d",
      input.update.lineCount,
      input.update.sonificationCues.length,
      input.update.toOffset,
    );
    input.emptyWindowsRef.current = 0;
    return;
  }

  input.emptyWindowsRef.current += 1;
  input.logger.trace("direct poll → empty (%d consecutive)", input.emptyWindowsRef.current);
  if (input.emptyWindowsRef.current >= 3) {
    input.directCursorRef.current = undefined;
    input.emptyWindowsRef.current = 0;
    input.logger.debug("direct poll → reset cursor (3 empty windows)");
  }
}

export async function runDirectPollTransport(
  current: ActiveMonitorSession,
  input: RunMonitorPollCycleInput,
): Promise<LiveLogStreamUpdate | null> {
  input.logger.trace(
    "doPoll → pollLogStream(%s, cursor=%s)",
    current.sourcePath,
    input.directCursorRef.current,
  );
  const update = await input.pollLogStream(current.sourcePath, input.directCursorRef.current);
  if (!input.activeRef.current) {
    return null;
  }
  updateDirectPollingCursorState({
    update,
    directCursorRef: input.directCursorRef,
    emptyWindowsRef: input.emptyWindowsRef,
    logger: input.logger,
  });
  return update;
}
