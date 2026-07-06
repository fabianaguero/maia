import type { MutableRefObject } from "react";

import type { GuideTrackPCM } from "./monitorAudioRuntimeTypes";
import { shouldAwaitGuideTrackForPlayback } from "./monitorStartupRuntime";
import type { MonitorPlaybackRuntimeLogger } from "./monitorPlaybackSessionTypes";

export async function finalizePlaybackMonitorSessionSetupState(input: {
  ensureAudioContext: () => Promise<unknown>;
  guideTrackPathRef: MutableRefObject<string | null>;
  guideTrackQueueRef: MutableRefObject<string[]>;
  guideTrackRef: MutableRefObject<GuideTrackPCM | null>;
  guideTrackLoadPromiseRef: MutableRefObject<Promise<void> | null>;
  awaitGuideTrack: () => Promise<void>;
  replayTick: () => void;
  logger: MonitorPlaybackRuntimeLogger;
}): Promise<void> {
  await input.ensureAudioContext();

  if (
    shouldAwaitGuideTrackForPlayback({
      guideTrackPathRef: input.guideTrackPathRef,
      guideTrackQueueRef: input.guideTrackQueueRef,
      guideTrackRef: input.guideTrackRef,
      guideTrackLoadPromiseRef: input.guideTrackLoadPromiseRef,
    })
  ) {
    input.logger.info("playbackSession waiting for guide track decode before replay");
    await input.awaitGuideTrack();
  }

  input.replayTick();
}
