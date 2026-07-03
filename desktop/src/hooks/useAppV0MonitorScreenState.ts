import type { AppV0MonitorLaunchExecutionResult } from "../appV0MonitorRuntime";
import {
  buildAppV0MonitorOrchestrator,
  buildAppV0MonitorStateModel,
} from "./appV0MonitorScreenStateRuntime";
import type { ActiveMonitorSession, MonitorMetrics } from "../features/monitor/monitorContextTypes";
import type { AppSection } from "../features/simple/appSections";
import type { AppV0Language } from "../appV0Preferences";
import type { LibraryTrack, RepositoryAnalysis } from "../types/library";
import type { StartSessionInput, StreamSessionRecord } from "../types/monitor";

export interface UseAppV0MonitorScreenStateInput {
  lang: AppV0Language;
  currentSection: AppSection;
  setCurrentSection: (section: AppSection) => void;
  repositories: RepositoryAnalysis[];
  selectedRepositoryTitle?: string | null;
  tracks: LibraryTrack[];
  selectedTrack: LibraryTrack | null;
  session: ActiveMonitorSession | null;
  metrics: MonitorMetrics;
  setGuideTrack: (path: string) => void;
  resumeAudio: () => Promise<void>;
  attachSession: (input: {
    session: StreamSessionRecord;
    repoId: string;
    repoTitle: string;
    trackId?: string;
    trackTitle?: string;
  }) => Promise<boolean>;
  startSession: (repo: RepositoryAnalysis, input: StartSessionInput) => Promise<boolean>;
  playbackSession: (input: {
    sessionId: string;
    sourcePath: string;
    label: string;
  }) => Promise<boolean> | Promise<void>;
}

export function reportAppV0MonitorLaunchFailure(
  scope: "library" | "source",
  result: AppV0MonitorLaunchExecutionResult,
  reporter: (message?: unknown, ...optionalParams: unknown[]) => void = console.error,
): void {
  if (result.ok) {
    return;
  }

  reporter(
    `🎵 Failed to start ${scope === "library" ? "library" : "monitor"} launch`,
    result.reason,
  );
}

export function useAppV0MonitorScreenState(input: UseAppV0MonitorScreenStateInput) {
  const { t, isMonitoring, uptimeLabel, fallbackViewModel, shellViewModel, waveformBins } =
    buildAppV0MonitorStateModel({
      lang: input.lang,
      currentSection: input.currentSection,
      selectedRepositoryTitle: input.selectedRepositoryTitle ?? null,
      selectedTrack: input.selectedTrack,
      tracks: input.tracks,
      session: input.session,
      metrics: input.metrics,
    });
  const monitorOrchestrator = buildAppV0MonitorOrchestrator({
    repositories: input.repositories,
    tracks: input.tracks,
    selectedTrack: input.selectedTrack,
    setGuideTrack: input.setGuideTrack,
    resumeAudio: input.resumeAudio,
    attachSession: input.attachSession,
    startSession: input.startSession,
    playbackSession: input.playbackSession,
    onLaunchSuccess: () => input.setCurrentSection("monitor"),
  });

  return {
    t,
    isMonitoring,
    uptimeLabel,
    fallbackViewModel,
    monitorOrchestrator,
    shellViewModel,
    waveformBins,
    reportMonitorLaunchFailure: reportAppV0MonitorLaunchFailure,
  };
}
