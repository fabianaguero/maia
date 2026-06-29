import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLiveLogMonitorSurfaceState } from "../../../../src/features/analyzer/components/useLiveLogMonitorSurfaceState";

const loadMonitorPrefsMock = vi.fn();
const createBasePlaylistMock = vi.fn();
const preferredBaseAssetIdMock = vi.fn();
const preferredCompositionIdMock = vi.fn();

vi.mock("../../../../src/utils/monitorPrefs", () => ({
  loadMonitorPrefs: (...args: unknown[]) => loadMonitorPrefsMock(...args),
  createBasePlaylist: (...args: unknown[]) => createBasePlaylistMock(...args),
}));

vi.mock("../../../../src/features/analyzer/components/liveLogMonitorViewModel", () => ({
  preferredBaseAssetId: (...args: unknown[]) => preferredBaseAssetIdMock(...args),
  preferredCompositionId: (...args: unknown[]) => preferredCompositionIdMock(...args),
}));

function createInput() {
  return {
    repository: { id: "repo-1" },
    availableBaseAssets: [{ id: "asset-1" }],
    availableCompositions: [{ id: "comp-1" }],
    preferredBaseAssetId: "asset-pref",
    preferredCompositionId: "comp-pref",
  } as never;
}

describe("useLiveLogMonitorSurfaceState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createBasePlaylistMock.mockReturnValue({ id: "playlist-empty", items: [] });
    preferredBaseAssetIdMock.mockReturnValue("asset-1");
    preferredCompositionIdMock.mockReturnValue("comp-1");
  });

  it("hydrates persisted monitor preferences and selected scene ids", () => {
    loadMonitorPrefsMock.mockReturnValue({
      masterVolume: 0.61,
      selectedStyleProfileId: "style-x",
      selectedMutationProfileId: "mutation-y",
      basePlaylist: { id: "playlist-1", items: [{ trackId: "track-1" }] },
    });

    const { result } = renderHook(() => useLiveLogMonitorSurfaceState(createInput()));

    expect(loadMonitorPrefsMock).toHaveBeenCalledWith("repo-1");
    expect(result.current.masterVolume).toBe(0.61);
    expect(result.current.selectedStyleProfileId).toBe("style-x");
    expect(result.current.selectedMutationProfileId).toBe("mutation-y");
    expect(result.current.basePlaylist).toEqual({
      id: "playlist-1",
      items: [{ trackId: "track-1" }],
    });
    expect(result.current.sceneBaseAssetId).toBe("asset-1");
    expect(result.current.sceneCompositionId).toBe("comp-1");
    expect(result.current.previousAudibleVolumeRef.current).toBe(0.61);
    expect(preferredBaseAssetIdMock).toHaveBeenCalled();
    expect(preferredCompositionIdMock).toHaveBeenCalled();
  });

  it("falls back to default playlist and baseline state when prefs are missing", () => {
    loadMonitorPrefsMock.mockReturnValue(null);

    const { result } = renderHook(() => useLiveLogMonitorSurfaceState(createInput()));

    expect(createBasePlaylistMock).toHaveBeenCalledWith([]);
    expect(result.current.masterVolume).toBe(0.45);
    expect(result.current.basePlaylist).toEqual({ id: "playlist-empty", items: [] });
    expect(result.current.audioStatus).toBe("idle");
    expect(result.current.sampleStatus).toBe("unavailable");
    expect(result.current.liveMutationState).toBe("normal");
    expect(result.current.forcedLiveMutationState).toBe("auto");
    expect(result.current.expanded).toBe(false);
  });

  it("updates mutable state through the returned setters", () => {
    loadMonitorPrefsMock.mockReturnValue(null);

    const { result } = renderHook(() => useLiveLogMonitorSurfaceState(createInput()));

    act(() => {
      result.current.setMasterVolume(0.8);
      result.current.setExpanded(true);
      result.current.setSelectedExplanationId("exp-1");
      result.current.setBackgroundNowPlayingId("track-9");
    });

    expect(result.current.masterVolume).toBe(0.8);
    expect(result.current.expanded).toBe(true);
    expect(result.current.selectedExplanationId).toBe("exp-1");
    expect(result.current.backgroundNowPlayingId).toBe("track-9");
  });
});
