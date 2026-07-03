import { useCallback } from "react";

import { stopAllMonitorAudio } from "./monitorContextRuntime";
import { runReplayTickState } from "./monitorPlaybackRuntime";
import { buildRunReplayTickStateInput } from "./monitorProviderOrchestrationRuntime";
import { buildMonitorProviderReplayTickHookInput } from "./monitorProviderReplayPlaybackHookRuntime";
import type { UseMonitorProviderReplayPlaybackRuntimeInput } from "./useMonitorProviderReplayPlaybackRuntimeTypes";

export function useMonitorProviderReplayTickCallback(
  input: UseMonitorProviderReplayPlaybackRuntimeInput,
  dispatchReplayEventAtIndex: (
    eventIndex: number,
    options?: { syncGuideTrack?: boolean },
  ) => boolean,
) {
  const { input: runtimeInput } = input;
  const { live, logger, playback } = runtimeInput;

  const replayTick = useCallback(() => {
    runReplayTickState(
      buildRunReplayTickStateInput(
        buildMonitorProviderReplayTickHookInput({
          runtimeInput: {
            input: runtimeInput,
            emitUpdate: input.emitUpdate,
            syncReplayTelemetry: input.syncReplayTelemetry,
            syncGuideTrackToReplayProgress: input.syncGuideTrackToReplayProgress,
          },
          dispatchReplayEventAtIndex: (eventIndex) => dispatchReplayEventAtIndex(eventIndex),
          replayTick: () => replayTick(),
          stopAllMonitorAudio,
        }),
      ),
    );
  }, [
    dispatchReplayEventAtIndex,
    input.emitUpdate,
    input.syncGuideTrackToReplayProgress,
    input.syncReplayTelemetry,
    live.activeRef,
    live.pollTimerRef,
    logger,
    playback.playbackPausedRef,
    playback.replayEventsRef,
    playback.replayHydratingRef,
    playback.replayIndexRef,
    playback.setIsPlaybackPaused,
    runtimeInput,
  ]);

  return replayTick;
}
