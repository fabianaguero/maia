import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from "react";

import { convertFileSrc } from "@tauri-apps/api/core";

import { invoke } from "../../api/tauri";
import {
  buildGuideTrackQueue,
  loadGuideTrackPathState,
  reloadPendingGuideTrackForMonitorState,
  type MonitorStartupRuntimeLogger,
} from "./monitorStartupRuntime";
import {
  seekMonitorGuideTrackState,
  setMonitorActiveTemplateState,
  setMonitorGuideTrackPlaylistState,
  setMonitorGuideTrackState,
  type MonitorProviderGuideTrackLogger as MonitorProviderGuideTrackRuntimeLogger,
} from "./monitorProviderGuideTrackRuntime";
import { decodeGuideTrackFile, isTauriRuntime } from "./monitorGuideTrackDecodeRuntime";
import type { CrossfadeHandle, GuideTrackPCM } from "./monitorContextRuntime";
import type { SourceTemplate } from "../../config/sourceTemplates";

export interface MonitorProviderGuideTrackLogger
  extends MonitorProviderGuideTrackRuntimeLogger, MonitorStartupRuntimeLogger {
  debug?: (message: string, ...args: unknown[]) => void;
  warn?: (message: string, ...args: unknown[]) => void;
}

type GuideTrackDecodeCache = Map<string, Promise<GuideTrackPCM>>;

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

export function useMonitorProviderGuideTrack(input: UseMonitorProviderGuideTrackInput) {
  const setActiveTemplate = useCallback(
    (id: string) => {
      setMonitorActiveTemplateState({
        id,
        resolveSourceTemplate: input.resolveSourceTemplate,
        activeTemplateRef: input.activeTemplateRef,
        setActiveTemplateState: input.setActiveTemplateState,
        logger: input.logger,
      });
    },
    [input],
  );

  const seekGuideTrack = useCallback(
    (second: number) => {
      seekMonitorGuideTrackState({
        second,
        guideTrack: input.guideTrackRef.current,
        guideTrackCursorRef: input.guideTrackCursorRef,
        guideTrackFinishedRef: input.guideTrackFinishedRef,
        logger: input.logger,
      });
    },
    [input],
  );

  const loadGuideTrackPath = useCallback(
    (path: string | null) => {
      loadGuideTrackPathState({
        path,
        currentPath: input.guideTrackPathRef.current,
        hasGuideTrack: input.guideTrackRef.current !== null,
        hasPendingLoad: input.guideTrackLoadPromiseRef.current !== null,
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
        decodeGuideTrack: async (targetPath) =>
          decodeGuideTrackFile(targetPath, {
            cache: input.decodedAudioCache,
            logger: input.logger,
            isTauri: isTauriRuntime,
            convertFileSrc,
            fetchAudio: async (url) => fetch(url),
            invokeReadAudioBytes: async (decodePath) =>
              invoke<string>("read_audio_bytes", { path: decodePath }),
            decodeBase64: (value) => atob(value),
            createOfflineAudioContext: (channels, frameCount, sampleRate) =>
              new OfflineAudioContext(channels, frameCount, sampleRate),
          }),
        logger: input.logger,
      });
    },
    [input],
  );

  const setGuideTrack = useCallback(
    (path: string | null) => {
      setMonitorGuideTrackState({
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
      setMonitorGuideTrackPlaylistState({
        paths,
        buildGuideTrackQueue,
        guideTrackQueueRef: input.guideTrackQueueRef,
        guideTrackQueueIndexRef: input.guideTrackQueueIndexRef,
        loadGuideTrackPath,
      });
    },
    [input.guideTrackQueueIndexRef, input.guideTrackQueueRef, loadGuideTrackPath],
  );

  const buildReloadPendingGuideTrack = useCallback(
    (reason: "session-start" | "attach-session") => () => {
      reloadPendingGuideTrackForMonitorState({
        guideTrackQueueRef: input.guideTrackQueueRef,
        guideTrackQueueIndexRef: input.guideTrackQueueIndexRef,
        guideTrackRef: input.guideTrackRef,
        guideTrackPathRef: input.guideTrackPathRef,
        loadGuideTrackPath,
        logger: reason === "session-start" ? input.logger : undefined,
        reason,
      });
    },
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
    setActiveTemplate,
    seekGuideTrack,
    loadGuideTrackPath,
    setGuideTrack,
    setGuideTrackPlaylist,
    buildReloadPendingGuideTrack,
  };
}
