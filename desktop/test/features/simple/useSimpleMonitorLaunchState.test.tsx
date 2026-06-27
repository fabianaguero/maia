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
});
