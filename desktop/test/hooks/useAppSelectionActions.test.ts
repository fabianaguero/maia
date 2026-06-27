import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAppSelectionActions } from "../../src/hooks/useAppSelectionActions";

describe("useAppSelectionActions", () => {
  function buildInput() {
    return {
      armPlaylistBase: vi.fn(),
      armTrackBase: vi.fn(),
      library: {
        setSelectedTrackId: vi.fn(),
      },
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
    };
  }

  it("arms and routes track inspection to inspect mode", () => {
    const input = buildInput();
    const { result } = renderHook(() => useAppSelectionActions(input));

    act(() => {
      result.current.inspectTrack("track-1");
    });

    expect(input.armTrackBase).toHaveBeenCalledWith("track-1");
    expect(input.setAnalysisMode).toHaveBeenCalledWith("track");
    expect(input.setScreen).toHaveBeenCalledWith("inspect");
  });

  it("opens simple monitoring only when the repository exists", () => {
    const input = buildInput();
    const { result } = renderHook(() => useAppSelectionActions(input));

    act(() => {
      result.current.startSimpleMonitoring("repo-1", "track-9");
    });

    expect(input.library.setSelectedTrackId).toHaveBeenCalledWith("track-9");
    expect(input.setPillar).toHaveBeenCalledWith("perform");
    expect(input.setScreen).toHaveBeenCalledWith("session");

    vi.clearAllMocks();

    act(() => {
      result.current.startSimpleMonitoring("missing", "track-9");
    });

    expect(input.library.setSelectedTrackId).not.toHaveBeenCalled();
    expect(input.setPillar).not.toHaveBeenCalled();
    expect(input.setScreen).not.toHaveBeenCalled();
  });
});
