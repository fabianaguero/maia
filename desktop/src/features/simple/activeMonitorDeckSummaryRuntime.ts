import type { AppTranslations } from "../../i18n/types";
import type {
  MonitorHeaderMetricViewModel,
  MonitorLegendItemViewModel,
} from "./activeMonitorDeckViewModelTypes";

export function buildActiveMonitorHeaderMetrics(input: {
  t: AppTranslations;
  totalAnomalies: number;
  uptimeLabel: string;
}): MonitorHeaderMetricViewModel[] {
  return [
    {
      key: "anomalies",
      label: input.t.simpleMode.monitor.anomalies,
      value: String(input.totalAnomalies),
      tone: "alert",
    },
    {
      key: "uptime",
      label: input.t.simpleMode.monitor.uptime,
      value: input.uptimeLabel,
    },
  ];
}

export function buildActiveMonitorLegendItems(t: AppTranslations): MonitorLegendItemViewModel[] {
  return [
    {
      key: "track",
      label: t.simpleMode.monitor.legendTrack,
      tone: "track",
    },
    {
      key: "warn",
      label: t.simpleMode.monitor.legendLog,
      tone: "warn",
    },
    {
      key: "error",
      label: t.simpleMode.monitor.legendAnomaly,
      tone: "error",
    },
  ];
}

export function buildActiveMonitorTrackLine(input: {
  t: AppTranslations;
  monitorTrackTitle: string;
  musicStyleLabel?: string | null;
}): string {
  return `${input.monitorTrackTitle || input.t.simpleMode.monitor.liveIngestionFallback}${input.musicStyleLabel ? ` · ${input.musicStyleLabel}` : ""}`;
}

export function buildActiveMonitorStreamStatusLabel(input: {
  t: AppTranslations;
  isConnectingMonitor: boolean;
  streamAdapterLabel: string;
  liveLineCount: number;
}): string {
  if (input.isConnectingMonitor) {
    return input.t.simpleMode.monitor.sourceStatusConnecting.replace(
      "{adapter}",
      input.streamAdapterLabel,
    );
  }

  if (input.liveLineCount > 0) {
    return input.t.simpleMode.monitor.sourceStatusLive
      .replace("{adapter}", input.streamAdapterLabel)
      .replace("{count}", String(input.liveLineCount));
  }

  return input.t.simpleMode.monitor.sourceStatusActive.replace(
    "{adapter}",
    input.streamAdapterLabel,
  );
}
