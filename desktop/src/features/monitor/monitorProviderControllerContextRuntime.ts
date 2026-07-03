import type { MonitorContextValue } from "./monitorContextTypes";
import type { MonitorProviderRuntimeLogger } from "./monitorProviderOrchestrationRuntime";
import type { MonitorProviderStateViewModel } from "./monitorProviderControllerStateTypes";
import { buildMonitorProviderContextValueInput } from "./monitorProviderControllerViewRuntime";

export function buildMonitorProviderControllerContextInput(input: {
  state: MonitorProviderStateViewModel;
  logger: MonitorProviderRuntimeLogger;
  guideTrack: Pick<
    MonitorContextValue,
    "setActiveTemplate" | "seekGuideTrack" | "setGuideTrack" | "setGuideTrackPlaylist"
  >;
  orchestration: Pick<MonitorContextValue, "resumeAudio">;
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
}) {
  return buildMonitorProviderContextValueInput({
    state: input.state,
    guideTrack: input.guideTrack,
    sessionActions: input.sessionActions,
    playbackControls: input.playbackControls,
    orchestration: input.orchestration,
    logger: input.logger,
  });
}
