import { describe, expect, it, vi } from "vitest";

import {
  buildAppSelectionEntityActionRunners,
  buildAppSelectionMonitorActionRunners,
  buildAppSelectionActionsResult,
  buildAppSelectionEntityActionsInput,
  buildAppSelectionMonitorActionsInput,
  inspectAppBaseAsset,
  inspectAppRepository,
  inspectAppTrack,
  presetExists,
  repositoryExists,
  selectAppBaseAsset,
  selectAppRepository,
  selectAppTrack,
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

  it("builds executable entity and monitor runners plus shared helpers", () => {
    const input = createInput();
    const entityInput = buildAppSelectionEntityActionsInput(input);
    const monitorInput = buildAppSelectionMonitorActionsInput(input);
    const entityRunners = buildAppSelectionEntityActionRunners(entityInput);
    const monitorRunners = buildAppSelectionMonitorActionRunners(monitorInput);

    selectAppTrack(input.armTrackBase, input.setAnalysisMode, "track-1");
    selectAppRepository(input.repositories, input.setAnalysisMode, "repo-1");
    selectAppBaseAsset(input.baseAssets, input.setAnalysisMode, "preset-1");
    inspectAppTrack(input.armTrackBase, input.setAnalysisMode, input.setScreen, "track-2");
    inspectAppRepository(input.repositories, input.setAnalysisMode, input.setScreen, "repo-1");
    inspectAppBaseAsset(input.baseAssets, input.setAnalysisMode, input.setScreen, "preset-2");

    entityRunners.selectSimpleTrack("track-3");
    entityRunners.inspectComposition("composition-1");
    monitorRunners.startSimpleMonitoring("repo-1", "track-9");
    monitorRunners.startSimpleWizardSession("repo-1", "preset-1");
    monitorRunners.goLibrary();
    monitorRunners.goCompose();

    expect(repositoryExists(input.repositories.repositories, "repo-1")).toBe(true);
    expect(repositoryExists(input.repositories.repositories, "missing")).toBe(false);
    expect(presetExists(input.baseAssets.baseAssets, "preset-1")).toBe(true);
    expect(presetExists(input.baseAssets.baseAssets, "missing")).toBe(false);
    expect(input.armTrackBase).toHaveBeenCalledWith("track-1");
    expect(input.repositories.setSelectedRepositoryId).toHaveBeenCalledWith("repo-1");
    expect(input.baseAssets.setSelectedBaseAssetId).toHaveBeenCalledWith("preset-2");
    expect(input.library.setSelectedTrackId).toHaveBeenCalledWith("track-9");
    expect(input.compositions.setSelectedCompositionId).toHaveBeenCalledWith("composition-1");
    expect(input.setPillar).toHaveBeenCalledWith("perform");
    expect(input.setScreen).toHaveBeenCalledWith("session");
    expect(input.setScreen).toHaveBeenCalledWith("library");
    expect(input.setScreen).toHaveBeenCalledWith("compose");
  });
});
