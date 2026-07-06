import { useCallback } from "react";

import {
  runSeekMonitorProviderGuideTrack,
  runSetMonitorProviderActiveTemplate,
} from "./monitorProviderGuideTrackActionRuntime";
import type { UseMonitorProviderGuideTrackInput } from "./monitorProviderGuideTrackTypes";

export function useMonitorProviderGuideTrackControlCallbacks(
  input: UseMonitorProviderGuideTrackInput,
) {
  const setActiveTemplate = useCallback(
    (id: string) => {
      runSetMonitorProviderActiveTemplate({
        id,
        resolveSourceTemplate: input.resolveSourceTemplate,
        activeTemplateRef: input.activeTemplateRef,
        setActiveTemplateState: input.setActiveTemplateState,
        logger: input.logger,
      });
    },
    [
      input.resolveSourceTemplate,
      input.activeTemplateRef,
      input.setActiveTemplateState,
      input.logger,
    ],
  );

  const seekGuideTrack = useCallback(
    (second: number) => {
      runSeekMonitorProviderGuideTrack({
        second,
        guideTrackRef: input.guideTrackRef,
        guideTrackCursorRef: input.guideTrackCursorRef,
        guideTrackFinishedRef: input.guideTrackFinishedRef,
        logger: input.logger,
      });
    },
    [input.guideTrackRef, input.guideTrackCursorRef, input.guideTrackFinishedRef, input.logger],
  );

  return {
    setActiveTemplate,
    seekGuideTrack,
  };
}
