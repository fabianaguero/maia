import type {
  SimpleMonitorDeckLiveControllerResult,
  UseSimpleMonitorDeckLiveControllerInput,
} from "./simpleMonitorDeckLiveControllerTypes";
import { useSimpleMonitorDeckLiveControllerSlices } from "./useSimpleMonitorDeckLiveControllerSlices";

export function useSimpleMonitorDeckLiveController(
  input: UseSimpleMonitorDeckLiveControllerInput,
): SimpleMonitorDeckLiveControllerResult {
  const { trackAudio, liveState } = useSimpleMonitorDeckLiveControllerSlices(input);

  return {
    backgroundAudioRef: trackAudio.backgroundAudioRef,
    previewTrackId: trackAudio.previewTrackId,
    toggleTrackPreview: trackAudio.toggleTrackPreview,
    ...liveState,
  };
}
