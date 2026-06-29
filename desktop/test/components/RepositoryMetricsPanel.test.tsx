import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { RepositoryMetricsPanel } from "../../src/features/analyzer/components/RepositoryMetricsPanel";
import type { RepositoryAnalysis } from "../../src/types/library";

function createRepository(overrides: Partial<RepositoryAnalysis> = {}): RepositoryAnalysis {
  return {
    id: "repo-1",
    title: "services",
    sourcePath: "/repos/services",
    storagePath: "/managed/repos/services",
    sourceKind: "directory",
    importedAt: "2026-06-28T20:00:00.000Z",
    suggestedBpm: 126.4,
    confidence: 0.84,
    summary: "Monorepo translated into a deterministic BPM profile.",
    analyzerStatus: "ready",
    buildSystem: "gradle",
    primaryLanguage: "kotlin",
    javaFileCount: 23,
    testFileCount: 7,
    waveformBins: [0.2, 0.4, 0.6],
    beatGrid: [{ index: 0, second: 0.5 }],
    bpmCurve: [{ second: 0, bpm: 126 }],
    notes: [],
    tags: ["backend", "otel"],
    metrics: {
      astEnabled: true,
      astClassCount: 14,
      astMethodCount: 67,
      astEndpointAnnotationCount: 9,
      ktAstEnabled: true,
      ktAstClassCount: 11,
      ktAstFunctionCount: 41,
      parseLanguageFilter: ["kotlin", "java"],
      parseExtensionFilter: [".kt", ".java"],
    },
    ...overrides,
  };
}

describe("RepositoryMetricsPanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders repo-oriented BPM and AST metrics for repository sources", () => {
    render(
      <RepositoryMetricsPanel repository={createRepository()} analyzerLabel="Python analyzer" />,
    );

    expect(screen.getByText("Code BPM status")).toBeInTheDocument();
    expect(screen.getByText("126")).toBeInTheDocument();
    expect(screen.getByText("84%")).toBeInTheDocument();
    expect(screen.getByText("gradle")).toBeInTheDocument();
    expect(screen.getByText("kotlin")).toBeInTheDocument();
    expect(screen.getByText("23")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getAllByText("Managed snapshot").length).toBeGreaterThan(0);
    expect(screen.getByText("tree-sitter")).toBeInTheDocument();
    expect(screen.getByText("14")).toBeInTheDocument();
    expect(screen.getByText("67")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("11")).toBeInTheDocument();
    expect(screen.getByText("41")).toBeInTheDocument();
    expect(screen.getByText("kotlin, java")).toBeInTheDocument();
    expect(screen.getByText(".kt, .java")).toBeInTheDocument();
    expect(screen.getByText("ready")).toBeInTheDocument();
    expect(screen.getByText("Python analyzer")).toBeInTheDocument();
  });

  it("renders log-oriented severity metrics for file sources", () => {
    render(
      <RepositoryMetricsPanel
        repository={createRepository({
          sourceKind: "file",
          suggestedBpm: null,
          buildSystem: "log-tail",
          storagePath: null,
          metrics: {
            lineCount: 193,
            anomalyCount: 6,
            levelCounts: { warn: 12, error: 3 },
          },
        })}
        analyzerLabel="Native stream adapter"
      />,
    );

    expect(screen.getByText("Log signal status")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("log-tail")).toBeInTheDocument();
    expect(screen.getByText("193")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.queryByText("tree-sitter")).not.toBeInTheDocument();
    expect(screen.getByText("Native stream adapter")).toBeInTheDocument();
  });
});
