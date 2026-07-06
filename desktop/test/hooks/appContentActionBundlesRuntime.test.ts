import { describe, expect, it, vi } from "vitest";

import {
  buildAppContentActionBundleInputs,
  buildAppContentActionBundlesResult,
  buildAppContentCatalogActionsInput,
  buildAppContentMonitorActionsInput,
  buildAppContentNavigationActionsInput,
  buildAppContentShellActionSetters,
  buildAppContentSelectionActionsInput,
} from "../../src/hooks/appContentActionBundlesRuntime";

function createDomainState() {
  return {
    t: { appShell: {}, nav: {} },
    userMode: "simple",
    shellState: {
      setNewlyImportedId: vi.fn(),
      setAnalysisMode: vi.fn(),
      setScreen: vi.fn(),
      setPillar: vi.fn(),
      setLibraryTab: vi.fn(),
    },
    library: {},
    repositories: {},
    baseAssets: {},
    compositions: {},
    sessions: {},
    monitor: {},
  } as never;
}

describe("appContentActionBundlesRuntime", () => {
  it("builds narrowed hook inputs and a stable bundle result", () => {
    const input = createDomainState();
    const notify = vi.fn();
    const monitorActions = { armPlaylistBase: vi.fn(), armTrackBase: vi.fn() } as never;
    const catalogActions = { handleImportTrack: vi.fn() } as never;
    const selectionActions = { selectTrack: vi.fn() } as never;
    const navigationActions = { handleOpenConnections: vi.fn() } as never;

    const shell = buildAppContentShellActionSetters(input);
    const bundleInputs = buildAppContentActionBundleInputs(input, notify);
    const monitorInput = buildAppContentMonitorActionsInput(input, notify);
    const catalogInput = buildAppContentCatalogActionsInput(input, notify);
    const selectionInput = buildAppContentSelectionActionsInput(input, monitorActions);
    const navigationInput = buildAppContentNavigationActionsInput(input, notify);

    expect(shell.setAnalysisMode).toBe(input.shellState.setAnalysisMode);
    expect(bundleInputs.monitorInput.notify).toBe(notify);
    expect(bundleInputs.catalogInput.setNewlyImportedId).toBe(input.shellState.setNewlyImportedId);
    expect(bundleInputs.navigationInput.setLibraryTab).toBe(input.shellState.setLibraryTab);
    expect(monitorInput.notify).toBe(notify);
    expect(monitorInput.setPillar).toBe(input.shellState.setPillar);
    expect(catalogInput.setNewlyImportedId).toBe(input.shellState.setNewlyImportedId);
    expect(selectionInput.armPlaylistBase).toBe(monitorActions.armPlaylistBase);
    expect(selectionInput.setScreen).toBe(input.shellState.setScreen);
    expect(navigationInput.notify).toBe(notify);
    expect(navigationInput.setLibraryTab).toBe(input.shellState.setLibraryTab);

    expect(
      buildAppContentActionBundlesResult({
        notify,
        monitorActions,
        catalogActions,
        selectionActions,
        navigationActions,
      }),
    ).toEqual({
      notify,
      monitorActions,
      catalogActions,
      selectionActions,
      navigationActions,
    });
  });
});
