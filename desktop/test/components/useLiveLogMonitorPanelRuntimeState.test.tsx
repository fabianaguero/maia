import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLiveLogMonitorPanelRuntimeState } from "../../src/features/analyzer/components/useLiveLogMonitorPanelRuntimeState";

const buildLiveLogMonitorViewModel = vi.fn();
const useLiveLogMonitorPanelAudioRuntime = vi.fn();
const useLiveLogMonitorReplayState = vi.fn();

vi.mock("../../src/features/analyzer/components/liveLogMonitorViewModel", () => ({
  buildLiveLogMonitorViewModel: (...args: unknown[]) => buildLiveLogMonitorViewModel(...args),
}));

vi.mock("../../src/features/analyzer/components/useLiveLogMonitorPanelAudioRuntime", () => ({
  useLiveLogMonitorPanelAudioRuntime: (...args: unknown[]) => useLiveLogMonitorPanelAudioRuntime(...args),
}));

vi.mock("../../src/features/analyzer/components/useLiveLogMonitorReplayState", () => ({
  useLiveLogMonitorReplayState: (...args: unknown[]) => useLiveLogMonitorReplayState(...args),
}));

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

describe("useLiveLogMonitorPanelRuntimeState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    buildLiveLogMonitorViewModel.mockReturnValue({
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
    });
    useLiveLogMonitorPanelAudioRuntime.mockReturnValue({
      activeBlobAudioElements: { stopAll: vi.fn() },
      ensureAudioReady: vi.fn(),
      playPanelTestTone: vi.fn(),
      backgroundDeckControl: { ensureBackgroundAudio: vi.fn(), stopBackgroundDeck: vi.fn() },
      resetActions: { applyRepositoryReset: vi.fn(), applyStartReset: vi.fn(), applyStopReset: vi.fn() },
      applyLogModulation: vi.fn(),
      playbackRuntime: { playWithCurrentEngine: vi.fn(), handleSequencerStepFire: vi.fn() },
    });
    useLiveLogMonitorReplayState.mockReturnValue({ replaySessionId: "session-1" });
  });

  it("assembles view-model, audio runtime and replay runtime into a stable hook state", () => {
    const input = createInput();

    const { result } = renderHook(() => useLiveLogMonitorPanelRuntimeState(input));

    expect(buildLiveLogMonitorViewModel).toHaveBeenCalledWith(
      expect.objectContaining({
        repositoryId: "repo-1",
        sceneBaseAssetId: "asset-1",
      }),
    );
    expect(useLiveLogMonitorPanelAudioRuntime).toHaveBeenCalledWith(
      expect.objectContaining({
        repositoryId: "repo-1",
        liveEnabled: true,
        replayActive: true,
      }),
    );
    expect(useLiveLogMonitorReplayState).toHaveBeenCalledWith(
      expect.objectContaining({
        persistedSessionId: "session-1",
        backgroundPlayheadSecond: 18,
      }),
    );
    expect(result.current).toMatchObject({
      activeAdapterLabel: "FILE_TAIL",
      adapterTarget: "/logs/service.log",
      replayState: { replaySessionId: "session-1" },
    });
  });

  it("reuses memoized state on rerender with the same input reference and recomputes on change", () => {
    const input = createInput();
    const { rerender } = renderHook(
      ({ value }) => useLiveLogMonitorPanelRuntimeState(value),
      {
        initialProps: { value: input },
      },
    );

    expect(buildLiveLogMonitorViewModel).toHaveBeenCalledTimes(1);

    rerender({ value: input });

    expect(buildLiveLogMonitorViewModel).toHaveBeenCalledTimes(1);

    const nextInput = {
      ...input,
      replayActive: false,
      liveEnabled: false,
      surfaceState: {
        ...input.surfaceState,
        backgroundPlayheadSecond: 32,
      },
    };

    rerender({ value: nextInput });

    expect(buildLiveLogMonitorViewModel).toHaveBeenCalledTimes(2);
    expect(useLiveLogMonitorPanelAudioRuntime).toHaveBeenLastCalledWith(
      expect.objectContaining({
        liveEnabled: false,
        replayActive: false,
      }),
    );
    expect(useLiveLogMonitorReplayState).toHaveBeenLastCalledWith(
      expect.objectContaining({
        replayActive: false,
        backgroundPlayheadSecond: 32,
      }),
    );
  });

  it("handles detached monitor sessions when no persisted replay context exists", () => {
    const input = createInput();
    input.monitor.session = null;
    input.monitor.playbackEventIndex = null;
    input.replayActive = false;
    useLiveLogMonitorReplayState.mockReturnValue({ replaySessionId: null });

    const { result } = renderHook(() => useLiveLogMonitorPanelRuntimeState(input));

    expect(useLiveLogMonitorReplayState).toHaveBeenCalledWith(
      expect.objectContaining({
        persistedSessionId: undefined,
        replayActive: false,
        playbackEventIndex: null,
      }),
    );
    expect(result.current.replayState).toEqual({ replaySessionId: null });
  });
});
