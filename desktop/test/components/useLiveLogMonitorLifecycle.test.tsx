import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLiveLogMonitorLifecycle } from "../../src/features/analyzer/components/useLiveLogMonitorLifecycle";

const loadMonitorPrefs = vi.fn();
const buildRepoResetMonitorState = vi.fn();
const resolveGuideTrackSeedPlaylist = vi.fn();
const resolveNextSceneBaseAssetId = vi.fn();
const resolveNextSceneCompositionId = vi.fn();
const stopManagedBlobAudioState = vi.fn();

vi.mock("../../src/utils/monitorPrefs", () => ({
  loadMonitorPrefs: (...args: unknown[]) => loadMonitorPrefs(...args),
}));

vi.mock("../../src/features/analyzer/components/liveLogMonitorPreferencesRuntime", () => ({
  buildRepoResetMonitorState: (...args: unknown[]) => buildRepoResetMonitorState(...args),
  resolveGuideTrackSeedPlaylist: (...args: unknown[]) => resolveGuideTrackSeedPlaylist(...args),
  resolveNextSceneBaseAssetId: (...args: unknown[]) => resolveNextSceneBaseAssetId(...args),
  resolveNextSceneCompositionId: (...args: unknown[]) => resolveNextSceneCompositionId(...args),
}));

vi.mock("../../src/features/analyzer/components/liveLogMonitorAudioRuntime", () => ({
  stopManagedBlobAudioState: (...args: unknown[]) => stopManagedBlobAudioState(...args),
}));

function createInput(overrides: Partial<Parameters<typeof useLiveLogMonitorLifecycle>[0]> = {}) {
  return {
    repository: { id: "repo-1" } as never,
    availableBaseAssets: [],
    availableCompositions: [],
    availableTracks: [],
    preferredBaseAssetId: "base-a",
    preferredCompositionId: "comp-a",
    basePlaylist: null,
    guideTrackPath: "/music/a.wav",
    replayActive: false,
    onStreamUpdate: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
    activeBlobAudioElements: new Set(),
    audioContextRef: { current: null },
    usingSharedAudioContextRef: { current: false },
    setSceneBaseAssetId: vi.fn(),
    setSceneCompositionId: vi.fn(),
    setBasePlaylist: vi.fn(),
    applyRepositoryReset: vi.fn(),
    ...overrides,
  };
}

describe("useLiveLogMonitorLifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadMonitorPrefs.mockReturnValue({ selectedStyleProfileId: "club" });
    buildRepoResetMonitorState.mockReturnValue({ reset: true });
    resolveGuideTrackSeedPlaylist.mockReturnValue({ name: "seed", trackIds: ["track-1"] });
    resolveNextSceneBaseAssetId.mockImplementation(
      ({ currentSceneBaseAssetId }) => currentSceneBaseAssetId,
    );
    resolveNextSceneCompositionId.mockImplementation(
      ({ currentSceneCompositionId }) => currentSceneCompositionId,
    );
  });

  it("seeds playlist state, applies repo reset and subscribes once", () => {
    const unsubscribe = vi.fn();
    const input = createInput({
      subscribe: vi.fn(() => unsubscribe),
      basePlaylist: { name: "empty", trackIds: [] } as never,
      availableTracks: [{ id: "track-1" }] as never,
    });

    const { unmount } = renderHook(() => useLiveLogMonitorLifecycle(input));

    expect(loadMonitorPrefs).toHaveBeenCalledWith("repo-1");
    expect(buildRepoResetMonitorState).toHaveBeenCalled();
    expect(input.applyRepositoryReset).toHaveBeenCalledWith({ reset: true });
    expect(resolveGuideTrackSeedPlaylist).toHaveBeenCalledWith(
      expect.objectContaining({
        guideTrackPath: "/music/a.wav",
      }),
    );
    expect(input.setBasePlaylist).toHaveBeenCalledWith(expect.any(Function));
    expect(input.subscribe).toHaveBeenCalledWith(input.onStreamUpdate);

    const setBasePlaylistUpdater = input.setBasePlaylist.mock.calls[0]?.[0] as (
      current: { trackIds: string[] } | null,
    ) => { name: string; trackIds: string[] } | null;
    expect(setBasePlaylistUpdater(null)).toEqual({ name: "seed", trackIds: ["track-1"] });
    expect(setBasePlaylistUpdater({ trackIds: ["existing"] })).toEqual({ trackIds: ["existing"] });

    unmount();
    expect(unsubscribe).toHaveBeenCalled();
    expect(stopManagedBlobAudioState).toHaveBeenCalledTimes(1);
  });

  it("stops blob playback immediately when replay mode is active", () => {
    const input = createInput({
      replayActive: true,
    });

    renderHook(() => useLiveLogMonitorLifecycle(input));

    expect(stopManagedBlobAudioState).toHaveBeenCalledWith(input.activeBlobAudioElements);
  });

  it("closes owned audio contexts on unmount", () => {
    const close = vi.fn(async () => undefined);
    const input = createInput({
      audioContextRef: { current: { close } as never },
      usingSharedAudioContextRef: { current: false },
    });

    const { unmount } = renderHook(() => useLiveLogMonitorLifecycle(input));
    unmount();

    expect(close).toHaveBeenCalled();
  });

  it("does not seed playlists when no guide-track seed is available and keeps shared audio contexts open", () => {
    resolveGuideTrackSeedPlaylist.mockReturnValueOnce(null);
    const close = vi.fn(async () => undefined);
    const input = createInput({
      basePlaylist: { name: "existing", trackIds: ["track-1"] } as never,
      audioContextRef: { current: { close } as never },
      usingSharedAudioContextRef: { current: true },
    });

    const { unmount } = renderHook(() => useLiveLogMonitorLifecycle(input));

    expect(input.setBasePlaylist).not.toHaveBeenCalled();

    const baseAssetUpdater = input.setSceneBaseAssetId.mock.calls[0]?.[0] as (
      current: string,
    ) => string;
    const compositionUpdater = input.setSceneCompositionId.mock.calls[0]?.[0] as (
      current: string,
    ) => string;
    expect(baseAssetUpdater("base-current")).toBe("base-current");
    expect(compositionUpdater("comp-current")).toBe("comp-current");

    unmount();

    expect(close).not.toHaveBeenCalled();
  });
});
