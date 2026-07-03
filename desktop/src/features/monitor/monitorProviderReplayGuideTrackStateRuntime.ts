import type { MutableRefObject } from "react";

import type { GuideTrackPCM } from "./monitorAudioRuntimeTypes";

export function buildSyncGuideTrackCursorStateInput(input: {
  pcm: GuideTrackPCM | null;
  cursorRef: MutableRefObject<{ current: number }>;
  finishedRef: MutableRefObject<boolean>;
  progress: number;
}) {
  return {
    pcm: input.pcm,
    cursorRef: input.cursorRef,
    finishedRef: input.finishedRef,
    progress: input.progress,
  };
}
