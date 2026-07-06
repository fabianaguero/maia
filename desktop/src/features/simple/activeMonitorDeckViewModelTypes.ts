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
