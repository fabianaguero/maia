import type { ActiveMonitorSession, MonitorMetrics } from "../monitor/monitorContextTypes";
import type { PersistedSession } from "../../api/sessions";
import type { LibraryTrack, RepositoryAnalysis } from "../../types/library";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { MonitorLaunchSource } from "../../types/monitorLaunch";
import type { MonitorSetupPreferences } from "./monitorSetupPreferences";
import type { AppSkin } from "./appSkin";
import { buildSimpleMonitorScreenHookState } from "./simpleMonitorScreenRuntime";
import {
  buildSimpleMonitorScreenControllerInput,
  buildSimpleMonitorScreenStateHookResultInput,
  buildSimpleMonitorScreenStateRuntimeInput,
} from "./simpleMonitorScreenStateHookRuntime";
import { useSimpleMonitorScreenController } from "./useSimpleMonitorScreenController";

export interface SimpleMonitorScreenStateInput {
  skin?: AppSkin;
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

export function useSimpleMonitorScreenState({ ...input }: SimpleMonitorScreenStateInput) {
  const runtimeInput = buildSimpleMonitorScreenStateRuntimeInput(input);
  const { hookStateArgs } = useSimpleMonitorScreenController(
    buildSimpleMonitorScreenControllerInput(runtimeInput),
  );

  return buildSimpleMonitorScreenHookState(
    buildSimpleMonitorScreenStateHookResultInput(hookStateArgs),
  );
}
