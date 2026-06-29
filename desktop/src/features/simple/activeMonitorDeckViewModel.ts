import type { AppTranslations } from "../../i18n/en";
import type { DeckSelectedMarker } from "./monitorDeckViewModel";

export interface MonitorHeaderMetricViewModel {
  key: string;
  label: string;
  value: string;
  tone?: "default" | "alert";
}

export interface MonitorLegendItemViewModel {
  key: string;
  label: string;
  tone: "track" | "warn" | "error";
}

export interface MonitorMetaChipViewModel {
  key: string;
  label: string;
  subtle?: boolean;
}

export interface MonitorStatusPillViewModel {
  key: string;
  label: string;
  tone: "neutral" | "live" | "muted";
}

export interface ActiveMonitorDeckViewModel {
  headerStatusLabel: string;
  headerStatusTone: "pending" | "live";
  headerMetrics: MonitorHeaderMetricViewModel[];
  deckTrackLine: string;
  legendItems: MonitorLegendItemViewModel[];
  metaChips: MonitorMetaChipViewModel[];
  focusBadgeLabel: string | null;
  focusBadgeTone: "warning" | "critical" | null;
  focusTimestamp: string | null;
  focusMessage: string | null;
  focusCueCode: string | null;
  focusBurstLabel: string | null;
  streamStatusLabel: string;
  audioStatusLabel: string;
  audioStatusTone: "live" | "muted";
}

export function formatActiveMonitorDeckTime(seconds: number | null): string {
  if (typeof seconds !== "number" || Number.isNaN(seconds) || seconds < 0) {
    return "--:--";
  }

  const rounded = Math.floor(seconds);
  const minutes = Math.floor(rounded / 60);
  const secs = rounded % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export function buildActiveMonitorDeckViewModel(input: {
  t: AppTranslations;
  isConnectingMonitor: boolean;
  totalAnomalies: number;
  uptimeLabel: string;
  streamAdapterLabel: string;
  liveLineCount: number;
  audioStatus: AudioContextState;
  monitorTrackTitle: string;
  musicStyleLabel?: string | null;
  deckBpm: number | null | undefined;
  trackElapsedSeconds: number | null;
  deckRemainingSeconds: number | null;
  selectedDeckMarker: DeckSelectedMarker | null;
  selectedBurstCount?: number | null;
  deckPresetLabel?: string | null;
}): ActiveMonitorDeckViewModel {
  const headerStatusLabel = input.isConnectingMonitor
    ? input.t.simpleMode.monitor.connectingStream
    : input.t.simpleMode.monitor.systemActive;

  const streamStatusLabel = input.isConnectingMonitor
    ? input.t.simpleMode.monitor.sourceStatusConnecting.replace(
        "{adapter}",
        input.streamAdapterLabel,
      )
    : input.liveLineCount > 0
      ? input.t.simpleMode.monitor.sourceStatusLive
          .replace("{adapter}", input.streamAdapterLabel)
          .replace("{count}", String(input.liveLineCount))
      : input.t.simpleMode.monitor.sourceStatusActive.replace(
          "{adapter}",
          input.streamAdapterLabel,
        );

  const audioStatusLabel =
    input.audioStatus === "running"
      ? input.t.simpleMode.common.audioActive
      : input.t.simpleMode.monitor.audioStatusPaused;

  const isCritical = (input.selectedDeckMarker?.severity ?? 0) >= 0.9;

  return {
    headerStatusLabel,
    headerStatusTone: input.isConnectingMonitor ? "pending" : "live",
    headerMetrics: [
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
    ],
    deckTrackLine: `${input.monitorTrackTitle || input.t.simpleMode.monitor.liveIngestionFallback}${input.musicStyleLabel ? ` · ${input.musicStyleLabel}` : ""}`,
    legendItems: [
      {
        key: "track",
        label: input.t.simpleMode.monitor.legendTrack,
        tone: "track",
      },
      {
        key: "warn",
        label: input.t.simpleMode.monitor.legendLog,
        tone: "warn",
      },
      {
        key: "error",
        label: input.t.simpleMode.monitor.legendAnomaly,
        tone: "error",
      },
    ],
    metaChips: [
      ...(input.deckPresetLabel
        ? [
            {
              key: "preset",
              label: `${input.t.simpleMode.monitor.presetChip} ${input.deckPresetLabel}`,
            },
          ]
        : []),
      {
        key: "bpm",
        label: `${input.t.simpleMode.monitor.bpmChip} ${
          typeof input.deckBpm === "number" ? input.deckBpm.toFixed(0) : "--"
        }`,
      },
      {
        key: "elapsed",
        label: `${input.t.simpleMode.monitor.elapsedChip} ${formatActiveMonitorDeckTime(
          input.trackElapsedSeconds,
        )}`,
      },
      {
        key: "remaining",
        label: `${input.t.simpleMode.monitor.remainingChip} -${formatActiveMonitorDeckTime(
          input.deckRemainingSeconds,
        )}`,
        subtle: true,
      },
    ],
    focusBadgeLabel: input.selectedDeckMarker
      ? isCritical
        ? input.t.simpleMode.monitor.activeAnomaly
        : input.t.simpleMode.monitor.activeWarning
      : null,
    focusBadgeTone: input.selectedDeckMarker ? (isCritical ? "critical" : "warning") : null,
    focusTimestamp: input.selectedDeckMarker?.timestamp ?? null,
    focusMessage: input.selectedDeckMarker?.message ?? null,
    focusCueCode: input.selectedDeckMarker?.id ?? null,
    focusBurstLabel:
      input.selectedDeckMarker && input.selectedBurstCount
        ? `${input.t.simpleMode.monitor.burst} ${input.selectedBurstCount}`
        : null,
    streamStatusLabel,
    audioStatusLabel,
    audioStatusTone: input.audioStatus === "running" ? "live" : "muted",
  };
}
