import type { SessionEvent } from "../../api/sessions";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import { createSyntheticReplayEvent } from "./monitorContextRuntime";

type PollLogStreamFn = (
  sourcePath: string,
  cursor?: number,
  maxBytes?: number,
) => Promise<LiveLogStreamUpdate>;

export const REPLAY_REBUILD_WINDOW_BYTES = 16 * 1024;
export const MAX_REPLAY_REBUILD_WINDOWS = 48;

export function shouldHydrateReplayFromSource(
  eventsLength: number,
  sourcePath: string | null | undefined,
  storedReplayLines = 0,
): boolean {
  return Boolean(sourcePath) && (eventsLength <= 4 || storedReplayLines <= eventsLength);
}

export async function rebuildReplayEventsFromSource(input: {
  sessionId: string;
  sourcePath: string;
  pollLogStream: PollLogStreamFn;
  rebuildWindowBytes?: number;
  maxReplayWindows?: number;
}): Promise<SessionEvent[]> {
  const rebuiltEvents: SessionEvent[] = [];
  let cursor = 0;
  const rebuildWindowBytes = input.rebuildWindowBytes ?? REPLAY_REBUILD_WINDOW_BYTES;
  const maxReplayWindows = input.maxReplayWindows ?? MAX_REPLAY_REBUILD_WINDOWS;

  for (let index = 0; index < maxReplayWindows; index++) {
    const update = await input.pollLogStream(input.sourcePath, cursor, rebuildWindowBytes);

    if (!update.hasData || update.toOffset <= cursor) {
      break;
    }

    rebuiltEvents.push(createSyntheticReplayEvent(input.sessionId, index, update));
    cursor = update.toOffset;
  }

  return rebuiltEvents;
}
