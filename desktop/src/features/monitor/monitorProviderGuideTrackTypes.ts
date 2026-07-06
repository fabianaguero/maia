import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import type { SourceTemplate } from "../../config/sourceTemplates";
import type { CrossfadeHandle, GuideTrackPCM } from "./monitorAudioRuntimeTypes";
import type { MonitorStartupRuntimeLogger } from "./monitorStartupRuntime";
import type { MonitorProviderGuideTrackLogger as MonitorProviderGuideTrackRuntimeLogger } from "./monitorProviderGuideTrackRuntime";

export interface MonitorProviderGuideTrackLogger
  extends MonitorProviderGuideTrackRuntimeLogger, MonitorStartupRuntimeLogger {
  debug?: (message: string, ...args: unknown[]) => void;
  warn?: (message: string, ...args: unknown[]) => void;
}

export type GuideTrackDecodeCache = Map<string, Promise<GuideTrackPCM>>;

export interface UseMonitorProviderGuideTrackInput {
  resolveSourceTemplate: (id: string) => SourceTemplate;
  decodedAudioCache: GuideTrackDecodeCache;
  logger: MonitorProviderGuideTrackLogger;
  audioContextRef: MutableRefObject<AudioContext | null>;
  currentSegmentRef: MutableRefObject<CrossfadeHandle | null>;
  guideTrackPathRef: MutableRefObject<string | null>;
  guideTrackQueueRef: MutableRefObject<string[]>;
  guideTrackQueueIndexRef: MutableRefObject<number>;
  guideTrackRef: MutableRefObject<GuideTrackPCM | null>;
  guideTrackCursorRef: MutableRefObject<{ current: number }>;
  guideTrackFinishedRef: MutableRefObject<boolean>;
  guideTrackLoadPromiseRef: MutableRefObject<Promise<void> | null>;
  activeTemplateRef: MutableRefObject<SourceTemplate>;
  setGuideTrackReady: Dispatch<SetStateAction<boolean>>;
  setGuideTrackPathState: Dispatch<SetStateAction<string | null>>;
  setGuideTrackDurationSec: Dispatch<SetStateAction<number | null>>;
  setActiveTemplateState: Dispatch<SetStateAction<SourceTemplate>>;
}
