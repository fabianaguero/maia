import type { UseMonitorProviderGuideTrackInput } from "./monitorProviderGuideTrackTypes";
import { useMonitorProviderGuideTrackPathLoadCallback } from "./useMonitorProviderGuideTrackPathLoadCallback";
import { useMonitorProviderGuideTrackQueueCallbacks } from "./useMonitorProviderGuideTrackQueueCallbacks";

export function useMonitorProviderGuideTrackLoadCallbacks(
  input: UseMonitorProviderGuideTrackInput,
) {
  const loadGuideTrackPath = useMonitorProviderGuideTrackPathLoadCallback(input);
  const { setGuideTrack, setGuideTrackPlaylist, buildReloadPendingGuideTrack } =
    useMonitorProviderGuideTrackQueueCallbacks(input, loadGuideTrackPath);

  return {
    loadGuideTrackPath,
    setGuideTrack,
    setGuideTrackPlaylist,
    buildReloadPendingGuideTrack,
  };
}
