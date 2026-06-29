import {
  buildLiveLogMonitorBackgroundLifecycleInput,
  buildLiveLogMonitorSurfaceSyncInput,
} from "./liveLogMonitorPanelAudioInputRuntime";
import type { createManagedBlobAudioRegistry } from "./liveLogMonitorAudioRuntime";
import type { BackgroundDeckState } from "./liveLogMonitorBackgroundDeckRuntime";
import type { UseLiveLogMonitorPanelAudioRuntimeInput } from "./liveLogMonitorPanelAudioTypes";
import { useLiveLogMonitorBackgroundLifecycle } from "./useLiveLogMonitorBackgroundLifecycle";
import { useLiveLogMonitorSampleBank } from "./useLiveLogMonitorSampleBank";
import { useLiveLogMonitorSurfaceSync } from "./useLiveLogMonitorSurfaceSync";
import type { PlaylistTransitionPlan } from "../../../utils/playlistTransition";

interface UseLiveLogMonitorPanelAudioEffectsInput {
  repositoryId: UseLiveLogMonitorPanelAudioRuntimeInput["repositoryId"];
  liveEnabled: UseLiveLogMonitorPanelAudioRuntimeInput["liveEnabled"];
  surfaceState: UseLiveLogMonitorPanelAudioRuntimeInput["surfaceState"];
  viewState: UseLiveLogMonitorPanelAudioRuntimeInput["viewState"];
  activeBlobAudioElements: ReturnType<typeof createManagedBlobAudioRegistry>;
  sampleBuffersRef: UseLiveLogMonitorPanelAudioRuntimeInput["surfaceState"]["sampleBuffersRef"];
  setSampleStatus: UseLiveLogMonitorPanelAudioRuntimeInput["surfaceState"]["setSampleStatus"];
  handleSampleLoadError: (message: string) => void;
  backgroundDeckControl: {
    stopBackgroundDeck: () => void;
    startBackgroundDeck: (
      context: AudioContext,
      trackIndex: number,
      transitionPlan?: PlaylistTransitionPlan | null,
    ) => Promise<void>;
    scheduleBackgroundTransition: (context: AudioContext, deck: BackgroundDeckState) => void;
  };
}

function createAudioContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  const audioConstructor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  return audioConstructor ? new audioConstructor() : null;
}

export function useLiveLogMonitorPanelAudioEffects({
  repositoryId,
  liveEnabled,
  surfaceState,
  viewState,
  activeBlobAudioElements,
  sampleBuffersRef,
  setSampleStatus,
  handleSampleLoadError,
  backgroundDeckControl,
}: UseLiveLogMonitorPanelAudioEffectsInput) {
  useLiveLogMonitorSampleBank({
    sampleSources: viewState.scene.sampleSources,
    audioContextRef: surfaceState.audioContextRef,
    sampleBuffersRef,
    setSampleStatus,
    createAudioContext,
    onLoadError: handleSampleLoadError,
  });

  useLiveLogMonitorSurfaceSync({
    activeBlobAudioElements,
    ...buildLiveLogMonitorSurfaceSyncInput(repositoryId, surfaceState, viewState),
  });

  useLiveLogMonitorBackgroundLifecycle(
    buildLiveLogMonitorBackgroundLifecycleInput(
      liveEnabled,
      surfaceState,
      viewState,
      backgroundDeckControl,
    ),
  );
}
