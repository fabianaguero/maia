import type { UseLiveLogMonitorPanelDeckRuntimeInput } from "./useLiveLogMonitorPanelDeckRuntime";
import type { useLiveLogMonitorDeckModel } from "./useLiveLogMonitorDeckModel";

type LiveDeckModelState = ReturnType<typeof useLiveLogMonitorDeckModel>;

export function buildLiveLogMonitorPanelRenderStateInput(
  input: UseLiveLogMonitorPanelDeckRuntimeInput,
  liveDeckProps: LiveDeckModelState,
  sessionActions: {
    handleStart: () => Promise<void>;
    handleStop: () => void;
    handleBounce: () => void;
  },
) {
  const surfaceState = input.surfaceState;

  return {
    t: input.t,
    liveEnabled: input.liveEnabled,
    replayActive: input.replayActive,
    activeAdapterLabel: input.activeAdapterLabel,
    audioStatus: surfaceState.audioStatus,
    adapterKind: surfaceState.adapterKind,
    adapterDescription: input.adapterDescription,
    adapterTarget: input.adapterTarget,
    selectedStyleProfileId: surfaceState.selectedStyleProfileId,
    selectedMutationProfileId: surfaceState.selectedMutationProfileId,
    selectedStyleProfile: input.selectedStyleProfile,
    selectedMutationProfile: input.selectedMutationProfile,
    forcedLiveMutationState: surfaceState.forcedLiveMutationState,
    hasBaseListeningBed: input.hasBaseListeningBed,
    baseTrackCount: input.baseTrackCount,
    adapterConfigured: true,
    cueEnginePreviewLabel: input.cueEnginePreviewLabel,
    liveMutationStateLabel: input.liveMutationStateLabel,
    error: surfaceState.error,
    isStarting: surfaceState.isStarting,
    pendingAddTrackId: surfaceState.pendingAddTrackId,
    pendingLoadPlaylistId: surfaceState.pendingLoadPlaylistId,
    basePlaylist: surfaceState.basePlaylist,
    basePlaylistTrackOptions: liveDeckProps.basePlaylistTrackOptions,
    savedPlaylistOptions: liveDeckProps.savedPlaylistOptions,
    basePlaylistEditorItems: liveDeckProps.basePlaylistEditorItems,
    availablePlaylists: input.availablePlaylists,
    availableTracks: input.availableTracks,
    setBasePlaylist: surfaceState.setBasePlaylist,
    setPendingAddTrackId: surfaceState.setPendingAddTrackId,
    setPendingLoadPlaylistId: surfaceState.setPendingLoadPlaylistId,
    setAdapterKind: surfaceState.setAdapterKind,
    setSelectedStyleProfileId: surfaceState.setSelectedStyleProfileId,
    setSelectedMutationProfileId: surfaceState.setSelectedMutationProfileId,
    setForcedLiveMutationState: surfaceState.setForcedLiveMutationState,
    ctaMetaLabel: liveDeckProps.ctaMetaLabel,
    deckStatusLabel: liveDeckProps.deckStatusLabel,
    audioBadgeTone: liveDeckProps.audioBadgeTone,
    audioBadgeLabel: liveDeckProps.audioBadgeLabel,
    bounceAction: liveDeckProps.bounceAction,
    onEnsureAudioReady: () => void input.ensureAudioReady(),
    onPlayTestTone: () => void input.playPanelTestTone(),
    onStop: () => sessionActions.handleStop(),
    onBounce: () => sessionActions.handleBounce(),
    onStart: () => void sessionActions.handleStart(),
    liveDeckProps: liveDeckProps.liveDeckProps,
  };
}
