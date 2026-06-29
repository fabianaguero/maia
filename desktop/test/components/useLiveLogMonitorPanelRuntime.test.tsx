import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLiveLogMonitorPanelRuntime } from "../../src/features/analyzer/components/useLiveLogMonitorPanelRuntime";

const useLiveLogMonitorPanelRuntimeState = vi.fn();
const useLiveLogMonitorOrchestrator = vi.fn();
const useLiveLogMonitorLifecycle = vi.fn();
const useLiveLogMonitorPanelDeckRuntime = vi.fn();

vi.mock("../../src/features/analyzer/components/useLiveLogMonitorPanelRuntimeState", () => ({
  useLiveLogMonitorPanelRuntimeState: (...args: unknown[]) =>
    useLiveLogMonitorPanelRuntimeState(...args),
}));

vi.mock("../../src/features/analyzer/components/useLiveLogMonitorOrchestrator", () => ({
  useLiveLogMonitorOrchestrator: (...args: unknown[]) =>
    useLiveLogMonitorOrchestrator(...args),
}));

vi.mock("../../src/features/analyzer/components/useLiveLogMonitorLifecycle", () => ({
  useLiveLogMonitorLifecycle: (...args: unknown[]) => useLiveLogMonitorLifecycle(...args),
}));

vi.mock("../../src/features/analyzer/components/useLiveLogMonitorPanelDeckRuntime", () => ({
  useLiveLogMonitorPanelDeckRuntime: (...args: unknown[]) =>
    useLiveLogMonitorPanelDeckRuntime(...args),
}));

function createSurfaceState() {
  return {
    audioContextRef: { current: null },
    backgroundDeckRef: { current: null },
    beatClockRef: { current: null },
    panelAudioProbePlayedRef: { current: false },
    componentOverrides: {},
    knownComponentsRef: { current: [] },
    setLastUpdate: vi.fn(),
    setRecentWarnings: vi.fn(),
    setError: vi.fn(),
    setSyncTailRows: vi.fn(),
    setActiveTailWindowId: vi.fn(),
    setIsAnomalyFlash: vi.fn(),
    setEmittedCueCount: vi.fn(),
    setRecentCues: vi.fn(),
    setRecentMarkers: vi.fn(),
    setRecentExplanations: vi.fn(),
    setBackgroundPlayheadSecond: vi.fn(),
    setSelectedExplanationId: vi.fn(),
    setRecentVoices: vi.fn(),
    setKnownComponents: vi.fn(),
    setBeatClockBpm: vi.fn(),
    basePlaylist: [],
    setSceneBaseAssetId: vi.fn(),
    setSceneCompositionId: vi.fn(),
    setBasePlaylist: vi.fn(),
    usingSharedAudioContextRef: { current: false },
  };
}

function createRuntimeState() {
  return {
    scene: { id: "scene-1" },
    ensureAudioReady: vi.fn(),
    playbackRuntime: {
      playWithCurrentEngine: vi.fn(),
      handleSequencerStepFire: vi.fn(),
    },
    applyLogModulation: vi.fn(),
    playPanelTestTone: vi.fn(),
    activeBlobAudioElements: { stopAll: vi.fn() },
    resetActions: {
      applyRepositoryReset: vi.fn(),
      applyStartReset: vi.fn(),
      applyStopReset: vi.fn(),
    },
    backgroundDeckControl: {
      ensureBackgroundAudio: vi.fn(),
      stopBackgroundDeck: vi.fn(),
    },
    selectedStyleProfile: { id: "style-1" },
    selectedMutationProfile: { id: "mutation-1" },
    availableBaseTrackOptions: [],
    backgroundNowPlayingTrack: null,
    backgroundTransitionNextTrack: null,
    traceWaveformTrack: null,
    traceWaveformExplanations: [],
    selectedTraceExplanation: null,
    traceWaveformCues: [],
    currentReplayExplanation: null,
    referenceAnchor: { bpm: 126 },
    baseTrackCount: 0,
    hasBaseListeningBed: false,
    activeAdapterLabel: "FILE_TAIL",
    adapterDescription: "File tail",
    adapterTarget: "/logs/service.log",
    cueEnginePreviewLabel: "Sample preview",
    liveMutationStateLabel: "Calm",
    replayState: {
      replaySessionId: "session-1",
      replayFeedbackRecommendation: null,
      sortedSessionBookmarks: [],
      activeReplayBookmark: null,
      bookmarkLabelDraft: "",
      setBookmarkLabelDraft: vi.fn(),
      bookmarkNoteDraft: "",
      setBookmarkNoteDraft: vi.fn(),
      bookmarkTagDraft: "",
      setBookmarkTagDraft: vi.fn(),
      bookmarkStyleProfileIdDraft: null,
      setBookmarkStyleProfileIdDraft: vi.fn(),
      bookmarkMutationProfileIdDraft: null,
      setBookmarkMutationProfileIdDraft: vi.fn(),
      bookmarkBusy: false,
      bookmarkError: null,
      captureCurrentScene: vi.fn(),
      saveReplayBookmark: vi.fn(),
      deleteReplayBookmark: vi.fn(),
    },
  };
}

describe("useLiveLogMonitorPanelRuntime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLiveLogMonitorPanelRuntimeState.mockReturnValue(createRuntimeState());
    useLiveLogMonitorOrchestrator.mockReturnValue({ onStreamUpdate: vi.fn() });
    useLiveLogMonitorPanelDeckRuntime.mockReturnValue({ headerProps: { title: "deck" } });
  });

  it("wires runtime state, lifecycle and deck runtime through the orchestration layer", () => {
    const surfaceState = createSurfaceState();

    const input = {
      repository: { id: "repo-1" },
      availableBaseAssets: [],
      availableCompositions: [],
      preferredBaseAssetId: null,
      preferredCompositionId: null,
      availableTracks: [],
      availablePlaylists: [],
      monitor: {
        session: { repoId: "repo-1", persistedSessionId: "session-1" },
        isPlayback: false,
        playbackEventIndex: 5,
        guideTrackPath: "/music/guide.wav",
        subscribe: vi.fn(),
      },
      t: { inspect: {} },
      liveEnabled: true,
      replayActive: false,
      playbackPercent: 24,
      playbackWindowLabel: "5/20",
      surfaceState,
    } as never;

    const { result } = renderHook(() => useLiveLogMonitorPanelRuntime(input));

    expect(useLiveLogMonitorOrchestrator).toHaveBeenCalledWith(
      expect.objectContaining({
        repositoryId: "repo-1",
        sessionRepoId: "repo-1",
        ensureAudioReady: expect.any(Function),
      }),
    );
    expect(useLiveLogMonitorLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({
        repository: input.repository,
        guideTrackPath: "/music/guide.wav",
      }),
    );
    expect(useLiveLogMonitorPanelDeckRuntime).toHaveBeenCalledWith(
      expect.objectContaining({
        liveEnabled: true,
        playbackPercent: 24,
        adapterTarget: "/logs/service.log",
        referenceAnchorBpm: 126,
      }),
    );
    expect(result.current).toEqual({ headerProps: { title: "deck" } });
  });
});
