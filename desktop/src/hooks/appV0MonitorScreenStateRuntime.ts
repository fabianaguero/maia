import { startLogSourceConnection } from "../api/repositories";
import { createAppV0MonitorOrchestrator } from "../appV0MonitorOrchestration";
import {
  buildAppV0FallbackViewModel,
  createAppV0SessionId,
  formatAppV0Uptime,
  resolveAppV0MonitorWaveformBins,
} from "../appV0MonitorViewModelRuntime";
import { buildAppV0ShellViewModel } from "../appV0ShellViewModel";
import { en } from "../i18n/en";
import { es } from "../i18n/es";
import type { AppV0Language } from "../appV0Preferences";
import type { ActiveMonitorSession, MonitorMetrics } from "../features/monitor/monitorContextTypes";
import type { AppSection } from "../features/simple/appSections";
import type { LibraryTrack, RepositoryAnalysis, StartSessionInput } from "../types/library";
import type { StreamSessionRecord } from "../types/monitor";
import { getTrackTitle } from "../utils/track";
import type { UseAppV0MonitorScreenStateInput } from "./useAppV0MonitorScreenState";

export function resolveAppV0Translations(lang: AppV0Language) {
  return lang === "es" ? es : en;
}

export interface AppV0MonitorStateContext {
  t: ReturnType<typeof resolveAppV0Translations>;
  isMonitoring: boolean;
  uptimeLabel: string;
}

export interface BuildAppV0MonitorStateModelInput {
  lang: AppV0Language;
  currentSection: AppSection;
  selectedRepositoryTitle?: string | null;
  selectedTrack: LibraryTrack | null;
  tracks: LibraryTrack[];
  session: ActiveMonitorSession | null;
  metrics: MonitorMetrics;
}

export function buildAppV0MonitorStateModelInput(
  input: Pick<
    UseAppV0MonitorScreenStateInput,
    | "lang"
    | "currentSection"
    | "selectedRepositoryTitle"
    | "selectedTrack"
    | "tracks"
    | "session"
    | "metrics"
  >,
): BuildAppV0MonitorStateModelInput {
  return {
    lang: input.lang,
    currentSection: input.currentSection,
    selectedRepositoryTitle: input.selectedRepositoryTitle ?? null,
    selectedTrack: input.selectedTrack,
    tracks: input.tracks,
    session: input.session,
    metrics: input.metrics,
  };
}

export function buildAppV0MonitorStateContext(
  input: Pick<BuildAppV0MonitorStateModelInput, "lang" | "session">,
): AppV0MonitorStateContext {
  return {
    t: resolveAppV0Translations(input.lang),
    isMonitoring: Boolean(input.session),
    uptimeLabel: formatAppV0Uptime(input.session?.startedAt ?? null),
  };
}

export function buildAppV0MonitorShellViewModelInput(
  input: BuildAppV0MonitorStateModelInput,
  context: AppV0MonitorStateContext,
): Parameters<typeof buildAppV0ShellViewModel>[0] {
  return {
    currentSection: input.currentSection,
    isMonitoring: context.isMonitoring,
    session: input.session,
    metrics: input.metrics,
    uptimeLabel: context.uptimeLabel,
    t: context.t,
    selectedRepositoryTitle: input.selectedRepositoryTitle ?? null,
    selectedTrackTitle: input.selectedTrack ? getTrackTitle(input.selectedTrack) : null,
  };
}

export function buildAppV0MonitorStateModel(input: BuildAppV0MonitorStateModelInput) {
  const context = buildAppV0MonitorStateContext(input);
  const fallbackViewModel = buildAppV0FallbackViewModel(context.t);
  const shellViewModel = buildAppV0ShellViewModel(
    buildAppV0MonitorShellViewModelInput(input, context),
  );
  const waveformBins = resolveAppV0MonitorWaveformBins({
    tracks: input.tracks,
    sessionTrackId: input.session?.trackId,
    sessionTrackName: input.session?.trackName,
  });

  return {
    ...context,
    fallbackViewModel,
    shellViewModel,
    waveformBins,
  };
}

export interface BuildAppV0MonitorOrchestratorInput {
  repositories: RepositoryAnalysis[];
  tracks: LibraryTrack[];
  selectedTrack: LibraryTrack | null;
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
  onLaunchSuccess: () => void;
}

export function buildAppV0MonitorOrchestratorInput(
  input: Pick<
    UseAppV0MonitorScreenStateInput,
    | "repositories"
    | "tracks"
    | "selectedTrack"
    | "setGuideTrack"
    | "resumeAudio"
    | "attachSession"
    | "startSession"
    | "playbackSession"
  > & {
    onLaunchSuccess: () => void;
  },
): BuildAppV0MonitorOrchestratorInput {
  return {
    repositories: input.repositories,
    tracks: input.tracks,
    selectedTrack: input.selectedTrack,
    setGuideTrack: input.setGuideTrack,
    resumeAudio: input.resumeAudio,
    attachSession: input.attachSession,
    startSession: input.startSession,
    playbackSession: input.playbackSession,
    onLaunchSuccess: input.onLaunchSuccess,
  };
}

export function createAppV0MonitorSessionIdFactory(): () => string {
  return () =>
    createAppV0SessionId({
      randomUUID: typeof crypto.randomUUID === "function" ? () => crypto.randomUUID() : undefined,
    });
}

export function buildAppV0MonitorOrchestrationDeps(
  input: BuildAppV0MonitorOrchestratorInput,
): Parameters<typeof createAppV0MonitorOrchestrator>[0] {
  return {
    repositories: input.repositories,
    tracks: input.tracks,
    selectedTrack: input.selectedTrack,
    createSessionId: createAppV0MonitorSessionIdFactory(),
    setGuideTrack: input.setGuideTrack,
    resumeAudio: input.resumeAudio,
    startConnection: startLogSourceConnection,
    attachSession: input.attachSession,
    startSession: input.startSession,
    playbackSession: input.playbackSession,
    onLaunchSuccess: input.onLaunchSuccess,
  };
}

export function buildAppV0MonitorOrchestrator(input: BuildAppV0MonitorOrchestratorInput) {
  return createAppV0MonitorOrchestrator(buildAppV0MonitorOrchestrationDeps(input));
}
