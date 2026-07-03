import { useMemo } from "react";
import type { AppV0MonitorLaunchExecutionResult } from "../appV0MonitorRuntime";
import {
  buildAppV0MonitorOrchestrator,
  buildAppV0MonitorStateModel,
} from "./appV0MonitorScreenStateRuntime";
import {
  buildAppV0MonitorScreenStateHookResult,
} from "./appV0MonitorScreenStateHookRuntime";
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
  const {
    lang,
    currentSection,
    selectedRepositoryTitle,
    selectedTrack,
    tracks,
    session,
    metrics,
    repositories,
    setGuideTrack,
    resumeAudio,
    attachSession,
    startSession,
    playbackSession,
    setCurrentSection,
  } = input;

  const stateModel = useMemo(
    () =>
      buildAppV0MonitorStateModel({
        lang,
        currentSection,
        selectedRepositoryTitle: selectedRepositoryTitle ?? null,
        selectedTrack,
        tracks,
        session,
        metrics,
      }),
    [
      lang,
      currentSection,
      selectedRepositoryTitle,
      selectedTrack,
      tracks,
      session,
      metrics,
    ],
  );
  const monitorOrchestrator = useMemo(
    () =>
      buildAppV0MonitorOrchestrator({
        repositories,
        tracks,
        selectedTrack,
        setGuideTrack,
        resumeAudio,
        attachSession,
        startSession,
        playbackSession,
        onLaunchSuccess: () => setCurrentSection("monitor"),
      }),
    [
      repositories,
      tracks,
      selectedTrack,
      setGuideTrack,
      resumeAudio,
      attachSession,
      startSession,
      playbackSession,
      setCurrentSection,
    ],
  );

  return useMemo(
    () =>
      buildAppV0MonitorScreenStateHookResult({
        stateModel,
        monitorOrchestrator,
        reportMonitorLaunchFailure: reportAppV0MonitorLaunchFailure,
      }),
    [stateModel, monitorOrchestrator],
  );
}
