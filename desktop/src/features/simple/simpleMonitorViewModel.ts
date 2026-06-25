import type { AppTranslations } from "../../i18n/en";
import type { ActiveMonitorSession } from "../monitor/MonitorContext";
import type { LibraryTrack } from "../../types/library";
import { getTrackTitle as getLibraryTrackTitle } from "../../utils/track";
import type { MonitorLaunchSource } from "./monitorSourceOptions";

export interface SimpleMonitorScreenViewModel {
  monitorSourceTitle: string;
  monitorSourcePath: string;
  monitorTrackTitle: string;
  isConnectingMonitor: boolean;
  uptimeLabel: string;
  deckRemainingSeconds: number | null;
}

export function resolveSimpleMonitorActiveTrack(
  tracks: LibraryTrack[],
  trackName?: string,
  sessionTrackName?: string,
): LibraryTrack | null {
  const resolvedTrackName = trackName || sessionTrackName;
  if (!resolvedTrackName) {
    return null;
  }

  return tracks.find((track) => getLibraryTrackTitle(track) === resolvedTrackName) ?? null;
}

export function formatSimpleMonitorUptimeLabel(uptimeSeconds: number): string {
  return uptimeSeconds < 60
    ? `${uptimeSeconds}s`
    : `${Math.floor(uptimeSeconds / 60)}m ${uptimeSeconds % 60}s`;
}

export function buildSimpleMonitorScreenViewModel(input: {
  session: ActiveMonitorSession | null;
  launchingSource: MonitorLaunchSource | null;
  isLaunchingMonitor: boolean;
  selectedSoundId: string;
  tracks: LibraryTrack[];
  trackName?: string;
  t: AppTranslations;
  nowMs: number;
  totalAnomalies: number;
  trackElapsedSeconds: number;
  deckDurationSeconds: number | null;
}): SimpleMonitorScreenViewModel {
  const selectedTrack = input.tracks.find((track) => track.id === input.selectedSoundId) ?? null;
  const monitorSourceTitle =
    input.session?.repoTitle ??
    input.launchingSource?.title ??
    input.t.simpleMode.setup.bootingMonitor;
  const monitorSourcePath =
    input.session?.sourcePath ??
    input.launchingSource?.sourcePath ??
    input.t.simpleMode.setup.awaitingSourceBinding;
  const monitorTrackTitle =
    input.trackName ||
    input.session?.trackName ||
    selectedTrack?.title ||
    input.t.simpleMode.monitor.noTrackSelected;
  const isConnectingMonitor = input.isLaunchingMonitor && !input.session;
  const uptimeSeconds = input.session
    ? Math.floor((input.nowMs - input.session.startedAt) / 1000)
    : 0;
  const deckRemainingSeconds =
    typeof input.deckDurationSeconds === "number"
      ? Math.max(0, input.deckDurationSeconds - input.trackElapsedSeconds)
      : null;
  return {
    monitorSourceTitle,
    monitorSourcePath,
    monitorTrackTitle,
    isConnectingMonitor,
    uptimeLabel: formatSimpleMonitorUptimeLabel(uptimeSeconds),
    deckRemainingSeconds,
  };
}
