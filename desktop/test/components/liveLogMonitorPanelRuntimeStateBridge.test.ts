import { describe, expect, it, vi } from "vitest";

import {
  buildLiveLogMonitorPanelAudioRuntimeInput,
  buildLiveLogMonitorPanelRuntimeStateValue,
  buildLiveLogMonitorReplayStateInput,
  buildLiveLogMonitorViewModelInput,
} from "../../src/features/analyzer/components/liveLogMonitorPanelRuntimeStateBridge";

function createInput() {
  return {
    repository: { id: "repo-1" },
    availableBaseAssets: [],
    availableCompositions: [],
    preferredBaseAssetId: null,
    preferredCompositionId: null,
    availableTracks: [],
    monitor: {
      session: { repoId: "repo-1", adapterKind: "file", persistedSessionId: "session-1" },
      playbackEventIndex: 12,
      audioContext: null,
      resumeAudio: vi.fn(),
    },
    liveEnabled: true,
    replayActive: true,
    surfaceState: {
      adapterKind: "file",
      basePlaylist: [],
      sceneBaseAssetId: "asset-1",
      sceneCompositionId: "composition-1",
      selectedStyleProfileId: "style-1",
      selectedMutationProfileId: "mutation-1",
      recentExplanations: [],
      selectedExplanationId: null,
      backgroundNowPlayingId: null,
      backgroundTransitionPlan: null,
      forcedLiveMutationState: "auto",
      liveMutationState: "steady",
      sampleStatus: "ready",
      backgroundPlayheadSecond: 18,
    },
  } as never;
}

function createViewState() {
  return {
    playableBaseTracks: [],
    playableBaseTrackIdsKey: "ids",
    scene: { id: "scene-1" },
    selectedStyleProfile: { id: "style-1" },
    selectedMutationProfile: { id: "mutation-1" },
    effectiveLiveMutationState: "steady",
    currentReplayExplanation: null,
    traceWaveformTrack: null,
    availableBaseTrackOptions: [],
    backgroundNowPlayingTrack: null,
    backgroundTransitionNextTrack: null,
    traceWaveformExplanations: [],
    selectedTraceExplanation: null,
    traceWaveformCues: [],
    referenceAnchor: { bpm: 126 },
    baseTrackCount: 0,
    hasBaseListeningBed: false,
    activeAdapterLabel: "FILE_TAIL",
    adapterDescription: "File tail",
    adapterTarget: "/logs/service.log",
    liveMutationStateLabel: "Calm",
    cueEnginePreviewLabel: "Preview",
  } as never;
}

function createAudioRuntime() {
  return {
    activeBlobAudioElements: { stopAll: vi.fn() },
    ensureAudioReady: vi.fn(),
    playPanelTestTone: vi.fn(),
    backgroundDeckControl: { ensureBackgroundAudio: vi.fn(), stopBackgroundDeck: vi.fn() },
    resetActions: {
      applyRepositoryReset: vi.fn(),
      applyStartReset: vi.fn(),
      applyStopReset: vi.fn(),
    },
    applyLogModulation: vi.fn(),
    playbackRuntime: { playWithCurrentEngine: vi.fn(), handleSequencerStepFire: vi.fn() },
  } as never;
}

describe("liveLogMonitorPanelRuntimeStateBridge", () => {
  it("builds view-model, audio, replay and return snapshots", () => {
    const input = createInput();
    const viewState = createViewState();
    const audioRuntime = createAudioRuntime();
    const replayState = { replaySessionId: "session-1" } as never;

    expect(buildLiveLogMonitorViewModelInput(input)).toMatchObject({
      repositoryId: "repo-1",
      sessionRepoId: "repo-1",
      playbackEventIndex: 12,
      sceneBaseAssetId: "asset-1",
    });

    expect(
      buildLiveLogMonitorPanelAudioRuntimeInput(input, viewState, {
        info: vi.fn(),
        debug: vi.fn(),
        trace: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      } as never),
    ).toMatchObject({
      repositoryId: "repo-1",
      liveEnabled: true,
      replayActive: true,
      viewState: {
        playableBaseTrackIdsKey: "ids",
      },
    });

    expect(buildLiveLogMonitorReplayStateInput(input, viewState)).toMatchObject({
      replayActive: true,
      persistedSessionId: "session-1",
      backgroundPlayheadSecond: 18,
    });

    expect(
      buildLiveLogMonitorPanelRuntimeStateValue(viewState, audioRuntime, replayState),
    ).toMatchObject({
      activeAdapterLabel: "FILE_TAIL",
      adapterTarget: "/logs/service.log",
      replayState,
      backgroundDeckControl: audioRuntime.backgroundDeckControl,
    });
  });

  it("normalizes missing monitor session state for detached live panels", () => {
    const input = createInput();
    input.monitor.session = null;
    input.monitor.playbackEventIndex = null;
    input.replayActive = false;
    input.surfaceState.selectedExplanationId = "exp-1";
    const viewState = createViewState();

    expect(buildLiveLogMonitorViewModelInput(input)).toMatchObject({
      sessionRepoId: null,
      sessionAdapterKind: null,
      replayActive: false,
      selectedExplanationId: "exp-1",
      playbackEventIndex: null,
    });

    expect(buildLiveLogMonitorReplayStateInput(input, viewState)).toMatchObject({
      replayActive: false,
      persistedSessionId: undefined,
      playbackEventIndex: null,
      selectedStyleProfileId: "style-1",
      selectedMutationProfileId: "mutation-1",
    });
  });
});
