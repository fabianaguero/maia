import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLiveLogMonitorPanelViewState } from "../../src/features/analyzer/components/useLiveLogMonitorPanelViewState";

const buildLiveLogMonitorViewModel = vi.fn();

vi.mock("../../src/features/analyzer/components/liveLogMonitorViewModel", () => ({
  buildLiveLogMonitorViewModel: (...args: unknown[]) => buildLiveLogMonitorViewModel(...args),
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

describe("useLiveLogMonitorPanelViewState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    buildLiveLogMonitorViewModel.mockReturnValue({
      scene: { id: "scene-1" },
      selectedStyleProfile: { id: "style-1" },
    });
  });

  it("builds a stable memoized view state from the runtime input", () => {
    const input = createInput();

    const { result, rerender } = renderHook(({ value }) => useLiveLogMonitorPanelViewState(value), {
      initialProps: { value: input },
    });

    expect(buildLiveLogMonitorViewModel).toHaveBeenCalledWith(
      expect.objectContaining({
        repositoryId: "repo-1",
        sessionRepoId: "repo-1",
        sceneBaseAssetId: "asset-1",
      }),
    );
    expect(result.current.viewState).toMatchObject({
      scene: { id: "scene-1" },
      selectedStyleProfile: { id: "style-1" },
    });

    rerender({ value: input });
    expect(buildLiveLogMonitorViewModel).toHaveBeenCalledTimes(1);

    rerender({
      value: {
        ...input,
        replayActive: false,
      },
    });
    expect(buildLiveLogMonitorViewModel).toHaveBeenCalledTimes(2);
  });
});
