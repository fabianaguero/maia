import { useCallback } from "react";

import { createManagedBlobAudioRegistry } from "./liveLogMonitorAudioRuntime";
import { appendLiveLogMonitorWarningMessage } from "./liveLogMonitorPanelAudioFeedbackRuntime";
import {
  buildLiveLogMonitorBackgroundAudioEngineInput,
  buildLiveLogMonitorBackgroundDeckControlInput,
  buildLiveLogMonitorPlaybackInput,
  buildLiveLogMonitorResetActionsInput,
} from "./liveLogMonitorPanelAudioInputRuntime";
import type { UseLiveLogMonitorPanelAudioRuntimeInput } from "./liveLogMonitorPanelAudioTypes";
import { toMessage } from "./liveLogMonitorViewModel";
import { useLiveLogMonitorAudioBootstrap } from "./useLiveLogMonitorAudioBootstrap";
import { useLiveLogMonitorAuxPlayback } from "./useLiveLogMonitorAuxPlayback";
import { useLiveLogMonitorBackgroundAudioEngine } from "./useLiveLogMonitorBackgroundAudioEngine";
import { useLiveLogMonitorBackgroundDeckControl } from "./useLiveLogMonitorBackgroundDeckControl";
import { useLiveLogMonitorPlayback } from "./useLiveLogMonitorPlayback";
import { useLiveLogMonitorResetActions } from "./useLiveLogMonitorResetActions";

export const activeBlobAudioElements = createManagedBlobAudioRegistry();

function createAudioContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  const audioConstructor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  return audioConstructor ? new audioConstructor() : null;
}

export function useLiveLogMonitorPanelAudioCore({
  liveEnabled,
  replayActive,
  monitorAudioContext,
  resumeSharedAudio,
  surfaceState,
  viewState,
  logger,
}: Omit<UseLiveLogMonitorPanelAudioRuntimeInput, "repositoryId">) {
  const {
    audioContextRef,
    usingSharedAudioContextRef,
    masterGainRef,
    analyserRef,
    sampleBuffersRef,
    masterVolume,
    backgroundNowPlayingId,
    liveMutationState,
    forcedLiveMutationState,
    setAudioStatus,
    setSampleStatus,
    setRecentWarnings,
  } = surfaceState;

  const { ensureAudioReady } = useLiveLogMonitorAudioBootstrap({
    monitorAudioContext,
    resumeSharedAudio,
    createAudioContext,
    audioContextRef,
    usingSharedAudioContextRef,
    masterGainRef,
    analyserRef,
    setAudioStatus,
    liveEnabled,
    replayActive,
    masterVolume,
    logger,
  });

  const { playRenderedBlobThroughGraph, playPanelTestTone } = useLiveLogMonitorAuxPlayback({
    ensureAudioReady,
    masterGainRef,
    masterVolume,
    activeBlobAudioElements,
    setAudioStatus,
    logger,
    toMessage,
  });

  const { ensureBackgroundBus, applyLogModulation } = useLiveLogMonitorBackgroundAudioEngine(
    {
      ...buildLiveLogMonitorBackgroundAudioEngineInput(surfaceState, viewState),
      liveEnabled,
    },
  );

  const backgroundDeckControl = useLiveLogMonitorBackgroundDeckControl({
    ...buildLiveLogMonitorBackgroundDeckControlInput(
      surfaceState,
      viewState,
      ensureBackgroundBus,
      toMessage,
    ),
  });

  const resetActions = useLiveLogMonitorResetActions(
    buildLiveLogMonitorResetActionsInput(surfaceState),
  );

  const handleSampleLoadError = useCallback(
    (message: string) => {
      setRecentWarnings((current) => appendLiveLogMonitorWarningMessage(current, message));
    },
    [setRecentWarnings],
  );

  const playbackRuntime = useLiveLogMonitorPlayback(
    buildLiveLogMonitorPlaybackInput(
      surfaceState,
      viewState,
      playRenderedBlobThroughGraph,
      logger,
    ),
  );

  return {
    activeBlobAudioElements,
    ensureAudioReady,
    playPanelTestTone,
    backgroundDeckControl,
    resetActions,
    applyLogModulation,
    playbackRuntime,
    backgroundNowPlayingId,
    liveMutationState,
    forcedLiveMutationState,
    sampleBuffersRef,
    setSampleStatus,
    handleSampleLoadError,
  };
}
