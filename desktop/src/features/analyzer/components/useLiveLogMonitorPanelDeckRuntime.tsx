import type { AppTranslations } from "../../../i18n/types";
import type { RepositoryAnalysis } from "../../../types/library";
import type { MonitorContextValue } from "../../monitor/MonitorContext";
import { buildLiveLogMonitorPanelRenderState } from "./liveLogMonitorPanelRenderState";
import {
  buildLiveLogMonitorDeckModelInput,
  buildLiveLogMonitorOperatorActionsInput,
  buildLiveLogMonitorPanelRenderStateInput,
  buildLiveLogMonitorSessionActionsInput,
} from "./liveLogMonitorPanelDeckRuntimeBridge";
import { useLiveLogMonitorDeckModel } from "./useLiveLogMonitorDeckModel";
import { useLiveLogMonitorOperatorActions } from "./useLiveLogMonitorOperatorActions";
import { useLiveLogMonitorSessionActions } from "./useLiveLogMonitorSessionActions";
import type { useLiveLogMonitorSurfaceState } from "./useLiveLogMonitorSurfaceState";
import { type ManagedBlobAudioElement } from "./liveLogMonitorAudioRuntime";
import type { LiveMonitorStartResetState } from "./liveLogMonitorSessionRuntime";
import type { LiveMonitorStopResetState } from "./liveLogMonitorActionRuntime";

type LiveLogMonitorSurfaceState = ReturnType<typeof useLiveLogMonitorSurfaceState>;

export interface UseLiveLogMonitorPanelDeckRuntimeInput {
  t: AppTranslations;
  repository: RepositoryAnalysis;
  monitor: MonitorContextValue;
  liveEnabled: boolean;
  replayActive: boolean;
  playbackPercent: number | null;
  playbackWindowLabel: string | null;
  availableTracks: Parameters<typeof useLiveLogMonitorDeckModel>[0]["availableTracks"];
  availablePlaylists: Parameters<typeof useLiveLogMonitorDeckModel>[0]["availablePlaylists"];
  availableBaseAssets: Parameters<typeof useLiveLogMonitorDeckModel>[0]["availableBaseAssets"];
  availableCompositions: Parameters<typeof useLiveLogMonitorDeckModel>[0]["availableCompositions"];
  surfaceState: LiveLogMonitorSurfaceState;
  selectedStyleProfile: Parameters<
    typeof buildLiveLogMonitorPanelRenderState
  >[0]["selectedStyleProfile"];
  selectedMutationProfile: Parameters<
    typeof buildLiveLogMonitorPanelRenderState
  >[0]["selectedMutationProfile"];
  availableBaseTrackOptions: Parameters<
    typeof useLiveLogMonitorDeckModel
  >[0]["availableBaseTrackOptions"];
  backgroundNowPlayingTrack: Parameters<
    typeof useLiveLogMonitorDeckModel
  >[0]["backgroundNowPlayingTrack"];
  backgroundTransitionNextTrack: Parameters<
    typeof useLiveLogMonitorDeckModel
  >[0]["backgroundTransitionNextTrack"];
  traceWaveformTrack: Parameters<typeof useLiveLogMonitorDeckModel>[0]["traceWaveformTrack"];
  traceWaveformExplanations: Parameters<
    typeof useLiveLogMonitorDeckModel
  >[0]["traceWaveformExplanations"];
  selectedTraceExplanation: Parameters<
    typeof useLiveLogMonitorDeckModel
  >[0]["selectedTraceExplanation"];
  traceWaveformCues: Parameters<typeof useLiveLogMonitorDeckModel>[0]["traceWaveformCues"];
  currentReplayExplanation: unknown;
  referenceAnchorBpm: number | null;
  scene: Parameters<typeof useLiveLogMonitorDeckModel>[0]["scene"];
  baseTrackCount: number;
  hasBaseListeningBed: boolean;
  activeAdapterLabel: string;
  adapterDescription: string;
  adapterTarget: string;
  cueEnginePreviewLabel: string;
  liveMutationStateLabel: string;
  replaySessionId: string | null;
  replayFeedbackRecommendation: Parameters<
    typeof useLiveLogMonitorDeckModel
  >[0]["replayFeedbackRecommendation"];
  sortedSessionBookmarks: Parameters<
    typeof useLiveLogMonitorDeckModel
  >[0]["sortedSessionBookmarks"];
  activeReplayBookmark: Parameters<typeof useLiveLogMonitorDeckModel>[0]["activeReplayBookmark"];
  bookmarkLabelDraft: string;
  setBookmarkLabelDraft: (value: string) => void;
  bookmarkNoteDraft: string;
  setBookmarkNoteDraft: (value: string) => void;
  bookmarkTagDraft: string | null;
  setBookmarkTagDraft: (
    updater: string | null | ((current: string | null) => string | null),
  ) => void;
  bookmarkStyleProfileIdDraft: string | null;
  setBookmarkStyleProfileIdDraft: (value: string | null) => void;
  bookmarkMutationProfileIdDraft: string | null;
  setBookmarkMutationProfileIdDraft: (value: string | null) => void;
  bookmarkBusy: boolean;
  bookmarkError: string | null;
  captureCurrentScene: () => void;
  saveReplayBookmark: () => Promise<unknown>;
  deleteReplayBookmark: (
    bookmark: Parameters<typeof useLiveLogMonitorDeckModel>[0]["sortedSessionBookmarks"][number],
  ) => Promise<unknown>;
  playPanelTestTone: () => Promise<void> | void;
  ensureAudioReady: () => Promise<AudioContext | null>;
  ensureBackgroundAudio: (context: AudioContext) => Promise<void>;
  stopBackgroundDeck: () => void;
  activeBlobAudioElements: Set<ManagedBlobAudioElement>;
  handleSequencerStepFire: Parameters<typeof useLiveLogMonitorDeckModel>[0]["onSequencerStepFire"];
  applyStartReset: (resetState: LiveMonitorStartResetState) => void;
  applyStopReset: (resetState: LiveMonitorStopResetState) => void;
}

export function useLiveLogMonitorPanelDeckRuntime(input: UseLiveLogMonitorPanelDeckRuntimeInput) {
  const sessionActions = useLiveLogMonitorSessionActions(
    buildLiveLogMonitorSessionActionsInput(input),
  );
  const operatorActions = useLiveLogMonitorOperatorActions(
    buildLiveLogMonitorOperatorActionsInput(input),
  );
  const liveDeckProps = useLiveLogMonitorDeckModel(
    buildLiveLogMonitorDeckModelInput(input, operatorActions),
  );

  return buildLiveLogMonitorPanelRenderState(
    buildLiveLogMonitorPanelRenderStateInput(input, liveDeckProps, sessionActions),
  );
}
