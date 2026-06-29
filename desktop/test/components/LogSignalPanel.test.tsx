import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { LogSignalPanel } from "../../src/features/analyzer/components/LogSignalPanel";
import type { RepositoryAnalysis } from "../../src/types/library";

function createRepository(overrides: Partial<RepositoryAnalysis> = {}): RepositoryAnalysis {
  return {
    id: "repo-1",
    title: "visits-service.log",
    sourcePath: "/logs/visits-service.log",
    storagePath: null,
    sourceKind: "file",
    importedAt: "2026-06-28T20:00:00.000Z",
    suggestedBpm: 126,
    confidence: 0.84,
    summary: "Live log signal profile.",
    analyzerStatus: "ready",
    buildSystem: "log-tail",
    primaryLanguage: "log",
    javaFileCount: 0,
    testFileCount: 0,
    waveformBins: [0.2, 0.4, 0.6],
    beatGrid: [{ index: 0, second: 0.5 }],
    bpmCurve: [{ second: 0, bpm: 126 }],
    notes: [],
    tags: ["otel"],
    metrics: {
      lineCount: 193,
      anomalyCount: 6,
      timestampedLineCount: 180,
      dominantLevel: "warn",
      levelCounts: { error: 3, warn: 12, info: 178 },
      logCadenceBins: [0.2, 0.5, 0.8, 0.4],
      topComponents: [
        { component: "http-nio-8018", count: 24 },
        { component: "visits-service", count: 18 },
      ],
      anomalyMarkers: [
        {
          lineNumber: 42,
          level: "ERROR",
          component: "visits-service",
          excerpt: "trace_id=abc123 timeout waiting on upstream",
        },
      ],
    },
    ...overrides,
  };
}

describe("LogSignalPanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders log cadence, severity summary, hot components and anomaly markers", () => {
    const { container } = render(<LogSignalPanel repository={createRepository()} />);

    expect(screen.getByText("Log signal map")).toBeInTheDocument();
    expect(screen.getByText("193")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("warn")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("178")).toBeInTheDocument();
    expect(screen.getByText("180")).toBeInTheDocument();
    expect(screen.getByText("http-nio-8018 · 24")).toBeInTheDocument();
    expect(screen.getByText("visits-service · 18")).toBeInTheDocument();
    expect(screen.getByText(/Line 42 · ERROR · visits-service/)).toBeInTheDocument();
    expect(screen.getByText("trace_id=abc123 timeout waiting on upstream")).toBeInTheDocument();
    expect(container.querySelectorAll(".log-cadence-bar")).toHaveLength(4);
  });

  it("falls back to default cadence bins and empty anomaly state when metrics are missing", () => {
    const { container } = render(
      <LogSignalPanel
        repository={createRepository({
          metrics: {},
        })}
      />,
    );

    expect(screen.getAllByText("0").length).toBeGreaterThan(1);
    expect(screen.getByText("unknown")).toBeInTheDocument();
    expect(screen.getByText("No anomaly markers were emitted for this log source.")).toBeInTheDocument();
    expect(screen.queryByText(/Line 42/)).not.toBeInTheDocument();
    expect(container.querySelectorAll(".log-cadence-bar")).toHaveLength(16);
  });
});
