import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  closeOwnedLiveLogMonitorAudioContext,
  resolveLiveLogMonitorRepositoryResetState,
  resolveLiveLogMonitorSeedPlaylist,
  resolveNextLiveLogMonitorSceneBaseAssetId,
  resolveNextLiveLogMonitorSceneCompositionId,
  stopLiveLogMonitorBlobAudio,
} from "../../../../src/features/analyzer/components/liveLogMonitorLifecycleRuntime";

const loadMonitorPrefsMock = vi.fn();
const buildRepoResetMonitorStateMock = vi.fn();
const resolveGuideTrackSeedPlaylistMock = vi.fn();
const resolveNextSceneBaseAssetIdMock = vi.fn();
const resolveNextSceneCompositionIdMock = vi.fn();
const stopManagedBlobAudioStateMock = vi.fn();

vi.mock("../../../../src/utils/monitorPrefs", () => ({
  loadMonitorPrefs: (...args: unknown[]) => loadMonitorPrefsMock(...args),
}));

vi.mock(
  "../../../../src/features/analyzer/components/liveLogMonitorPreferencesRuntime",
  () => ({
    buildRepoResetMonitorState: (...args: unknown[]) =>
      buildRepoResetMonitorStateMock(...args),
    resolveGuideTrackSeedPlaylist: (...args: unknown[]) =>
      resolveGuideTrackSeedPlaylistMock(...args),
    resolveNextSceneBaseAssetId: (...args: unknown[]) =>
      resolveNextSceneBaseAssetIdMock(...args),
    resolveNextSceneCompositionId: (...args: unknown[]) =>
      resolveNextSceneCompositionIdMock(...args),
  }),
);

vi.mock("../../../../src/features/analyzer/components/liveLogMonitorAudioRuntime", () => ({
  stopManagedBlobAudioState: (...args: unknown[]) => stopManagedBlobAudioStateMock(...args),
}));

describe("liveLogMonitorLifecycleRuntime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("closes only owned audio contexts", () => {
    const close = vi.fn(async () => undefined);

    closeOwnedLiveLogMonitorAudioContext({
      audioContextRef: { current: { close } as never },
      usingSharedAudioContextRef: { current: false },
    });
    closeOwnedLiveLogMonitorAudioContext({
      audioContextRef: { current: { close } as never },
      usingSharedAudioContextRef: { current: true },
    });

    expect(close).toHaveBeenCalledTimes(1);
  });

  it("delegates scene selection and guide playlist resolution", () => {
    resolveNextSceneBaseAssetIdMock.mockReturnValue("asset-1");
    resolveNextSceneCompositionIdMock.mockReturnValue("comp-1");
    resolveGuideTrackSeedPlaylistMock.mockReturnValue({ trackIds: ["track-1"] });

    expect(
      resolveNextLiveLogMonitorSceneBaseAssetId({
        currentSceneBaseAssetId: "",
        availableBaseAssets: [{ id: "asset-1" }] as never,
        preferredBaseAssetId: "asset-pref",
      }),
    ).toBe("asset-1");
    expect(
      resolveNextLiveLogMonitorSceneCompositionId({
        currentSceneCompositionId: "",
        availableCompositions: [{ id: "comp-1" }] as never,
        preferredCompositionId: "comp-pref",
      }),
    ).toBe("comp-1");
    expect(
      resolveLiveLogMonitorSeedPlaylist({
        currentTrackCount: 0,
        guideTrackPath: "/music/a.wav",
        availableTracks: [{ id: "track-1" }] as never,
      }),
    ).toEqual({ trackIds: ["track-1"] });
  });

  it("loads prefs and resolves repository reset state", () => {
    loadMonitorPrefsMock.mockReturnValue({ selectedStyleProfileId: "club" });
    buildRepoResetMonitorStateMock.mockReturnValue({ reset: true });

    expect(
      resolveLiveLogMonitorRepositoryResetState({
        repositoryId: "repo-1",
        availableBaseAssets: [] as never,
        availableCompositions: [] as never,
        preferredBaseAssetId: "base-a",
        preferredCompositionId: "comp-a",
      }),
    ).toEqual({ reset: true });

    expect(loadMonitorPrefsMock).toHaveBeenCalledWith("repo-1");
    expect(buildRepoResetMonitorStateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        prefs: { selectedStyleProfileId: "club" },
        preferredBaseAssetIdProp: "base-a",
        preferredCompositionIdProp: "comp-a",
      }),
    );
  });

  it("delegates blob audio shutdown", () => {
    const elements = new Set();
    stopLiveLogMonitorBlobAudio(elements as never);
    expect(stopManagedBlobAudioStateMock).toHaveBeenCalledWith(elements);
  });
});
