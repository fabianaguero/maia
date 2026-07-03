import { shouldHydrateReplayFromSource } from "./monitorReplayRuntime";
import { createPlaybackMonitorSession } from "./monitorPlaybackSessionFactoryRuntime";
import type {
  MonitorPlaybackRuntimeLogger,
  PlaybackSessionSelection,
  PreparedPlaybackMonitorSession,
} from "./monitorPlaybackSessionTypes";

export async function preparePlaybackMonitorSessionState(
  input: PlaybackSessionSelection & {
    loadSessionEvents: (sessionId: string) => Promise<PreparedPlaybackMonitorSession["events"]>;
    logger: MonitorPlaybackRuntimeLogger;
  },
): Promise<PreparedPlaybackMonitorSession | null> {
  input.logger.info(
    "playbackSession id=%s label=%s path=%s repoId=%s",
    input.sessionId,
    input.label,
    input.sourcePath,
    input.repoId,
  );

  const events = await input.loadSessionEvents(input.sessionId);
  input.logger.info("playbackSession loaded %d stored events", events.length);

  const shouldHydrateReplay = shouldHydrateReplayFromSource(events.length, input.sourcePath);
  if (events.length === 0 && !shouldHydrateReplay) {
    input.logger.warn("playbackSession — 0 events, aborting");
    return null;
  }

  return {
    session: createPlaybackMonitorSession({
      sessionId: input.sessionId,
      label: input.label,
      sourcePath: input.sourcePath,
      repoId: input.repoId,
    }),
    events,
    shouldHydrateReplay,
  };
}
