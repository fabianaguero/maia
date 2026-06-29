import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { RepositoryAnalysis } from "../../../src/types/library";
import type { LogSourceConnection } from "../../../src/types/monitor";
import { useSimpleMonitorSourceSelector } from "../../../src/features/simple/useSimpleMonitorSourceSelector";
import { buildMonitorSourceCopy } from "../../../src/features/simple/monitorSourceOptions";
import { en } from "../../../src/i18n/en";

const repositoriesMock = vi.hoisted(() => ({
  listLogSourceConnections: vi.fn(),
}));

vi.mock("../../../src/api/repositories", () => repositoriesMock);

const fileRepository: RepositoryAnalysis = {
  id: "repo-1",
  title: "visits-service",
  sourcePath: "/tmp/visits-service.log",
  sourceKind: "file",
  importedAt: "2026-06-25T12:00:00.000Z",
  suggestedBpm: null,
  confidence: 0.8,
  summary: "ready",
  analyzerStatus: "ready",
  buildSystem: "spring",
  primaryLanguage: "java",
  javaFileCount: 4,
  testFileCount: 2,
  waveformBins: [],
  beatGrid: [],
  bpmCurve: [],
  notes: [],
  tags: [],
  metrics: {},
};

const cloudConnection: LogSourceConnection = {
  id: "cloud-1",
  kind: "gcp_cloud_run",
  label: "services",
  sourceUri: "gcp-cloud-run://innate-portal/services",
  enabled: true,
  adapterKind: "process",
  config: {},
  lastCursor: 0,
  lastSeenAt: null,
  createdAt: "2026-06-25T12:00:00.000Z",
  updatedAt: "2026-06-25T12:00:00.000Z",
};

describe("useSimpleMonitorSourceSelector", () => {
  beforeEach(() => {
    repositoriesMock.listLogSourceConnections.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads persistent connections and exposes cloud monitor options", async () => {
    repositoriesMock.listLogSourceConnections.mockResolvedValue([cloudConnection]);

    const { result } = renderHook(() =>
      useSimpleMonitorSourceSelector({
        repositories: [fileRepository],
        selectedSoundId: "track-1",
        isListening: false,
        copy: buildMonitorSourceCopy(en),
      }),
    );

    await waitFor(() => {
      expect(result.current.allMonitorSourceOptions).toHaveLength(2);
    });

    expect(
      result.current.allMonitorSourceOptions.some((source) => source.connectionId === "cloud-1"),
    ).toBe(true);
  });

  it("falls back to an empty persistent connection list when the API returns a non-array value", async () => {
    repositoriesMock.listLogSourceConnections.mockResolvedValue({ invalid: true });

    const { result } = renderHook(() =>
      useSimpleMonitorSourceSelector({
        repositories: [fileRepository],
        selectedSoundId: "track-1",
        isListening: false,
        copy: buildMonitorSourceCopy(en),
      }),
    );

    await waitFor(() => {
      expect(result.current.persistentConnections).toEqual([]);
    });

    expect(result.current.cloudConnectionCount).toBe(0);
    expect(result.current.allMonitorSourceOptions).toHaveLength(1);
  });

  it("recovers with an empty persistent connection list when loading connections fails", async () => {
    repositoriesMock.listLogSourceConnections.mockRejectedValue(new Error("offline"));

    const { result } = renderHook(() =>
      useSimpleMonitorSourceSelector({
        repositories: [fileRepository],
        selectedSoundId: "track-1",
        isListening: false,
        copy: buildMonitorSourceCopy(en),
      }),
    );

    await waitFor(() => {
      expect(result.current.persistentConnections).toEqual([]);
    });

    expect(result.current.allMonitorSourceOptions).toHaveLength(1);
    expect(result.current.sourceEmptyMessage).toBe(en.simpleMode.setup.emptyDefault);
  });

  it("clears launching state once monitoring becomes active", async () => {
    const { result, rerender } = renderHook(
      ({ isListening }) =>
        useSimpleMonitorSourceSelector({
          repositories: [fileRepository],
          selectedSoundId: "track-1",
          isListening,
          copy: buildMonitorSourceCopy(en),
        }),
      {
        initialProps: { isListening: false },
      },
    );

    act(() => {
      result.current.setIsLaunchingMonitor(true);
    });
    expect(result.current.isLaunchingMonitor).toBe(true);

    rerender({ isListening: true });

    await waitFor(() => {
      expect(result.current.isLaunchingMonitor).toBe(false);
    });
  });

  it("resets the selected source when the active filter excludes it", async () => {
    const { result } = renderHook(() =>
      useSimpleMonitorSourceSelector({
        repositories: [fileRepository],
        selectedSoundId: "track-1",
        isListening: false,
        copy: buildMonitorSourceCopy(en),
      }),
    );

    act(() => {
      result.current.setSelectedSourceId("repo-1");
      result.current.setSourceFilter("cloud");
    });

    await waitFor(() => {
      expect(result.current.selectedSourceId).toBe("");
    });
  });
});
