import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";
import { InspectRepositoryView } from "../../src/features/inspect/InspectRepositoryView";
import type {
  BaseAssetRecord,
  BaseTrackPlaylist,
  LibraryTrack,
  RepositoryAnalysis,
} from "../../src/types/library";

vi.mock("../../src/features/analyzer/components/RepositoryOverviewPanel", () => ({
  RepositoryOverviewPanel: () => <div data-testid="repo-overview">overview</div>,
}));

vi.mock("../../src/features/analyzer/components/LogSignalPanel", () => ({
  LogSignalPanel: () => <div data-testid="log-signal">signal</div>,
}));

vi.mock("../../src/features/analyzer/components/LiveLogMonitorPanel", () => ({
  LiveLogMonitorPanel: () => <div data-testid="live-monitor">monitor</div>,
}));

vi.mock("../../src/features/analyzer/components/RepositoryMetricsPanel", () => ({
  RepositoryMetricsPanel: () => <div data-testid="repo-metrics">metrics</div>,
}));

const repository: RepositoryAnalysis = {
  id: "repo-1",
  title: "orders.log",
  sourcePath: "/logs/orders.log",
  storagePath: "/snapshots/orders.log.json",
  sourceKind: "file",
  importedAt: "2026-06-20T10:00:00.000Z",
  suggestedBpm: 126,
  confidence: 0.8,
  summary: "Passive log stream",
  analyzerStatus: "ready",
  buildSystem: "spring",
  primaryLanguage: "java",
  javaFileCount: 10,
  testFileCount: 4,
  waveformBins: [0.2, 0.4],
  beatGrid: [{ index: 0, second: 0 }],
  bpmCurve: [{ second: 0, bpm: 126 }],
  notes: ["warn bursts detected"],
  tags: ["logs"],
  metrics: {},
};

const baseAssets: BaseAssetRecord[] = [];
const tracks: LibraryTrack[] = [];
const playlists: BaseTrackPlaylist[] = [];

describe("InspectRepositoryView", () => {
  it("renders repository panels and monitor deck for file sources", () => {
    render(
      <I18nContext.Provider value={en}>
        <InspectRepositoryView
          repository={repository}
          availableBaseAssets={baseAssets}
          availableTracks={tracks}
          availablePlaylists={playlists}
          preferredBaseAssetId={null}
          analyzerLabel="Maia Analyzer"
          contextBar={<div data-testid="context-bar">context</div>}
          onGoCompose={vi.fn()}
        />
      </I18nContext.Provider>,
    );

    expect(screen.getByText("orders.log")).toBeInTheDocument();
    expect(screen.getByTestId("context-bar")).toBeInTheDocument();
    expect(screen.getByTestId("repo-overview")).toBeInTheDocument();
    expect(screen.getByTestId("log-signal")).toBeInTheDocument();
    expect(screen.getByTestId("live-monitor")).toBeInTheDocument();
    expect(screen.getByTestId("repo-metrics")).toBeInTheDocument();
    expect(screen.getByText("warn bursts detected")).toBeInTheDocument();
  });
});
