import { POLL_INTERVAL_MS } from "./monitorSessionRuntime";
import { useMonitorProviderPlaybackControls } from "./useMonitorProviderPlaybackControls";
import { useMonitorProviderGuideTrackActions } from "./useMonitorProviderGuideTrackActions";
import { useMonitorProviderSessionOrchestration } from "./useMonitorProviderSessionOrchestration";
import {
  buildMonitorProviderControllerActionsResult,
  buildMonitorProviderGuideTrackActionsInput,
  buildMonitorProviderPlaybackControlsInput,
  buildMonitorProviderSessionOrchestrationInput,
  type UseMonitorProviderControllerActionsInput,
} from "./monitorProviderControllerActionsRuntime";

export function useMonitorProviderControllerActions(
  input: UseMonitorProviderControllerActionsInput,
) {
  const guideTrack = useMonitorProviderGuideTrackActions(
    buildMonitorProviderGuideTrackActionsInput(input),
  );

  const { orchestration, sessionActions } = useMonitorProviderSessionOrchestration(
    buildMonitorProviderSessionOrchestrationInput({
      source: input,
      buildReloadPendingGuideTrack: guideTrack.buildReloadPendingGuideTrack,
    }),
  );

  const playbackControls = useMonitorProviderPlaybackControls(
    buildMonitorProviderPlaybackControlsInput({
      state: input.state,
      orchestration: {
        dispatchReplayEventAtIndex: orchestration.dispatchReplayEventAtIndex,
        replayTick: orchestration.replayTick,
      },
      intervalMs: POLL_INTERVAL_MS,
    }),
  );

  return buildMonitorProviderControllerActionsResult({
    guideTrack,
    orchestration,
    sessionActions,
    playbackControls,
  });
}
