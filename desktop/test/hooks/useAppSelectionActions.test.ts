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

  it("routes simple and expert selection handlers to the expected stores", () => {
    const input = buildInput();
    const { result } = renderHook(() => useAppSelectionActions(input));

    act(() => {
      result.current.selectSimpleTrack("track-2");
      result.current.selectSimpleRepository("repo-1");
      result.current.selectTrack("track-7");
      result.current.selectPlaylist("playlist-2");
      result.current.selectRepository("repo-1");
      result.current.selectBaseAsset("preset-1");
      result.current.selectComposition("composition-4");
    });

    expect(input.library.setSelectedTrackId).toHaveBeenCalledWith("track-2");
    expect(input.repositories.setSelectedRepositoryId).toHaveBeenCalledWith("repo-1");
    expect(input.armTrackBase).toHaveBeenCalledWith("track-7");
    expect(input.armPlaylistBase).toHaveBeenCalledWith("playlist-2");
    expect(input.baseAssets.setSelectedBaseAssetId).toHaveBeenCalledWith("preset-1");
    expect(input.compositions.setSelectedCompositionId).toHaveBeenCalledWith("composition-4");
    expect(input.setAnalysisMode).toHaveBeenNthCalledWith(1, "track");
    expect(input.setAnalysisMode).toHaveBeenNthCalledWith(2, "repo");
    expect(input.setAnalysisMode).toHaveBeenNthCalledWith(3, "base");
  });

  it("arms and routes track inspection to inspect mode", () => {
    const input = buildInput();
    const { result } = renderHook(() => useAppSelectionActions(input));

    act(() => {
      result.current.inspectTrack("track-1");
      result.current.inspectRepository("repo-1");
      result.current.inspectBaseAsset("preset-1");
      result.current.inspectComposition("composition-9");
    });

    expect(input.armTrackBase).toHaveBeenCalledWith("track-1");
    expect(input.repositories.setSelectedRepositoryId).toHaveBeenCalledWith("repo-1");
    expect(input.baseAssets.setSelectedBaseAssetId).toHaveBeenCalledWith("preset-1");
    expect(input.compositions.setSelectedCompositionId).toHaveBeenCalledWith("composition-9");
    expect(input.setAnalysisMode).toHaveBeenNthCalledWith(1, "track");
    expect(input.setAnalysisMode).toHaveBeenNthCalledWith(2, "repo");
    expect(input.setAnalysisMode).toHaveBeenNthCalledWith(3, "base");
    expect(input.setScreen).toHaveBeenNthCalledWith(1, "inspect");
    expect(input.setScreen).toHaveBeenNthCalledWith(2, "inspect");
    expect(input.setScreen).toHaveBeenNthCalledWith(3, "inspect");
    expect(input.setScreen).toHaveBeenNthCalledWith(4, "compose");
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

  it("opens navigation targets and wizard sessions only for valid repo/preset pairs", () => {
    const input = buildInput();
    const { result } = renderHook(() => useAppSelectionActions(input));

    act(() => {
      result.current.goLibrary();
      result.current.goCompose();
      result.current.startSimpleWizardSession("repo-1", "preset-1");
    });

    expect(input.setScreen).toHaveBeenNthCalledWith(1, "library");
    expect(input.setScreen).toHaveBeenNthCalledWith(2, "compose");
    expect(input.setPillar).toHaveBeenCalledWith("perform");
    expect(input.setScreen).toHaveBeenNthCalledWith(3, "session");

    vi.clearAllMocks();

    act(() => {
      result.current.startSimpleWizardSession("missing", "preset-1");
      result.current.startSimpleWizardSession("repo-1", "missing");
    });

    expect(input.setPillar).not.toHaveBeenCalled();
    expect(input.setScreen).not.toHaveBeenCalled();
  });
});
