import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAppContentNavigationActions } from "../../src/hooks/useAppContentNavigationActions";

const tauriCoreMock = vi.hoisted(() => ({
  invoke: vi.fn(),
  isTauri: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => tauriCoreMock);

function createInput() {
  return {
    userMode: "simple" as const,
    notify: vi.fn(),
    t: {
      appShell: {
        monitoringBackgroundTitle: "Background",
        monitoringBackgroundBody: "Still listening",
      },
    },
    setPillar: vi.fn(),
    setScreen: vi.fn(),
    setLibraryTab: vi.fn(),
  };
}

describe("useAppContentNavigationActions", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("opens the connections route and adapts pillar navigation", () => {
    const input = createInput();
    const { result } = renderHook(() => useAppContentNavigationActions(input));

    act(() => {
      result.current.handleOpenConnections();
      result.current.handlePillarChange("perform");
    });

    expect(input.setPillar).toHaveBeenCalled();
    expect(input.setScreen).toHaveBeenCalled();
    expect(input.setLibraryTab).toHaveBeenCalledWith("connections");
  });

  it("hides to background only in tauri runtime and emits a notification", async () => {
    const input = createInput();
    tauriCoreMock.isTauri.mockReturnValue(true);
    tauriCoreMock.invoke.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAppContentNavigationActions(input));

    await act(async () => {
      await result.current.handleHideToBackground();
    });

    expect(tauriCoreMock.invoke).toHaveBeenCalledWith("hide_window");
    expect(input.notify).toHaveBeenCalledWith("info", "Background", "Still listening");
  });
});
