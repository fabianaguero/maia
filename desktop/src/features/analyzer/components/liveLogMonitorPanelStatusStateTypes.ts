import type { AppTranslations } from "../../../i18n/types";
import type { LiveLogStreamUpdate } from "../../../types/library";
import type { ActiveMonitorSession, MonitorMetrics } from "../../monitor/monitorContextTypes";
import type { AudioEngineStatus, SampleEngineStatus } from "./liveLogMonitorViewModel";
import type { MetricGridItem, SessionCardDisplay } from "./liveLogMonitorDisplayRuntime";

export interface LiveLogMonitorPanelStatusStateInput {
  t: AppTranslations;
  replayActive: boolean;
  liveEnabled: boolean;
  audioStatus: AudioEngineStatus;
  bounceWindowCount: number;
  bounceWindowSeconds: number;
  sampleStatus: SampleEngineStatus;
  sampleSourceCount: number;
  activeAdapterLabel: string;
  selectedStyleProfileLabel: string;
  selectedMutationProfileLabel: string;
  playbackWindowLabel: string | null;
  metrics: MonitorMetrics;
  emittedCueCount: number;
  emittedVoiceCount: number;
  beatClockBpm: number | null;
  beatLooperActive: boolean;
  hasBaseListeningBed: boolean;
  baseTrackCount: number;
  repositorySuggestedBpm: number | null;
  session: ActiveMonitorSession | null;
  playbackPercent: number | null;
  currentLevelCounts: Record<string, number>;
  lastUpdate: LiveLogStreamUpdate | null;
  audioStateLabel: string;
}

export interface LiveLogMonitorPanelStatusState {
  bounceAction: { label: string; title: string } | null;
  cueEngineStateLabel: string;
  sessionCardDisplay: SessionCardDisplay | null;
  metricGridItems: MetricGridItem[];
  windowMetricGridItems: MetricGridItem[];
  ctaMetaLabel: string;
}
