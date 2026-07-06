import type { RepositoryAnalysis } from "../../types/library";
import type { StartSessionInput } from "../../types/monitor";
import type { ActiveMonitorSession } from "./monitorContextTypes";

export function createActiveMonitorSession(input: {
  sessionId: string;
  persistedSessionId?: string | null;
  repoId: string;
  repoTitle: string;
  trackId?: string;
  trackTitle?: string;
  sourcePath: string;
  adapterKind: StartSessionInput["adapterKind"];
  pollMode: ActiveMonitorSession["pollMode"];
  startedAt?: number;
}): ActiveMonitorSession {
  return {
    sessionId: input.sessionId,
    persistedSessionId: input.persistedSessionId ?? null,
    repoId: input.repoId,
    repoTitle: input.repoTitle,
    trackId: input.trackId,
    trackName: input.trackTitle || "Dynamic Track",
    sourcePath: input.sourcePath,
    adapterKind: input.adapterKind,
    pollMode: input.pollMode,
    startedAt: input.startedAt ?? Date.now(),
  };
}

export function createLiveMonitorSession(input: {
  repo: RepositoryAnalysis;
  sessionInput: StartSessionInput;
  pollMode: ActiveMonitorSession["pollMode"];
  persistedSessionId?: string;
}): ActiveMonitorSession {
  return createActiveMonitorSession({
    sessionId: input.sessionInput.sessionId,
    persistedSessionId: input.persistedSessionId ?? null,
    repoId: input.repo.id,
    repoTitle: input.repo.title,
    trackId: input.sessionInput.trackId,
    trackTitle: input.sessionInput.trackTitle,
    sourcePath: input.sessionInput.source,
    adapterKind: input.sessionInput.adapterKind,
    pollMode: input.pollMode,
  });
}
