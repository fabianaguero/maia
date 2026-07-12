import type { AppTranslations } from "../i18n/types";
import type { StreamAdapterKind } from "../types/monitor";

export function resolveSessionStatusLabel(status: string, t: AppTranslations): string {
  switch (status) {
    case "active":
      return t.session.active;
    case "paused":
      return t.session.paused;
    case "stopped":
      return t.session.stopped;
    default:
      return status;
  }
}

export function getStreamAdapterCode(adapterKind: StreamAdapterKind | undefined): string {
  switch (adapterKind) {
    case "process":
      return "PROCESS_TAIL";
    case "http-poll":
      return "HTTP_POLL";
    case "websocket":
      return "WEBSOCKET_STREAM";
    case "journald":
      return "JOURNALD_STREAM";
    case "sonarqube":
      return "SONARQUBE_SIGNAL";
    case "file":
    default:
      return "FILE_TAIL";
  }
}

export function formatBpmLabel(bpm: number | null | undefined, emptyLabel = "— BPM"): string {
  return bpm != null ? `${Math.round(bpm)} BPM` : emptyLabel;
}

export function formatDominantLevelLabel(
  level: string | null | undefined,
  emptyLabel = "—",
): string {
  if (!level || !level.trim()) {
    return emptyLabel;
  }

  const words = level
    .trim()
    .split(/[-\s_]+/)
    .filter((word) => word.length > 0)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

  return words.length > 0 ? words.join(" ") : emptyLabel;
}

export function formatMonitorShortUptime(startedAt: number | null | undefined): string {
  if (typeof startedAt !== "number" || !Number.isFinite(startedAt) || startedAt <= 0) {
    return "00:00";
  }

  const uptimeSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  if (uptimeSeconds < 60) {
    return `${uptimeSeconds}s`;
  }

  return `${Math.floor(uptimeSeconds / 60)}m ${uptimeSeconds % 60}s`;
}

export function getMonitorLiveStatusLabel(t: AppTranslations): string {
  return t.simpleMode.monitor.systemActive;
}

export function getMonitorAnomaliesInlineLabel(t: AppTranslations): string {
  return t.simpleMode.monitor.anomalies.toLowerCase();
}
