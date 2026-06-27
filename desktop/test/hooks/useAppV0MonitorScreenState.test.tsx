import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  reportAppV0MonitorLaunchFailure,
  useAppV0MonitorScreenState,
} from "../../src/hooks/useAppV0MonitorScreenState";
import type { RepositoryAnalysis } from "../../src/types/library";
import type { StartSessionInput, StreamSessionRecord } from "../../src/types/monitor";

const monitorOrchestrationMock = vi.hoisted(() => ({
  createAppV0MonitorOrchestrator: vi.fn(() => ({
    startLibraryMonitoring: vi.fn(),
    startSourceMonitoring: vi.fn(),
    replaySession: vi.fn(),
  })),
}));

vi.mock("../../src/appV0MonitorOrchestration", () => monitorOrchestrationMock);

function createRepository(): RepositoryAnalysis {
  return {
    id: "repo-1",
    title: "visits-service",
    sourcePath: "/logs/visits-service.log",
    storagePath: null,
    sourceKind: "file",
    importedAt: "2026-06-25T20:00:00.000Z",
    suggestedBpm: 126,
    confidence: 0.82,
    summary: "steady pulse",
    analyzerStatus: "ready",
    buildSystem: "none",
    primaryLanguage: "logs",
    javaFileCount: 0,
    testFileCount: 0,
    waveformBins: [0.2, 0.3],
    beatGrid: [],
    bpmCurve: [],
    notes: [],
    tags: [],
    metrics: {},
  };
}

describe("useAppV0MonitorScreenState", () => {
  it("builds app-v0 monitor shell state and waveform bins", () => {
    const setCurrentSection = vi.fn();
    const startSession = vi.fn(
      async (_repo: RepositoryAnalysis, _input: StartSessionInput) => true,
    );
    const attachSession = vi.fn(
      async (_input: {
        session: StreamSessionRecord;
        repoId: string;
        repoTitle: string;
        trackId?: string;
        trackTitle?: string;
      }) => true,
    );
    const playbackSession = vi.fn(
      async (_input: { sessionId: string; sourcePath: string; label: string }) => true,
    );

    const { result } = renderHook(() =>
      useAppV0MonitorScreenState({
        lang: "en",
        currentSection: "library",
        setCurrentSection,
        repositories: [createRepository()],
        selectedRepositoryTitle: "visits-service",
        tracks: [],
        selectedTrack: null,
        session: null,
        metrics: {
          windowCount: 0,
          processedLines: 0,
          totalAnomalies: 0,
        },
        setGuideTrack: vi.fn(),
        resumeAudio: vi.fn(async () => undefined),
        attachSession,
        startSession,
        playbackSession,
      }),
    );

    expect(result.current.t.simpleMode.nav.monitor).toBeDefined();
    expect(result.current.isMonitoring).toBe(false);
    expect(result.current.fallbackViewModel.message.length).toBeGreaterThan(0);
    expect(result.current.waveformBins).toBeUndefined();
    expect(monitorOrchestrationMock.createAppV0MonitorOrchestrator).toHaveBeenCalledTimes(1);
  });

  it("reports failed monitor launches only for unsuccessful results", () => {
    const reporter = vi.fn();

    reportAppV0MonitorLaunchFailure("source", { ok: true }, reporter);
    reportAppV0MonitorLaunchFailure("library", { ok: false, reason: "boom" }, reporter);

    expect(reporter).toHaveBeenCalledTimes(1);
    expect(reporter.mock.calls[0]?.[0]).toContain("library");
    expect(reporter.mock.calls[0]?.[1]).toBe("boom");
  });
});
