import type { ActiveMonitorSession } from "./monitorContextTypes";

export function createPlaybackMonitorSession(input: {
  sessionId: string;
  label: string;
  sourcePath: string;
  repoId?: string | null;
  trackId?: string | null;
  trackTitle?: string | null;
  startedAt?: number;
}): ActiveMonitorSession {
  return {
    sessionId: `playback_${input.sessionId}`,
    persistedSessionId: input.sessionId,
    repoId: input.repoId ?? input.sessionId,
    repoTitle: input.label,
    trackId: input.trackId ?? undefined,
    trackName: input.trackTitle ?? undefined,
    sourcePath: input.sourcePath,
    adapterKind: "file",
    pollMode: "direct",
    startedAt: input.startedAt ?? Date.now(),
  };
}
