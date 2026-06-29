import type { UseLiveLogMonitorPanelAudioRuntimeInput } from "./liveLogMonitorPanelAudioTypes";
import { useLiveLogMonitorPanelAudioCore } from "./useLiveLogMonitorPanelAudioCore";
import { useLiveLogMonitorPanelAudioEffects } from "./useLiveLogMonitorPanelAudioEffects";

export function useLiveLogMonitorPanelAudioRuntime(
  input: UseLiveLogMonitorPanelAudioRuntimeInput,
) {
  const core = useLiveLogMonitorPanelAudioCore({
    liveEnabled: input.liveEnabled,
    replayActive: input.replayActive,
    monitorAudioContext: input.monitorAudioContext,
    resumeSharedAudio: input.resumeSharedAudio,
    surfaceState: input.surfaceState,
    viewState: input.viewState,
    logger: input.logger,
  });

  useLiveLogMonitorPanelAudioEffects({
    repositoryId: input.repositoryId,
    liveEnabled: input.liveEnabled,
    surfaceState: input.surfaceState,
    viewState: input.viewState,
    activeBlobAudioElements: core.activeBlobAudioElements,
    sampleBuffersRef: core.sampleBuffersRef,
    setSampleStatus: core.setSampleStatus,
    handleSampleLoadError: core.handleSampleLoadError,
    backgroundDeckControl: core.backgroundDeckControl,
  });

  return {
    activeBlobAudioElements: core.activeBlobAudioElements,
    ensureAudioReady: core.ensureAudioReady,
    playPanelTestTone: core.playPanelTestTone,
    backgroundDeckControl: core.backgroundDeckControl,
    resetActions: core.resetActions,
    applyLogModulation: core.applyLogModulation,
    playbackRuntime: core.playbackRuntime,
    backgroundNowPlayingId: core.backgroundNowPlayingId,
    liveMutationState: core.liveMutationState,
    forcedLiveMutationState: core.forcedLiveMutationState,
  };
}
