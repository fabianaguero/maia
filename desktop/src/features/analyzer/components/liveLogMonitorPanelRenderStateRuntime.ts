import type { ComponentProps } from "react";

import type { AppTranslations } from "../../../i18n/en";
import type { LiveLogMonitorHeader } from "./LiveLogMonitorHeader";
import type { LiveLogMonitorSetupSection } from "./LiveLogMonitorSetupSection";

export interface BuildLiveLogMonitorHeaderPropsInput {
  t: AppTranslations;
  replayActive: boolean;
  activeAdapterLabel: string;
  audioStatus: string;
  deckStatusLabel: string;
  audioBadgeTone: string;
  audioBadgeLabel: string;
  liveEnabled: boolean;
  bounceAction: ComponentProps<typeof LiveLogMonitorHeader>["bounceAction"];
  onEnsureAudioReady: ComponentProps<typeof LiveLogMonitorHeader>["onEnsureAudioReady"];
  onPlayTestTone: ComponentProps<typeof LiveLogMonitorHeader>["onPlayTestTone"];
  onStop: ComponentProps<typeof LiveLogMonitorHeader>["onStop"];
  onBounce: ComponentProps<typeof LiveLogMonitorHeader>["onBounce"];
}

export function buildLiveLogMonitorHeaderProps(
  input: BuildLiveLogMonitorHeaderPropsInput,
): ComponentProps<typeof LiveLogMonitorHeader> {
  return {
    title: input.t.inspect.liveMonitorDeckTitle,
    subtitle: input.replayActive
      ? input.t.inspect.liveMonitorReplayCopy
      : input.t.inspect.liveMonitorLiveCopy,
    deckStatusLabel: input.deckStatusLabel,
    activeAdapterLabel: input.activeAdapterLabel,
    audioBadgeTone: input.audioBadgeTone,
    audioBadgeLabel: input.audioBadgeLabel,
    audioBadgeTitle:
      input.audioStatus === "ready"
        ? input.t.inspect.audioEngineActive
        : input.t.inspect.audioEngineBlocked,
    testAudioLabel: input.t.inspect.testAudio,
    liveEnabled: input.liveEnabled,
    stopLabel: input.replayActive ? input.t.session.exitReplay : input.t.inspect.stopMonitor,
    bounceAction: input.bounceAction,
    onEnsureAudioReady: input.onEnsureAudioReady,
    onPlayTestTone: input.onPlayTestTone,
    onStop: input.onStop,
    onBounce: input.onBounce,
  };
}

export interface BuildLiveLogMonitorSetupPropsInput {
  t: AppTranslations;
  liveEnabled: boolean;
  adapterKind: ComponentProps<typeof LiveLogMonitorSetupSection>["adapterKind"];
  adapterDescription: string;
  adapterTarget: string;
  selectedStyleProfileId: string;
  selectedMutationProfileId: string;
  selectedStyleProfile: ComponentProps<typeof LiveLogMonitorSetupSection>["selectedStyleProfile"];
  selectedMutationProfile: ComponentProps<
    typeof LiveLogMonitorSetupSection
  >["selectedMutationProfile"];
  forcedLiveMutationState: ComponentProps<
    typeof LiveLogMonitorSetupSection
  >["forcedLiveMutationState"];
  hasBaseListeningBed: boolean;
  baseTrackCount: number;
  adapterConfigured: boolean;
  cueEnginePreviewLabel: string;
  liveMutationStateLabel: string;
  error: string | null;
  isStarting: boolean;
  pendingAddTrackId: string;
  pendingLoadPlaylistId: string;
  basePlaylist: ComponentProps<typeof LiveLogMonitorSetupSection>["basePlaylist"];
  basePlaylistTrackOptions: ComponentProps<
    typeof LiveLogMonitorSetupSection
  >["basePlaylistTrackOptions"];
  savedPlaylistOptions: ComponentProps<typeof LiveLogMonitorSetupSection>["savedPlaylistOptions"];
  basePlaylistEditorItems: ComponentProps<
    typeof LiveLogMonitorSetupSection
  >["basePlaylistEditorItems"];
  availablePlaylists: ComponentProps<typeof LiveLogMonitorSetupSection>["availablePlaylists"];
  availableTracks: ComponentProps<typeof LiveLogMonitorSetupSection>["availableTracks"];
  setBasePlaylist: ComponentProps<typeof LiveLogMonitorSetupSection>["setBasePlaylist"];
  setPendingAddTrackId: ComponentProps<typeof LiveLogMonitorSetupSection>["setPendingAddTrackId"];
  setPendingLoadPlaylistId: ComponentProps<
    typeof LiveLogMonitorSetupSection
  >["setPendingLoadPlaylistId"];
  setAdapterKind: ComponentProps<typeof LiveLogMonitorSetupSection>["setAdapterKind"];
  setSelectedStyleProfileId: ComponentProps<
    typeof LiveLogMonitorSetupSection
  >["setSelectedStyleProfileId"];
  setSelectedMutationProfileId: ComponentProps<
    typeof LiveLogMonitorSetupSection
  >["setSelectedMutationProfileId"];
  setForcedLiveMutationState: ComponentProps<
    typeof LiveLogMonitorSetupSection
  >["setForcedLiveMutationState"];
  onStart: ComponentProps<typeof LiveLogMonitorSetupSection>["onStart"];
}

export function buildLiveLogMonitorSetupProps(
  input: BuildLiveLogMonitorSetupPropsInput,
): ComponentProps<typeof LiveLogMonitorSetupSection> {
  return {
    visible: !input.liveEnabled,
    t: input.t,
    adapterKind: input.adapterKind,
    adapterDescription: input.adapterDescription,
    adapterTarget: input.adapterTarget,
    selectedStyleProfileId: input.selectedStyleProfileId,
    selectedMutationProfileId: input.selectedMutationProfileId,
    selectedStyleProfile: input.selectedStyleProfile,
    selectedMutationProfile: input.selectedMutationProfile,
    forcedLiveMutationState: input.forcedLiveMutationState,
    hasBaseListeningBed: input.hasBaseListeningBed,
    baseTrackCount: input.baseTrackCount,
    adapterConfigured: input.adapterConfigured,
    cueEnginePreviewLabel: input.cueEnginePreviewLabel,
    liveMutationStateLabel: input.liveMutationStateLabel,
    error: input.error,
    isStarting: input.isStarting,
    pendingAddTrackId: input.pendingAddTrackId,
    pendingLoadPlaylistId: input.pendingLoadPlaylistId,
    basePlaylist: input.basePlaylist,
    basePlaylistTrackOptions: input.basePlaylistTrackOptions,
    savedPlaylistOptions: input.savedPlaylistOptions,
    basePlaylistEditorItems: input.basePlaylistEditorItems,
    availablePlaylists: input.availablePlaylists,
    availableTracks: input.availableTracks,
    setBasePlaylist: input.setBasePlaylist,
    setPendingAddTrackId: input.setPendingAddTrackId,
    setPendingLoadPlaylistId: input.setPendingLoadPlaylistId,
    setAdapterKind: input.setAdapterKind,
    setSelectedStyleProfileId: input.setSelectedStyleProfileId,
    setSelectedMutationProfileId: input.setSelectedMutationProfileId,
    setForcedLiveMutationState: input.setForcedLiveMutationState,
    onStart: input.onStart,
  };
}
