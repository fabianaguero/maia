import type { AppTranslations } from "../../i18n/en";
import type { ActiveMonitorSession, MonitorMetrics } from "../monitor/monitorContextTypes";
import type {
  LiveLogComponentCount,
  LiveLogMarker,
  LiveLogStreamUpdate,
} from "../../types/monitor";
import type { PersistedSession } from "../../api/sessions";
import type { QuickSessionMode } from "./sessionDisplay";

export type BoothTone = "replay" | "live" | "armed" | "idle";

export interface BoothStatItem {
  label: string;
  value: string;
  helper: string;
}

export interface SessionBoothViewModel {
  sourceLabel: string | null;
  sourcePath: string | null;
  baseLabel: string | null;
  baseDetail: string | null;
  adapterLabel: string;
  signalBpm: number | null;
  state: {
    tone: BoothTone;
    label: string;
  };
  headline: string;
  summary: string;
  levelCountEntries: Array<[string, number]>;
  topComponents: LiveLogComponentCount[];
  warningItems: string[];
  anomalyMarkers: LiveLogMarker[];
  stats: BoothStatItem[];
  progressAriaLabel: string;
  progressWidth: string;
}

export interface BuildSessionBoothViewModelInput {
  t: AppTranslations;
  mode: QuickSessionMode;
  latestUpdate: LiveLogStreamUpdate | null;
  playbackActive: boolean;
  liveMonitorActive: boolean;
  readyToRun: boolean;
  playbackPercent: number | null;
  activeSession: PersistedSession | null;
  selectedSourceTitle: string | null;
  selectedSourcePath: string | null;
  selectedSourceSuggestedBpm: number | null;
  selectedSessionSourceLabel: string | null;
  selectedSessionSourcePath: string | null;
  selectedBaseLabel: string | null;
  selectedBaseDetail: string | null;
  selectedSessionBaseLabel: string | null;
  selectedSessionBaseDetail: string | null;
  activeBaseLabel: string | null;
  activeBaseDetail: string | null;
  activeSourceLabel: string | null;
  activeSourcePath: string | null;
  monitorSession: ActiveMonitorSession | null;
  monitorMetrics: MonitorMetrics;
  isPlaybackPaused: boolean;
  playbackEventIndex: number | null;
  playbackEventCount: number | null;
}
