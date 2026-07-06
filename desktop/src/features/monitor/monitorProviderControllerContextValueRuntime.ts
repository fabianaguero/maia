import type { MonitorContextValue } from "./monitorContextTypes";
import type { MonitorProviderStateViewModel } from "./monitorProviderControllerStateTypes";
import type { UseMonitorProviderContextValueInput } from "./useMonitorProviderContextValue";
import {
  buildMonitorProviderContextActionValue,
  buildMonitorProviderContextStateValue,
} from "./monitorProviderControllerContextValueInputRuntime";

export function buildMonitorProviderContextValueInput(input: {
  state: MonitorProviderStateViewModel;
  guideTrack: {
    setActiveTemplate: MonitorContextValue["setActiveTemplate"];
    seekGuideTrack: MonitorContextValue["seekGuideTrack"];
    setGuideTrack: MonitorContextValue["setGuideTrack"];
    setGuideTrackPlaylist: MonitorContextValue["setGuideTrackPlaylist"];
  };
  sessionActions: Pick<
    MonitorContextValue,
    "startSession" | "attachSession" | "stopSession" | "playbackSession"
  >;
  playbackControls: Pick<
    MonitorContextValue,
    | "seekPlaybackProgress"
    | "seekPlaybackWindow"
    | "pausePlayback"
    | "resumePlayback"
    | "stepPlaybackWindow"
  >;
  orchestration: Pick<MonitorContextValue, "resumeAudio">;
  logger: UseMonitorProviderContextValueInput["logger"];
}): UseMonitorProviderContextValueInput {
  return {
    ...buildMonitorProviderContextStateValue({
      state: input.state,
      logger: input.logger,
    }),
    ...buildMonitorProviderContextActionValue({
      guideTrack: input.guideTrack,
      sessionActions: input.sessionActions,
      playbackControls: input.playbackControls,
      orchestration: input.orchestration,
    }),
  };
}
