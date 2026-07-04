import type { AppTranslations } from "../../i18n/types";
import { getTrackTitle as getLibraryTrackTitle } from "../../utils/track";
import type { LibraryTrack } from "../../types/library";
import type { ActiveMonitorSession } from "../monitor/MonitorContext";
import type { MonitorLaunchSource } from "../../types/monitorLaunch";

export function resolveSimpleMonitorSourceBinding(input: {
  session: ActiveMonitorSession | null;
  launchingSource: MonitorLaunchSource | null;
  t: AppTranslations;
}) {
  return {
    monitorSourceTitle:
      input.session?.repoTitle ??
      input.launchingSource?.title ??
      input.t.simpleMode.setup.bootingMonitor,
    monitorSourcePath:
      input.session?.sourcePath ??
      input.launchingSource?.sourcePath ??
      input.t.simpleMode.setup.awaitingSourceBinding,
  };
}

export function resolveSimpleMonitorTrackLabel(input: {
  trackName?: string;
  session: ActiveMonitorSession | null;
  selectedSoundId: string;
  tracks: LibraryTrack[];
  t: AppTranslations;
}): string {
  const selectedTrack =
    input.tracks.find((track) => track.id === input.selectedSoundId) ?? null;

  return (
    input.trackName ||
    input.session?.trackName ||
    (selectedTrack ? getLibraryTrackTitle(selectedTrack) : null) ||
    input.t.simpleMode.monitor.noTrackSelected
  );
}

export function resolveSimpleMonitorDeckRemainingSeconds(input: {
  deckDurationSeconds: number | null;
  trackElapsedSeconds: number;
}): number | null {
  return typeof input.deckDurationSeconds === "number"
    ? Math.max(0, input.deckDurationSeconds - input.trackElapsedSeconds)
    : null;
}
