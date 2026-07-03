import type { AppTranslations } from "../../i18n/types";
import type { DeckSelectedMarker } from "./monitorDeckViewModel";
import { buildActiveMonitorFocusState } from "./activeMonitorDeckFocusRuntime";
import { buildActiveMonitorMetaChips } from "./activeMonitorDeckMetaRuntime";
import {
  buildActiveMonitorHeaderMetrics,
  buildActiveMonitorLegendItems,
  buildActiveMonitorStreamStatusLabel,
  buildActiveMonitorTrackLine,
} from "./activeMonitorDeckSummaryRuntime";
import type { ActiveMonitorDeckViewModel } from "./activeMonitorDeckViewModelTypes";

export type {
  ActiveMonitorDeckViewModel,
  MonitorHeaderMetricViewModel,
  MonitorLegendItemViewModel,
  MonitorMetaChipViewModel,
  MonitorStatusPillViewModel,
} from "./activeMonitorDeckViewModelTypes";
export { formatActiveMonitorDeckTime } from "./activeMonitorDeckTimeRuntime";

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
  const streamStatusLabel = buildActiveMonitorStreamStatusLabel({
    t: input.t,
    isConnectingMonitor: input.isConnectingMonitor,
    streamAdapterLabel: input.streamAdapterLabel,
    liveLineCount: input.liveLineCount,
  });

  const audioStatusLabel =
    input.audioStatus === "running"
      ? input.t.simpleMode.common.audioActive
      : input.t.simpleMode.monitor.audioStatusPaused;
  const focusState = buildActiveMonitorFocusState({
    t: input.t,
    selectedDeckMarker: input.selectedDeckMarker,
    selectedBurstCount: input.selectedBurstCount,
  });

  return {
    headerStatusLabel,
    headerStatusTone: input.isConnectingMonitor ? "pending" : "live",
    headerMetrics: buildActiveMonitorHeaderMetrics({
      t: input.t,
      totalAnomalies: input.totalAnomalies,
      uptimeLabel: input.uptimeLabel,
    }),
    deckTrackLine: buildActiveMonitorTrackLine({
      t: input.t,
      monitorTrackTitle: input.monitorTrackTitle,
      musicStyleLabel: input.musicStyleLabel,
    }),
    legendItems: buildActiveMonitorLegendItems(input.t),
    metaChips: buildActiveMonitorMetaChips({
      t: input.t,
      deckPresetLabel: input.deckPresetLabel,
      deckBpm: input.deckBpm,
      trackElapsedSeconds: input.trackElapsedSeconds,
      deckRemainingSeconds: input.deckRemainingSeconds,
    }),
    ...focusState,
    streamStatusLabel,
    audioStatusLabel,
    audioStatusTone: input.audioStatus === "running" ? "live" : "muted",
  };
}
