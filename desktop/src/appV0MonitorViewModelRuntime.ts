import type { ActiveMonitorSession } from "./features/monitor/monitorContextTypes";
import type { AppTranslations } from "./i18n/en";
import type { LibraryTrack } from "./types/library";
import { getTrackTitle } from "./utils/track";

export interface AppV0FallbackViewModel {
  message: string;
  hint: string;
}

export function createAppV0SessionId(input?: {
  randomUUID?: (() => string) | undefined;
  nowMs?: number;
  randomValue?: number;
}): string {
  const randomUUID = input?.randomUUID;
  if (typeof randomUUID === "function") {
    return randomUUID();
  }

  const nowMs = input?.nowMs ?? Date.now();
  const randomValue = input?.randomValue ?? Math.floor(Math.random() * 1000);
  return `session-${nowMs}-${randomValue}`;
}

export function formatAppV0Uptime(
  startedAt: number | null | undefined,
  nowMs = Date.now(),
): string {
  if (typeof startedAt !== "number" || !Number.isFinite(startedAt) || startedAt <= 0) {
    return "0s";
  }

  const uptimeSeconds = Math.max(0, Math.floor((nowMs - startedAt) / 1000));
  return uptimeSeconds < 60
    ? `${uptimeSeconds}s`
    : `${Math.floor(uptimeSeconds / 60)}m ${uptimeSeconds % 60}s`;
}

export function buildAppV0FallbackViewModel(t: AppTranslations): AppV0FallbackViewModel {
  return {
    message: t.simpleMode.common.sectionNotImplemented,
    hint: t.simpleMode.common.useSidebarNavigation,
  };
}

export function resolveAppV0MonitorWaveformBins(input: {
  tracks: LibraryTrack[];
  sessionTrackId?: string | null;
  sessionTrackName?: string | null;
}): number[] | undefined {
  return input.tracks.find(
    (track) => track.id === input.sessionTrackId || getTrackTitle(track) === input.sessionTrackName,
  )?.analysis?.waveformBins;
}

export function resolveAppV0MonitoringSourceLabel(
  session: ActiveMonitorSession | null,
  t: AppTranslations,
): string {
  return session?.repoTitle || t.simpleMode.common.unknown;
}
