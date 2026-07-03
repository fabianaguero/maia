import type { UseMonitorProviderGuideTrackInput } from "./monitorProviderGuideTrackTypes";
import { useMonitorProviderGuideTrackControlCallbacks } from "./useMonitorProviderGuideTrackControlCallbacks";
import { useMonitorProviderGuideTrackLoadCallbacks } from "./useMonitorProviderGuideTrackLoadCallbacks";

export function useMonitorProviderGuideTrackCallbacks(input: UseMonitorProviderGuideTrackInput) {
  const { setActiveTemplate, seekGuideTrack } = useMonitorProviderGuideTrackControlCallbacks(input);
  const { loadGuideTrackPath, setGuideTrack, setGuideTrackPlaylist, buildReloadPendingGuideTrack } =
    useMonitorProviderGuideTrackLoadCallbacks(input);

  return {
    setActiveTemplate,
    seekGuideTrack,
    loadGuideTrackPath,
    setGuideTrack,
    setGuideTrackPlaylist,
    buildReloadPendingGuideTrack,
  };
}
