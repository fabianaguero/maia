import { describe, expect, it, vi } from "vitest";

import {
  buildAppSelectionActionsResult,
  buildAppSelectionEntityActionsInput,
  buildAppSelectionMonitorActionsInput,
} from "../../src/hooks/appSelectionActionsRuntime";

function createInput() {
  return {
    armPlaylistBase: vi.fn(),
    armTrackBase: vi.fn(),
    library: { setSelectedTrackId: vi.fn() },
    repositories: {
      repositories: [{ id: "repo-1" }],
      setSelectedRepositoryId: vi.fn(),
    },
    baseAssets: {
      baseAssets: [{ id: "preset-1" }],
      setSelectedBaseAssetId: vi.fn(),
    },
    compositions: {
      setSelectedCompositionId: vi.fn(),
    },
    setAnalysisMode: vi.fn(),
    setPillar: vi.fn(),
    setScreen: vi.fn(),
  } as never;
}

describe("appSelectionActionsRuntime", () => {
  it("builds narrowed entity/monitor inputs and a stable merged result", () => {
    const input = createInput();
    const entityInput = buildAppSelectionEntityActionsInput(input);
    const monitorInput = buildAppSelectionMonitorActionsInput(input);
    const entityActions = { selectTrack: vi.fn(), inspectTrack: vi.fn() } as never;
    const monitorActions = { goLibrary: vi.fn(), startSimpleMonitoring: vi.fn() } as never;

    expect(entityInput.armPlaylistBase).toBe(input.armPlaylistBase);
    expect(entityInput.setAnalysisMode).toBe(input.setAnalysisMode);
    expect(entityInput.setScreen).toBe(input.setScreen);
    expect(monitorInput.baseAssets).toBe(input.baseAssets);
    expect(monitorInput.setPillar).toBe(input.setPillar);
    expect(monitorInput.setScreen).toBe(input.setScreen);

    expect(
      buildAppSelectionActionsResult({
        entityActions,
        monitorActions,
      }),
    ).toEqual({
      ...entityActions,
      ...monitorActions,
    });
  });
});
