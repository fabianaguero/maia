import { describe, expect, it, vi } from "vitest";

import { buildLiveLogMonitorSurfaceInitialState } from "../../../../src/features/analyzer/components/liveLogMonitorSurfaceStateRuntime";

const buildRepoResetMonitorStateMock = vi.fn();

vi.mock("../../../../src/features/analyzer/components/liveLogMonitorPreferencesRuntime", () => ({
  buildRepoResetMonitorState: (...args: unknown[]) => buildRepoResetMonitorStateMock(...args),
}));

describe("liveLogMonitorSurfaceStateRuntime", () => {
  it("maps repo reset defaults into the surface initial state", () => {
    buildRepoResetMonitorStateMock.mockReturnValue({
      masterVolume: 0.61,
      selectedStyleProfileId: "style-x",
      selectedMutationProfileId: "mutation-y",
      basePlaylist: { id: "playlist-1", trackIds: ["track-1"] },
      sceneBaseAssetId: "asset-1",
      sceneCompositionId: "comp-1",
    });

    const state = buildLiveLogMonitorSurfaceInitialState({
      availableBaseAssets: [{ id: "asset-1" }] as never,
      availableCompositions: [{ id: "comp-1" }] as never,
      preferredBaseAssetId: "asset-pref",
      preferredCompositionId: "comp-pref",
      prefs: null,
    });

    expect(buildRepoResetMonitorStateMock).toHaveBeenCalledWith({
      availableBaseAssets: [{ id: "asset-1" }],
      availableCompositions: [{ id: "comp-1" }],
      preferredBaseAssetIdProp: "asset-pref",
      preferredCompositionIdProp: "comp-pref",
      prefs: null,
    });
    expect(state).toEqual({
      masterVolume: 0.61,
      selectedStyleProfileId: "style-x",
      selectedMutationProfileId: "mutation-y",
      basePlaylist: { id: "playlist-1", trackIds: ["track-1"] },
      sceneBaseAssetId: "asset-1",
      sceneCompositionId: "comp-1",
      previousAudibleVolume: 0.61,
    });
  });

  it("keeps a sane audible fallback when the initial volume is muted", () => {
    buildRepoResetMonitorStateMock.mockReturnValue({
      masterVolume: 0,
      selectedStyleProfileId: "style-x",
      selectedMutationProfileId: "mutation-y",
      basePlaylist: null,
      sceneBaseAssetId: "",
      sceneCompositionId: "",
    });

    const state = buildLiveLogMonitorSurfaceInitialState({
      availableBaseAssets: [] as never,
      availableCompositions: [] as never,
      prefs: null,
    });

    expect(state.previousAudibleVolume).toBe(0.45);
  });
});
