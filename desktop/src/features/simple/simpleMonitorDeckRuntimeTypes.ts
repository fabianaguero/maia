import type { AppTranslations } from "../../i18n/en";
import type { LibraryTrack } from "../../types/library";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { ActiveMonitorSession } from "../monitor/monitorContextTypes";
import type { AppSkin } from "./appSkin";
import type { MonitorSetupPreferences } from "./monitorSetupPreferences";

export interface UseSimpleMonitorDeckRuntimeInput {
  skin?: AppSkin;
  session: ActiveMonitorSession | null;
  isListening: boolean;
  isLaunchingMonitor: boolean;
  safeTracks: LibraryTrack[];
  trackName?: string;
  audioContext: AudioContext | null;
  subscribe: (listener: (update: LiveLogStreamUpdate) => void) => () => void;
  waveformBins?: number[];
  isConsoleExpanded: boolean;
  onToggleConsole?: () => void;
  liveSettings: MonitorSetupPreferences;
  t: AppTranslations;
}
