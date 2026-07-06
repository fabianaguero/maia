import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import type { SourceTemplate } from "../../config/sourceTemplates";
import type { CrossfadeHandle, GuideTrackPCM } from "./monitorAudioRuntimeTypes";

export interface MonitorStartupRuntimeLogger {
  info: (message: string, ...args: unknown[]) => void;
  error?: (message: string, ...args: unknown[]) => void;
}

export type SetSourceTemplateState = (value: SourceTemplate) => void;
export type SetBooleanState = Dispatch<SetStateAction<boolean>>;
export type SetNullableStringState = Dispatch<SetStateAction<string | null>>;
export type SetNullableNumberState = Dispatch<SetStateAction<number | null>>;

export interface ClearGuideTrackStateInput {
  audioContextRef: MutableRefObject<AudioContext | null>;
  currentSegmentRef: MutableRefObject<CrossfadeHandle | null>;
  guideTrackPathRef: MutableRefObject<string | null>;
  guideTrackRef: MutableRefObject<GuideTrackPCM | null>;
  guideTrackCursorRef: MutableRefObject<{ current: number }>;
  guideTrackFinishedRef: MutableRefObject<boolean>;
  guideTrackLoadPromiseRef: MutableRefObject<Promise<void> | null>;
  setGuideTrackReady: SetBooleanState;
  setGuideTrackPathState: SetNullableStringState;
  setGuideTrackDurationSec: SetNullableNumberState;
}

export interface BeginGuideTrackLoadStateInput {
  path: string;
  guideTrackPathRef: MutableRefObject<string | null>;
  guideTrackRef: MutableRefObject<GuideTrackPCM | null>;
  guideTrackCursorRef: MutableRefObject<{ current: number }>;
  guideTrackFinishedRef: MutableRefObject<boolean>;
  setGuideTrackPathState: SetNullableStringState;
  setGuideTrackReady: SetBooleanState;
}

export interface AcceptDecodedGuideTrackStateInput {
  requestedPath: string;
  guideTrackPathRef: MutableRefObject<string | null>;
  pcm: GuideTrackPCM;
  guideTrackRef: MutableRefObject<GuideTrackPCM | null>;
  guideTrackCursorRef: MutableRefObject<{ current: number }>;
  setGuideTrackDurationSec: SetNullableNumberState;
  setGuideTrackReady: SetBooleanState;
}

export interface RejectDecodedGuideTrackStateInput {
  requestedPath: string;
  guideTrackPathRef: MutableRefObject<string | null>;
  guideTrackRef: MutableRefObject<GuideTrackPCM | null>;
  guideTrackCursorRef: MutableRefObject<{ current: number }>;
  guideTrackFinishedRef: MutableRefObject<boolean>;
  setGuideTrackPathState: SetNullableStringState;
  setGuideTrackReady: SetBooleanState;
  setGuideTrackDurationSec: SetNullableNumberState;
}

export interface LoadGuideTrackPathStateInput extends ClearGuideTrackStateInput {
  path: string | null;
  currentPath: string | null;
  hasGuideTrack: boolean;
  hasPendingLoad: boolean;
  decodeGuideTrack: (path: string) => Promise<GuideTrackPCM>;
  logger?: MonitorStartupRuntimeLogger;
}
