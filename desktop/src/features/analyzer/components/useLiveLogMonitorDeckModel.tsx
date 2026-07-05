import { useCallback, useMemo, type Dispatch, type SetStateAction } from "react";

import type { SessionBookmark } from "../../../api/sessions";
import type { AppTranslations } from "../../../i18n/types";
import type {
  BaseAssetRecord,
  BaseTrackPlaylist,
  CompositionResultRecord,
  LibraryTrack,
  LiveLogMarker,
  LiveLogStreamUpdate,
  RepositoryAnalysis,
} from "../../../types/library";
import type { LiveMutationExplanation } from "../../../utils/liveMutationExplainability";
import type { ReplayFeedbackRecommendation } from "../../../utils/replayFeedback";
import type { ArrangementVoice, ComponentOverride, RoutedLiveCue } from "./liveSonificationScene";
import type { SyncTailRow } from "./liveLogMonitorPanelRuntime";
import type { AudioEngineStatus, LiveLogMonitorViewModel } from "./liveLogMonitorViewModel";
import {
  applyLiveLogMonitorComponentOverride,
  buildLiveLogMonitorDeckModelState,
} from "./liveLogMonitorDeckModelRuntime";

export interface UseLiveLogMonitorDeckModelInput {
  t: AppTranslations;
  repository: RepositoryAnalysis;
  liveEnabled: boolean;
  replayActive: boolean;
  playbackPercent: number | null;
  playbackWindowLabel: string | null;
  playbackProgress: number | null;
  playbackEventCount: number | null;
  playbackEventIndex: number | null;
  isPlaybackPaused: boolean;
  persistedSessionId: string | null;
  sessionRepoTitle: string | null;
  sessionRepoId: string | null;
  session: unknown;
  metrics: {
    windowCount: number;
    processedLines: number;
    totalAnomalies: number;
  };
  bounceWindowCount: number;
  beatClockBpm: number | null;
  beatLooperActive: boolean;
  backgroundPlayheadSecond: number;
  backgroundNowPlayingTrack: LibraryTrack | null;
  backgroundTransitionNextTrack: LibraryTrack | null;
  backgroundTransitionPlan: unknown;
  availableTracks: LibraryTrack[];
  availablePlaylists: BaseTrackPlaylist[];
  availableBaseAssets: BaseAssetRecord[];
  availableCompositions: CompositionResultRecord[];
  availableBaseTrackOptions: LibraryTrack[];
  basePlaylist: BaseTrackPlaylist | null;
  baseTrackCount: number;
  hasBaseListeningBed: boolean;
  adapterDescription: string;
  adapterTarget: string;
  activeAdapterLabel: string;
  cueEnginePreviewLabel: string;
  liveMutationStateLabel: string;
  lastUpdate: LiveLogStreamUpdate | null;
  recentMarkers: LiveLogMarker[];
  recentWarnings: string[];
  recentCues: RoutedLiveCue[];
  recentVoices: ArrangementVoice[];
  recentExplanations: LiveMutationExplanation[];
  selectedExplanationId: string | null;
  selectedTraceExplanation: LiveMutationExplanation | null;
  traceWaveformTrack: LibraryTrack | null;
  traceWaveformExplanations: LiveMutationExplanation[];
  traceWaveformCues: unknown[];
  activeTailWindowId: string | null;
  syncTailRows: SyncTailRow[];
  analyserRef: { current: AnalyserNode | null };
  syncTailListRef: { current: HTMLDivElement | null };
  error: string | null;
  isAnomalyFlash: boolean;
  audioStatus: AudioEngineStatus;
  sampleStatus: "unavailable" | "loading" | "ready" | "error";
  sampleSourceCount: number;
  emittedCueCount: number;
  emittedVoiceCount: number;
  selectedStyleProfile: {
    label: string;
    description: string;
  };
  selectedMutationProfile: {
    label: string;
    description: string;
  };
  scene: LiveLogMonitorViewModel["scene"];
  sceneBaseAssetId: string;
  sceneCompositionId: string;
  knownComponents: string[];
  componentOverrides: Map<string, ComponentOverride>;
  masterVolume: number;
  replayFeedbackRecommendation: ReplayFeedbackRecommendation | null;
  activeReplayBookmark: SessionBookmark | null;
  sortedSessionBookmarks: SessionBookmark[];
  bookmarkLabelDraft: string;
  bookmarkNoteDraft: string;
  bookmarkTagDraft: string | null;
  bookmarkStyleProfileIdDraft: string | null;
  bookmarkMutationProfileIdDraft: string | null;
  bookmarkBusy: boolean;
  bookmarkError: string | null;
  setComponentOverrides: Dispatch<SetStateAction<Map<string, ComponentOverride>>>;
  setSceneBaseAssetId: Dispatch<SetStateAction<string>>;
  setSceneCompositionId: Dispatch<SetStateAction<string>>;
  onSelectExplanation: (explanation: LiveMutationExplanation) => void;
  onSequencerStepFire: (
    firings: Array<{
      track: "foundation" | "motion" | "accent";
      step: number;
      humanizeOffsetMs: number;
    }>,
  ) => void;
  onSetMasterVolume: (nextVolume: number) => void;
  onToggleMute: () => void;
  onStepWindow: (direction: -1 | 1) => void;
  onTogglePause: () => void;
  onSeekProgress: (progress: number) => void;
  onBookmarkLabelChange: (value: string) => void;
  onBookmarkNoteChange: (value: string) => void;
  onBookmarkTagToggle: (tagId: string) => void;
  onBookmarkStyleProfileChange: (value: string | null) => void;
  onBookmarkMutationProfileChange: (value: string | null) => void;
  onCaptureCurrentScene: () => void;
  onSaveBookmark: () => void;
  onDeleteCurrentBookmark: () => void;
  onJumpToBookmark: (bookmark: SessionBookmark) => void;
  onApplyBookmarkSuggestion: (bookmark: SessionBookmark) => void;
  onDeleteBookmark: (bookmark: SessionBookmark) => void;
  onApplyReplayFeedbackRecommendation: () => void;
}

export function useLiveLogMonitorDeckModel(input: UseLiveLogMonitorDeckModelInput) {
  const handleComponentOverrideChange = useCallback(
    (component: string, override: ComponentOverride) => {
      applyLiveLogMonitorComponentOverride({
        setComponentOverrides: input.setComponentOverrides,
        component,
        override,
      });
    },
    [input],
  );

  return useMemo(
    () =>
      buildLiveLogMonitorDeckModelState({
        deckInput: input,
        onOverrideChange: handleComponentOverrideChange,
      }),
    [handleComponentOverrideChange, input],
  );
}
