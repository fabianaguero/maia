import type { ActiveMonitorSession } from "./features/monitor/monitorContextTypes";
import type { MonitorLaunchSource } from "./features/simple/monitorSourceOptions";
import { getTrackTitle, resolvePlayableTrackPath } from "./utils/track";
import type { LibraryTrack, RepositoryAnalysis } from "./types/library";
import type {
  StartLogSourceConnectionInput,
  StartSessionInput,
  StreamSessionRecord,
} from "./types/monitor";

export interface AppV0TrackSelection {
  track: LibraryTrack | null;
  trackTitle: string | null;
  guideTrackPath: string | null;
}

export type AppV0MonitorLaunchPlan =
  | {
      kind: "connection";
      track: LibraryTrack;
      trackTitle: string;
      guideTrackPath: string | null;
      sessionId: string;
      connectionId: string;
      repoId: string;
      repoTitle: string;
    }
  | {
      kind: "repository";
      track: LibraryTrack;
      trackTitle: string;
      guideTrackPath: string | null;
      sessionId: string;
      repo: RepositoryAnalysis;
      startInput: StartSessionInput;
    }
  | {
      kind: "invalid";
      reason: "missing-track" | "missing-repository";
    };

export function resolveAppV0TrackSelection(input: {
  tracks: LibraryTrack[];
  trackId?: string | null;
  fallbackTrack?: LibraryTrack | null;
}): AppV0TrackSelection {
  const track =
    (input.trackId ? input.tracks.find((item) => item.id === input.trackId) : null) ??
    input.fallbackTrack ??
    null;

  return {
    track,
    trackTitle: track ? getTrackTitle(track) : null,
    guideTrackPath: track ? resolvePlayableTrackPath(track) : null,
  };
}

export function buildAppV0MonitorLaunchPlan(input: {
  source: MonitorLaunchSource;
  tracks: LibraryTrack[];
  repositories: RepositoryAnalysis[];
  trackId?: string | null;
  sessionId: string;
}): AppV0MonitorLaunchPlan {
  const trackSelection = resolveAppV0TrackSelection({
    tracks: input.tracks,
    trackId: input.trackId,
  });

  if (!trackSelection.track || !trackSelection.trackTitle) {
    return { kind: "invalid", reason: "missing-track" };
  }

  if (input.source.origin === "connection" && input.source.connectionId) {
    return {
      kind: "connection",
      track: trackSelection.track,
      trackTitle: trackSelection.trackTitle,
      guideTrackPath: trackSelection.guideTrackPath,
      sessionId: input.sessionId,
      connectionId: input.source.connectionId,
      repoId: input.source.id,
      repoTitle: input.source.title,
    };
  }

  const repo = input.repositories.find((item) => item.id === input.source.id);
  if (!repo) {
    return { kind: "invalid", reason: "missing-repository" };
  }

  return {
    kind: "repository",
    track: trackSelection.track,
    trackTitle: trackSelection.trackTitle,
    guideTrackPath: trackSelection.guideTrackPath,
    sessionId: input.sessionId,
    repo,
    startInput: {
      sessionId: input.sessionId,
      source: repo.sourcePath,
      adapterKind: "file",
      trackId: trackSelection.track.id,
      trackTitle: trackSelection.trackTitle,
      startFromBeginning: true,
    },
  };
}

export function buildAppV0LibraryMonitorLaunchPlan(input: {
  repoId: string;
  repositories: RepositoryAnalysis[];
  tracks: LibraryTrack[];
  selectedTrack?: LibraryTrack | null;
  sessionId: string;
}): AppV0MonitorLaunchPlan {
  const repo = input.repositories.find((item) => item.id === input.repoId);
  if (!repo) {
    return { kind: "invalid", reason: "missing-repository" };
  }

  const trackSelection = resolveAppV0TrackSelection({
    tracks: input.tracks,
    fallbackTrack: input.selectedTrack ?? input.tracks[0] ?? null,
  });

  if (!trackSelection.track || !trackSelection.trackTitle) {
    return { kind: "invalid", reason: "missing-track" };
  }

  return {
    kind: "repository",
    track: trackSelection.track,
    trackTitle: trackSelection.trackTitle,
    guideTrackPath: trackSelection.guideTrackPath,
    sessionId: input.sessionId,
    repo,
    startInput: {
      sessionId: input.sessionId,
      source: repo.sourcePath,
      adapterKind: "file",
      trackId: trackSelection.track.id,
      trackTitle: trackSelection.trackTitle,
      startFromBeginning: true,
    },
  };
}

export function resolveAppV0PlaybackLabel(
  session: ActiveMonitorSession | null,
  fallbackLabel: string,
): string {
  return session?.repoTitle || fallbackLabel;
}

export interface AppV0MonitorLaunchExecutionDeps {
  setGuideTrack: (path: string) => void;
  resumeAudio: () => Promise<void>;
  startConnection: (input: StartLogSourceConnectionInput) => Promise<StreamSessionRecord>;
  attachSession: (input: {
    session: StreamSessionRecord;
    repoId: string;
    repoTitle: string;
    trackId?: string;
    trackTitle?: string;
  }) => Promise<boolean>;
  startSession: (repo: RepositoryAnalysis, input: StartSessionInput) => Promise<boolean>;
  onLaunchSuccess?: () => void;
}

export type AppV0MonitorLaunchExecutionResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: "missing-track" | "missing-repository" | "attach-failed" | "start-failed";
    };

export async function executeAppV0MonitorLaunchPlan(
  plan: AppV0MonitorLaunchPlan,
  deps: AppV0MonitorLaunchExecutionDeps,
): Promise<AppV0MonitorLaunchExecutionResult> {
  if (plan.kind === "invalid") {
    return {
      ok: false,
      reason: plan.reason,
    };
  }

  if (plan.guideTrackPath) {
    deps.setGuideTrack(plan.guideTrackPath);
  }

  await deps.resumeAudio();

  if (plan.kind === "connection") {
    const streamSession = await deps.startConnection({
      connectionId: plan.connectionId,
      sessionId: plan.sessionId,
      startFromBeginning: false,
    });
    const success = await deps.attachSession({
      session: streamSession,
      repoId: plan.repoId,
      repoTitle: plan.repoTitle,
      trackId: plan.track.id,
      trackTitle: plan.trackTitle,
    });
    if (!success) {
      return {
        ok: false,
        reason: "attach-failed",
      };
    }
    deps.onLaunchSuccess?.();
    return { ok: true };
  }

  const success = await deps.startSession(plan.repo, plan.startInput);
  if (!success) {
    return {
      ok: false,
      reason: "start-failed",
    };
  }

  deps.onLaunchSuccess?.();
  return { ok: true };
}
