import { useMonitorProviderGuideTrackCallbacks } from "./useMonitorProviderGuideTrackCallbacks";
import type {
  MonitorProviderGuideTrackLogger,
  UseMonitorProviderGuideTrackInput,
} from "./monitorProviderGuideTrackTypes";

export function useMonitorProviderGuideTrack(input: UseMonitorProviderGuideTrackInput) {
  return useMonitorProviderGuideTrackCallbacks(input);
}

export type { MonitorProviderGuideTrackLogger, UseMonitorProviderGuideTrackInput };
