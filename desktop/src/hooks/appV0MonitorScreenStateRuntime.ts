import { startLogSourceConnection } from "../api/repositories";
import { createAppV0MonitorOrchestrator } from "../appV0MonitorOrchestration";
import {
  buildAppV0FallbackViewModel,
  createAppV0SessionId,
  formatAppV0Uptime,
  resolveAppV0MonitorWaveformBins,
} from "../appV0ViewModel";
import { buildAppV0ShellViewModel } from "../appV0ShellViewModel";
import { en } from "../i18n/en";
import { es } from "../i18n/es";
import type { AppV0Language } from "../appV0Preferences";
import type { ActiveMonitorSession, MonitorMetrics } from "../features/monitor/monitorContextTypes";
import type { AppSection } from "../features/simple/appSections";
import type { LibraryTrack, RepositoryAnalysis, StartSessionInput } from "../types/library";
import type { StreamSessionRecord } from "../types/monitor";
import { getTrackTitle } from "../utils/track";

export function resolveAppV0Translations(lang: AppV0Language) {
  return lang === "es" ? es : en;
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

export function buildAppV0MonitorStateModel(input: BuildAppV0MonitorStateModelInput) {
  const t = resolveAppV0Translations(input.lang);
  const isMonitoring = Boolean(input.session);
  const uptimeLabel = formatAppV0Uptime(input.session?.startedAt ?? null);
  const fallbackViewModel = buildAppV0FallbackViewModel(t);
  const shellViewModel = buildAppV0ShellViewModel({
    currentSection: input.currentSection,
    isMonitoring,
    session: input.session,
    metrics: input.metrics,
    uptimeLabel,
    t,
    selectedRepositoryTitle: input.selectedRepositoryTitle ?? null,
    selectedTrackTitle: input.selectedTrack ? getTrackTitle(input.selectedTrack) : null,
  });
  const waveformBins = resolveAppV0MonitorWaveformBins({
    tracks: input.tracks,
    sessionTrackId: input.session?.trackId,
    sessionTrackName: input.session?.trackName,
  });

  return {
    t,
    isMonitoring,
    uptimeLabel,
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

export function buildAppV0MonitorOrchestrator(input: BuildAppV0MonitorOrchestratorInput) {
  return createAppV0MonitorOrchestrator({
    repositories: input.repositories,
    tracks: input.tracks,
    selectedTrack: input.selectedTrack,
    createSessionId: () =>
      createAppV0SessionId({
        randomUUID: typeof crypto.randomUUID === "function" ? () => crypto.randomUUID() : undefined,
      }),
    setGuideTrack: input.setGuideTrack,
    resumeAudio: input.resumeAudio,
    startConnection: startLogSourceConnection,
    attachSession: input.attachSession,
    startSession: input.startSession,
    playbackSession: input.playbackSession,
    onLaunchSuccess: input.onLaunchSuccess,
  });
}
