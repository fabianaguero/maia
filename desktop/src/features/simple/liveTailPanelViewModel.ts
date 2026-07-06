import type { AppTranslations } from "../../i18n/types";
import type { MonitorLogLevel, MonitorLogLine } from "./monitorLogParsing";

export interface LiveTailPanelViewModel {
  title: string;
  subtitle: string;
  actionHint: string;
  filteredLines: MonitorLogLine[];
  statusBadgeLabel: string;
  visibleLinesLabel: string | null;
  emptyStateLabel: string;
  emptyStateHint: string;
  showClearFilter: boolean;
  summaryChips: Array<{
    key: string;
    label: string;
    value: string;
    tone: "neutral" | "error" | "warn" | "info";
  }>;
}

export function getMonitorLevelBadgeLabel(level: MonitorLogLevel, t: AppTranslations): string {
  switch (level) {
    case "error":
      return t.simpleMode.monitor.levelErrorShort;
    case "warn":
      return t.simpleMode.monitor.levelWarnShort;
    case "debug":
      return t.simpleMode.monitor.levelDebugShort;
    case "trace":
      return t.simpleMode.monitor.levelTraceShort;
    default:
      return t.simpleMode.monitor.levelInfoShort;
  }
}

export function buildLiveTailPanelViewModel(input: {
  t: AppTranslations;
  liveLines: MonitorLogLine[];
  isAnomalyFilterActive: boolean;
  isConsoleExpanded: boolean;
  isConnectingMonitor: boolean;
  monitorSourcePath: string;
  streamAdapterLabel: string;
}): LiveTailPanelViewModel {
  const filteredLines = input.liveLines.filter(
    (line) => !input.isAnomalyFilterActive || line.level === "error",
  );
  const title = input.isAnomalyFilterActive
    ? input.t.simpleMode.monitor.anomalyDetectionStream
    : input.t.simpleMode.monitor.liveSystemIngestion;
  const actionHint = input.isConsoleExpanded
    ? input.t.simpleMode.common.close
    : input.t.simpleMode.common.inspect;
  const formatAdapterStatus = (template: string) =>
    template.replace("{adapter}", input.streamAdapterLabel);
  const statusBadgeLabel =
    input.liveLines.length > 0
      ? input.t.simpleMode.monitor.sourceStatusLive
          .replace("{adapter}", input.streamAdapterLabel)
          .replace("{count}", String(filteredLines.length))
      : input.isConnectingMonitor
        ? formatAdapterStatus(input.t.simpleMode.monitor.sourceStatusConnecting)
        : formatAdapterStatus(input.t.simpleMode.monitor.sourceStatusActive);
  const visibleLinesLabel =
    input.liveLines.length > 0
      ? input.t.simpleMode.monitor.sourceStatusLive
          .replace("{adapter}", input.streamAdapterLabel)
          .replace("{count}", String(filteredLines.length))
      : null;
  const errorCount = filteredLines.filter((line) => line.level === "error").length;
  const warnCount = filteredLines.filter((line) => line.level === "warn").length;
  const infoCount = filteredLines.length - errorCount - warnCount;
  const summaryChips = [
    {
      key: "rows",
      label: input.t.simpleMode.monitor.rowsShort,
      value: String(filteredLines.length),
      tone: "neutral" as const,
    },
    {
      key: "error",
      label: input.t.simpleMode.monitor.errorsShort,
      value: String(errorCount),
      tone: "error" as const,
    },
    {
      key: "warn",
      label: input.t.simpleMode.monitor.warningsShort,
      value: String(warnCount),
      tone: "warn" as const,
    },
    {
      key: "info",
      label: input.t.simpleMode.monitor.infoShort,
      value: String(infoCount),
      tone: "info" as const,
    },
  ];
  const emptyStateLabel =
    input.liveLines.length > 0 && filteredLines.length === 0 && input.isAnomalyFilterActive
      ? input.t.simpleMode.monitor.noAnomalyLines
      : input.isConnectingMonitor
        ? input.t.simpleMode.monitor.connectingRemoteStream
        : input.t.simpleMode.monitor.waitingLiveIngestion;
  const emptyStateHint =
    input.liveLines.length > 0 && filteredLines.length === 0 && input.isAnomalyFilterActive
      ? input.t.simpleMode.monitor.noAnomalyLinesHint
      : input.isConnectingMonitor
        ? `${input.t.simpleMode.monitor.openingSourceWaiting}: ${input.monitorSourcePath}`
        : `${input.t.simpleMode.monitor.listeningRealtime}: ${input.monitorSourcePath}`;

  return {
    title,
    subtitle: `${input.streamAdapterLabel} · ${input.monitorSourcePath}`,
    actionHint,
    filteredLines,
    statusBadgeLabel,
    visibleLinesLabel,
    emptyStateLabel,
    emptyStateHint,
    showClearFilter: input.isAnomalyFilterActive,
    summaryChips,
  };
}
