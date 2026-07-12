import type { ActiveMonitorSession } from "./features/monitor/monitorContextTypes";
import type { MonitorLaunchSource } from "./types/monitorLaunch";
import { getTrackTitle, resolvePlayableTrackPath } from "./utils/track";
import type { LibraryTrack, RepositoryAnalysis } from "./types/library";
import type { LiveLogStreamUpdate, StartSessionInput, StreamSessionRecord } from "./types/monitor";

export interface AppV0TrackSelection {
  track: LibraryTrack | null;
  trackTitle: string | null;
  guideTrackPath: string | null;
}

export interface AppV0ConnectionAttachInput {
  repoId: string;
  repoTitle: string;
  session: StreamSessionRecord;
  trackId?: string;
  trackTitle?: string;
  initialStreamUpdate?: LiveLogStreamUpdate | null;
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

export function buildAppV0RepositoryStartInput(input: {
  sessionId: string;
  repo: RepositoryAnalysis;
  track: LibraryTrack;
  trackTitle: string;
  adapterKind?: StartSessionInput["adapterKind"];
  connectionConfig?: Record<string, unknown>;
}): StartSessionInput {
  return {
    sessionId: input.sessionId,
    source: input.repo.sourcePath,
    adapterKind: input.adapterKind ?? "file",
    label: input.repo.title,
    trackId: input.track.id,
    trackTitle: input.trackTitle,
    startFromBeginning: true,
    connectionConfig: input.connectionConfig,
  };
}

export function buildAppV0ConnectionAttachInput(input: {
  session: StreamSessionRecord;
  repoId: string;
  repoTitle: string;
  track: LibraryTrack;
  trackTitle: string;
  initialStreamUpdate?: LiveLogStreamUpdate | null;
}): AppV0ConnectionAttachInput {
  return {
    session: input.session,
    repoId: input.repoId,
    repoTitle: input.repoTitle,
    trackId: input.track.id,
    trackTitle: input.trackTitle,
    initialStreamUpdate: input.initialStreamUpdate ?? null,
  };
}

export function buildAppV0ConnectionLaunchPlan(input: {
  source: MonitorLaunchSource;
  track: LibraryTrack;
  trackTitle: string;
  guideTrackPath: string | null;
  sessionId: string;
}): Extract<AppV0MonitorLaunchPlan, { kind: "connection" }> {
  return {
    kind: "connection",
    track: input.track,
    trackTitle: input.trackTitle,
    guideTrackPath: input.guideTrackPath,
    sessionId: input.sessionId,
    connectionId: input.source.connectionId ?? "",
    repoId: input.source.id,
    repoTitle: input.source.title,
  };
}

export function buildAppV0RepositoryLaunchPlan(input: {
  repo: RepositoryAnalysis;
  track: LibraryTrack;
  trackTitle: string;
  guideTrackPath: string | null;
  sessionId: string;
  adapterKind?: StartSessionInput["adapterKind"];
  connectionConfig?: Record<string, unknown>;
}): Extract<AppV0MonitorLaunchPlan, { kind: "repository" }> {
  return {
    kind: "repository",
    track: input.track,
    trackTitle: input.trackTitle,
    guideTrackPath: input.guideTrackPath,
    sessionId: input.sessionId,
    repo: input.repo,
    startInput: buildAppV0RepositoryStartInput({
      sessionId: input.sessionId,
      repo: input.repo,
      track: input.track,
      trackTitle: input.trackTitle,
      adapterKind: input.adapterKind,
      connectionConfig: input.connectionConfig,
    }),
  };
}

export function buildCodeProjectRepositoryFromLaunchSource(input: {
  source: MonitorLaunchSource;
  importedAt: string;
}): RepositoryAnalysis {
  const analysisMode =
    typeof input.source.connectionConfig?.analysisMode === "string"
      ? input.source.connectionConfig.analysisMode
      : "local";

  return {
    id: input.source.id,
    title: input.source.title,
    sourcePath: input.source.sourcePath,
    storagePath: null,
    sourceKind: analysisMode === "local" ? "directory" : "url",
    importedAt: input.importedAt,
    suggestedBpm: null,
    confidence: 0,
    summary:
      analysisMode === "local"
        ? "Code quality signal source monitored through Maia local scanner."
        : "Code quality signal source monitored through SonarQube.",
    analyzerStatus:
      analysisMode === "local"
        ? "CodeProject local monitor source"
        : "CodeProject monitor source",
    buildSystem: analysisMode === "local" ? "maia-local-code-scanner" : "sonarqube",
    primaryLanguage: "code-quality",
    javaFileCount: 0,
    testFileCount: 0,
    waveformBins: [],
    beatGrid: [],
    bpmCurve: [],
    notes: [
      analysisMode === "local"
        ? "This monitor source uses Maia's local CodeProject scanner without requiring a SonarQube server."
        : "This monitor source is backed by a SonarQube CodeProject adapter.",
    ],
    tags: ["code-project", analysisMode === "local" ? "local-code-scan" : "sonarqube", "signal-source"],
    metrics: {
      sourceKind: "code-project",
      adapterKind: input.source.adapterKind ?? "sonarqube",
      analysisMode,
    },
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
    return buildAppV0ConnectionLaunchPlan({
      source: input.source,
      track: trackSelection.track,
      trackTitle: trackSelection.trackTitle,
      guideTrackPath: trackSelection.guideTrackPath,
      sessionId: input.sessionId,
    });
  }

  if (input.source.origin === "codeProject") {
    return buildAppV0RepositoryLaunchPlan({
      repo: buildCodeProjectRepositoryFromLaunchSource({
        source: input.source,
        importedAt: new Date().toISOString(),
      }),
      track: trackSelection.track,
      trackTitle: trackSelection.trackTitle,
      guideTrackPath: trackSelection.guideTrackPath,
      sessionId: input.sessionId,
      adapterKind: input.source.adapterKind ?? "sonarqube",
      connectionConfig: input.source.connectionConfig,
    });
  }

  const repo = input.repositories.find((item) => item.id === input.source.id);
  if (!repo) {
    return { kind: "invalid", reason: "missing-repository" };
  }

  return buildAppV0RepositoryLaunchPlan({
    repo,
    track: trackSelection.track,
    trackTitle: trackSelection.trackTitle,
    guideTrackPath: trackSelection.guideTrackPath,
    sessionId: input.sessionId,
  });
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

  return buildAppV0RepositoryLaunchPlan({
    repo,
    track: trackSelection.track,
    trackTitle: trackSelection.trackTitle,
    guideTrackPath: trackSelection.guideTrackPath,
    sessionId: input.sessionId,
  });
}

export function resolveAppV0PlaybackLabel(
  session: ActiveMonitorSession | null,
  fallbackLabel: string,
): string {
  return session?.repoTitle || fallbackLabel;
}
