import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSimpleMonitorLaunchState } from "../../../src/features/simple/useSimpleMonitorLaunchState";
import { en } from "../../../src/i18n/en";

const state = vi.hoisted(() => ({
  sourceSelector: {
    filteredMonitorSourceOptions: [],
    selectedSourceOption: {
      id: "repo:repo-1",
      kind: "repository" as const,
      title: "visits-service",
      sourcePath: "/logs/visits-service.log",
      repoId: "repo-1",
    },
    canStartSelectedSource: true,
    sourceEmptyMessage: "No sources",
    startHint: "Ready",
    selectedSourceId: "repo:repo-1",
    setSelectedSourceId: vi.fn(),
    sourceFilter: "all" as const,
    setSourceFilter: vi.fn(),
    isLaunchingMonitor: false,
    setIsLaunchingMonitor: vi.fn(),
  },
  executeSimpleMonitorStartRequest: vi.fn(async () => true),
}));

vi.mock("../../../src/features/simple/useSimpleMonitorSourceSelector", () => ({
  useSimpleMonitorSourceSelector: () => state.sourceSelector,
}));

vi.mock("../../../src/features/simple/simpleMonitorInteractionRuntime", () => ({
  executeSimpleMonitorStartRequest: state.executeSimpleMonitorStartRequest,
}));

describe("useSimpleMonitorLaunchState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.executeSimpleMonitorStartRequest.mockResolvedValue(true);
  });

  it("exposes selector state and delegates monitoring start", async () => {
    const onResumeAudio = vi.fn(async () => undefined);
    const onStartMonitoring = vi.fn();

    const { result } = renderHook(() =>
      useSimpleMonitorLaunchState({
        repositories: [],
        isListening: false,
        t: en,
        onResumeAudio,
        onStartMonitoring,
      }),
    );

    expect(result.current.selectedSourceId).toBe("repo:repo-1");
    expect(result.current.canStartSelectedSource).toBe(true);

    await act(async () => {
      await result.current.handleStartMonitoringRequest();
    });

    await waitFor(() => {
      expect(state.executeSimpleMonitorStartRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedSourceOption: state.sourceSelector.selectedSourceOption,
          canStartSelectedSource: true,
          resumeAudio: onResumeAudio,
          startMonitoring: onStartMonitoring,
        }),
      );
    });
  });

  it("logs an error when the monitor start request fails after launch setup", async () => {
    const onResumeAudio = vi.fn(async () => undefined);
    const onStartMonitoring = vi.fn();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    window.requestAnimationFrame = ((callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    }) as typeof window.requestAnimationFrame;

    state.executeSimpleMonitorStartRequest.mockImplementationOnce(async (input) => {
      input.setLaunchingImmediate();
      await input.waitForNextFrame();
      input.resetLaunchingOnFailure();
      return false;
    });

    const { result } = renderHook(() =>
      useSimpleMonitorLaunchState({
        repositories: [],
        isListening: false,
        t: en,
        onResumeAudio,
        onStartMonitoring,
      }),
    );

    await act(async () => {
      await result.current.handleStartMonitoringRequest();
    });

    expect(state.sourceSelector.setIsLaunchingMonitor).toHaveBeenNthCalledWith(1, true);
    expect(state.sourceSelector.setIsLaunchingMonitor).toHaveBeenNthCalledWith(2, false);
    expect(consoleError).toHaveBeenCalledWith("Failed to start monitor from selector");

    window.requestAnimationFrame = originalRequestAnimationFrame;
    consoleError.mockRestore();
  });
});
