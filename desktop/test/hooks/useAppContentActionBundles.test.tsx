import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildAppContentCatalogActionsInput,
  buildAppContentMonitorActionsInput,
  buildAppContentNavigationActionsInput,
  buildAppContentSelectionActionsInput,
} from "../../src/hooks/appContentActionBundlesRuntime";
import { useAppContentActionBundles } from "../../src/hooks/useAppContentActionBundles";

const notificationMock = vi.hoisted(() => ({
  useNotify: vi.fn(),
}));

const catalogActionsMock = vi.hoisted(() => ({
  useAppCatalogActions: vi.fn(),
}));

const navigationActionsMock = vi.hoisted(() => ({
  useAppContentNavigationActions: vi.fn(),
}));

const monitorActionsMock = vi.hoisted(() => ({
  useAppMonitorActions: vi.fn(),
}));

const selectionActionsMock = vi.hoisted(() => ({
  useAppSelectionActions: vi.fn(),
}));

vi.mock("../../src/components/NotificationSystem", () => notificationMock);
vi.mock("../../src/hooks/useAppCatalogActions", () => catalogActionsMock);
vi.mock("../../src/hooks/useAppContentNavigationActions", () => navigationActionsMock);
vi.mock("../../src/hooks/useAppMonitorActions", () => monitorActionsMock);
vi.mock("../../src/hooks/useAppSelectionActions", () => selectionActionsMock);

function createInput() {
  return {
    userMode: "simple",
    t: { appShell: {}, nav: {} },
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

describe("useAppContentActionBundles", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("builds sub-hook inputs through runtime helpers and returns a stable bundle", () => {
    const input = createInput();
    const notify = vi.fn();
    const monitorActions = { armPlaylistBase: vi.fn(), armTrackBase: vi.fn() };
    const catalogActions = { handleImportTrack: vi.fn() };
    const selectionActions = { selectTrack: vi.fn() };
    const navigationActions = { handleOpenConnections: vi.fn() };

    notificationMock.useNotify.mockReturnValue({ notify });
    monitorActionsMock.useAppMonitorActions.mockReturnValue(monitorActions);
    catalogActionsMock.useAppCatalogActions.mockReturnValue(catalogActions);
    selectionActionsMock.useAppSelectionActions.mockReturnValue(selectionActions);
    navigationActionsMock.useAppContentNavigationActions.mockReturnValue(navigationActions);

    const { result } = renderHook(() => useAppContentActionBundles(input));

    expect(monitorActionsMock.useAppMonitorActions).toHaveBeenCalledWith(
      buildAppContentMonitorActionsInput(input, notify),
    );
    expect(catalogActionsMock.useAppCatalogActions).toHaveBeenCalledWith(
      buildAppContentCatalogActionsInput(input, notify),
    );
    expect(selectionActionsMock.useAppSelectionActions).toHaveBeenCalledWith(
      buildAppContentSelectionActionsInput(input, monitorActions as never),
    );
    expect(navigationActionsMock.useAppContentNavigationActions).toHaveBeenCalledWith(
      buildAppContentNavigationActionsInput(input, notify),
    );
    expect(result.current).toEqual({
      notify,
      monitorActions,
      catalogActions,
      selectionActions,
      navigationActions,
    });
  });
});
