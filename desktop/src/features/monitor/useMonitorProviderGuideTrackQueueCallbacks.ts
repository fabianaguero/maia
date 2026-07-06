import { useCallback } from "react";

import {
  buildReloadPendingMonitorProviderGuideTrackAction,
  runSetMonitorProviderGuideTrack,
  runSetMonitorProviderGuideTrackPlaylist,
} from "./monitorProviderGuideTrackActionRuntime";
import type { UseMonitorProviderGuideTrackInput } from "./monitorProviderGuideTrackTypes";

export function useMonitorProviderGuideTrackQueueCallbacks(
  input: UseMonitorProviderGuideTrackInput,
  loadGuideTrackPath: (path: string | null) => void,
) {
  const setGuideTrack = useCallback(
    (path: string | null) => {
      runSetMonitorProviderGuideTrack({
        path,
        guideTrackQueueRef: input.guideTrackQueueRef,
        guideTrackQueueIndexRef: input.guideTrackQueueIndexRef,
        loadGuideTrackPath,
      });
    },
    [input.guideTrackQueueIndexRef, input.guideTrackQueueRef, loadGuideTrackPath],
  );

  const setGuideTrackPlaylist = useCallback(
    (paths: string[]) => {
      runSetMonitorProviderGuideTrackPlaylist({
        paths,
        guideTrackQueueRef: input.guideTrackQueueRef,
        guideTrackQueueIndexRef: input.guideTrackQueueIndexRef,
        loadGuideTrackPath,
      });
    },
    [input.guideTrackQueueIndexRef, input.guideTrackQueueRef, loadGuideTrackPath],
  );

  const buildReloadPendingGuideTrack = useCallback(
    (reason: "session-start" | "attach-session") =>
      buildReloadPendingMonitorProviderGuideTrackAction({
        guideTrackQueueRef: input.guideTrackQueueRef,
        guideTrackQueueIndexRef: input.guideTrackQueueIndexRef,
        guideTrackRef: input.guideTrackRef,
        guideTrackPathRef: input.guideTrackPathRef,
        loadGuideTrackPath,
        logger: input.logger,
        reason,
      }),
    [
      input.guideTrackPathRef,
      input.guideTrackQueueIndexRef,
      input.guideTrackQueueRef,
      input.guideTrackRef,
      input.logger,
      loadGuideTrackPath,
    ],
  );

  return {
    setGuideTrack,
    setGuideTrackPlaylist,
    buildReloadPendingGuideTrack,
  };
}
