import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { RepositoryOverviewPanel } from "../../src/features/analyzer/components/RepositoryOverviewPanel";
import type { RepositoryAnalysis } from "../../src/types/library";

function createRepository(overrides: Partial<RepositoryAnalysis> = {}): RepositoryAnalysis {
  return {
    id: "repo-1",
    title: "services",
    sourcePath: "/repos/services",
    storagePath: "/managed/repos/services",
    sourceKind: "directory",
    importedAt: "2026-06-28T20:00:00.000Z",
    suggestedBpm: 126,
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
    metrics: {},
    ...overrides,
  };
}

describe("RepositoryOverviewPanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders intake summary, source, storage and tags for directory sources", () => {
    render(<RepositoryOverviewPanel repository={createRepository()} />);

    expect(screen.getByText("Code / log intake")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Local filesystem repository snapshotted into Maia storage for deterministic heuristics.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Monorepo translated into a deterministic BPM profile."),
    ).toBeInTheDocument();
    expect(screen.getByText("/repos/services")).toBeInTheDocument();
    expect(screen.getByText("/managed/repos/services")).toBeInTheDocument();
    expect(screen.getByText("backend")).toBeInTheDocument();
    expect(screen.getByText("otel")).toBeInTheDocument();
  });

  it("falls back to remote/file intake copy and missing managed snapshot text", () => {
    render(
      <RepositoryOverviewPanel
        repository={createRepository({
          sourceKind: "url",
          storagePath: null,
          tags: [],
        })}
      />,
    );

    expect(
      screen.getByText(
        "Remote GitHub reference stored for metadata-only intake until clone support lands.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("No managed snapshot")).toBeInTheDocument();
    expect(screen.queryByText("backend")).not.toBeInTheDocument();
  });
});
