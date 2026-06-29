import type { ComponentProps } from "react";

import type { AppTranslations } from "../../../i18n/en";
import type { LiveLogMonitorHeader } from "./LiveLogMonitorHeader";
import type { LiveLogMonitorLiveDeck } from "./LiveLogMonitorLiveDeck";
import type { LiveLogMonitorSetupSection } from "./LiveLogMonitorSetupSection";
import {
  buildLiveLogMonitorHeaderProps,
  buildLiveLogMonitorSetupProps,
} from "./liveLogMonitorPanelRenderStateRuntime";

export interface BuildLiveLogMonitorPanelRenderStateInput {
  t: AppTranslations;
  liveEnabled: boolean;
  replayActive: boolean;
  activeAdapterLabel: string;
  audioStatus: string;
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
  ctaMetaLabel: string;
  deckStatusLabel: string;
  audioBadgeTone: string;
  audioBadgeLabel: string;
  bounceAction: ComponentProps<typeof LiveLogMonitorHeader>["bounceAction"];
  onEnsureAudioReady: ComponentProps<typeof LiveLogMonitorHeader>["onEnsureAudioReady"];
  onPlayTestTone: ComponentProps<typeof LiveLogMonitorHeader>["onPlayTestTone"];
  onStop: ComponentProps<typeof LiveLogMonitorHeader>["onStop"];
  onBounce: ComponentProps<typeof LiveLogMonitorHeader>["onBounce"];
  onStart: ComponentProps<typeof LiveLogMonitorSetupSection>["onStart"];
  liveDeckProps: ComponentProps<typeof LiveLogMonitorLiveDeck>;
}

export function buildLiveLogMonitorPanelRenderState(
  input: BuildLiveLogMonitorPanelRenderStateInput,
) {
  return {
    ctaMetaLabel: input.ctaMetaLabel,
    headerProps: buildLiveLogMonitorHeaderProps(input),
    setupProps: buildLiveLogMonitorSetupProps(input),
    liveDeckProps: input.liveDeckProps,
  };
}
