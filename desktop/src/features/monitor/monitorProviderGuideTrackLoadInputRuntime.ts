import { convertFileSrc } from "@tauri-apps/api/core";

import { invoke } from "../../api/tauri";
import type { CrossfadeHandle, GuideTrackPCM } from "./monitorAudioRuntimeTypes";
import { decodeGuideTrackFile, isTauriRuntime } from "./monitorGuideTrackDecodeRuntime";
import type {
  GuideTrackDecodeDependencies,
  MonitorGuideTrackDecodeLogger,
} from "./monitorGuideTrackDecodeTypes";
import { type loadGuideTrackPathState } from "./monitorStartupRuntime";
import type { MonitorStartupRuntimeLogger } from "./monitorStartupRuntime";

interface MonitorProviderGuideTrackLoadLogger
  extends MonitorGuideTrackDecodeLogger, MonitorStartupRuntimeLogger {
  debug?: (message: string, ...args: unknown[]) => void;
  warn?: (message: string, ...args: unknown[]) => void;
}

export function buildMonitorProviderGuideTrackDecodeDependencies(input: {
  cache: Map<string, Promise<GuideTrackPCM>>;
  logger: MonitorProviderGuideTrackLoadLogger;
}): GuideTrackDecodeDependencies {
  return {
    cache: input.cache,
    logger: input.logger,
    isTauri: isTauriRuntime,
    convertFileSrc,
    fetchAudio: async (url) => fetch(url),
    invokeReadAudioBytes: async (decodePath) =>
      invoke<string>("read_audio_bytes", { path: decodePath }),
    decodeBase64: (value) => atob(value),
    createOfflineAudioContext: (channels, frameCount, sampleRate) =>
      new OfflineAudioContext(channels, frameCount, sampleRate),
  };
}

export function buildMonitorProviderGuideTrackLoadStateInput(input: {
  path: string | null;
  currentPath: string | null;
  hasGuideTrack: boolean;
  hasPendingLoad: boolean;
  audioContextRef: React.MutableRefObject<AudioContext | null>;
  currentSegmentRef: React.MutableRefObject<CrossfadeHandle | null>;
  guideTrackPathRef: React.MutableRefObject<string | null>;
  guideTrackRef: React.MutableRefObject<GuideTrackPCM | null>;
  guideTrackCursorRef: React.MutableRefObject<{ current: number }>;
  guideTrackFinishedRef: React.MutableRefObject<boolean>;
  guideTrackLoadPromiseRef: React.MutableRefObject<Promise<void> | null>;
  setGuideTrackReady: React.Dispatch<React.SetStateAction<boolean>>;
  setGuideTrackPathState: React.Dispatch<React.SetStateAction<string | null>>;
  setGuideTrackDurationSec: React.Dispatch<React.SetStateAction<number | null>>;
  cache: Map<string, Promise<GuideTrackPCM>>;
  logger: MonitorProviderGuideTrackLoadLogger;
}): Parameters<typeof loadGuideTrackPathState>[0] {
  const decodeDependencies = buildMonitorProviderGuideTrackDecodeDependencies({
    cache: input.cache,
    logger: input.logger,
  });

  return {
    path: input.path,
    currentPath: input.currentPath,
    hasGuideTrack: input.hasGuideTrack,
    hasPendingLoad: input.hasPendingLoad,
    audioContextRef: input.audioContextRef,
    currentSegmentRef: input.currentSegmentRef,
    guideTrackPathRef: input.guideTrackPathRef,
    guideTrackRef: input.guideTrackRef,
    guideTrackCursorRef: input.guideTrackCursorRef,
    guideTrackFinishedRef: input.guideTrackFinishedRef,
    guideTrackLoadPromiseRef: input.guideTrackLoadPromiseRef,
    setGuideTrackReady: input.setGuideTrackReady,
    setGuideTrackPathState: input.setGuideTrackPathState,
    setGuideTrackDurationSec: input.setGuideTrackDurationSec,
    decodeGuideTrack: async (targetPath) => decodeGuideTrackFile(targetPath, decodeDependencies),
    logger: input.logger,
  };
}
