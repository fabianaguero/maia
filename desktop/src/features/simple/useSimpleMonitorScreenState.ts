import type {
  ActiveMonitorSession,
  MonitorMetrics,
} from "../monitor/monitorContextTypes";
import type { PersistedSession } from "../../api/sessions";
import type { LibraryTrack, RepositoryAnalysis } from "../../types/library";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { MonitorLaunchSource } from "./monitorSourceOptions";
import type { MonitorSetupPreferences } from "./monitorSetupPreferences";
import {
  buildSimpleMonitorScreenHookState,
} from "./simpleMonitorScreenRuntime";
import { useSimpleMonitorScreenController } from "./useSimpleMonitorScreenController";

export interface SimpleMonitorScreenStateInput {
  session: ActiveMonitorSession | null;
  metrics: MonitorMetrics;
  pastSessions: PersistedSession[];
  repositories: RepositoryAnalysis[];
  tracks: LibraryTrack[];
  onStop: () => void;
  onResumeAudio: () => Promise<void> | void;
  audioStatus: AudioContextState;
  audioContext: AudioContext | null;
  onStartMonitoring: (source: MonitorLaunchSource, trackId?: string) => void | Promise<void>;
  onReplaySession: (sessionId: string, sourcePath: string, repoTitle: string) => void;
  subscribe: (listener: (update: LiveLogStreamUpdate) => void) => () => void;
  trackName?: string;
  waveformBins?: number[];
  isConsoleExpanded?: boolean;
  onToggleConsole?: () => void;
  liveSettings: MonitorSetupPreferences;
}

export function useSimpleMonitorScreenState({
  session,
  metrics,
  pastSessions,
  repositories,
  tracks,
  onStop,
  onResumeAudio,
  audioStatus,
  audioContext,
  onStartMonitoring,
  onReplaySession,
  subscribe,
  trackName,
  waveformBins,
  isConsoleExpanded = false,
  onToggleConsole,
  liveSettings,
}: SimpleMonitorScreenStateInput) {
  const { hookStateArgs } = useSimpleMonitorScreenController({
    session,
    metrics,
    pastSessions,
    repositories,
    tracks,
    onStop,
    onResumeAudio,
    audioStatus,
    audioContext,
    onStartMonitoring,
    onReplaySession,
    subscribe,
    trackName,
    waveformBins,
    isConsoleExpanded,
    onToggleConsole,
    liveSettings,
  });

  return buildSimpleMonitorScreenHookState(hookStateArgs);
}
